import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import * as XLSX from 'xlsx';

export const WakaKepsekDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    subjects,
    classes,
    students,
    grades,
    deadlines,
    tracker,
    requestRevision,
    addOrUpdateDeadline,
  } = useSchool();

  // 3-step navigation state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'SUB-RPL');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'CLS-10RPL1');

  // Modals state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [newDeadlineDate, setNewDeadlineDate] = useState('2026-10-25');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Students in active class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClass.id);
  }, [students, activeClass]);

  // Submission Status for active class & subject
  const submissionStatus = useMemo(() => {
    const item = tracker.find(
      (t) => t.subjectId === activeSubject.id && t.classId === activeClass.id
    );
    return item ? item.status : 'belum_mulai';
  }, [tracker, activeSubject, activeClass]);

  const activeDeadline = useMemo(() => {
    return deadlines.find((d) => d.subjectId === activeSubject.id);
  }, [deadlines, activeSubject]);

  // Stats calculation
  const stats = useMemo(() => {
    let highest = 0;
    let lowest = 100;
    let sum = 0;
    let count = 0;
    let tuntas = 0;

    classStudents.forEach((student) => {
      const g = grades.find(
        (grade) =>
          grade.studentId === student.id &&
          grade.subjectId === activeSubject.id &&
          grade.classId === activeClass.id
      );

      if (g && g.finalScore !== null) {
        count++;
        sum += g.finalScore;
        if (g.finalScore > highest) highest = g.finalScore;
        if (g.finalScore < lowest) lowest = g.finalScore;
        if (g.finalScore >= (activeSubject?.kkm || 75)) tuntas++;
      }
    });

    const average = count > 0 ? (sum / count).toFixed(1) : '0.0';
    const lowestFinal = count > 0 ? lowest.toFixed(1) : '0.0';
    const highestFinal = count > 0 ? highest.toFixed(1) : '0.0';
    const absorptionRate = classStudents.length > 0 ? Math.round((tuntas / classStudents.length) * 100) : 0;

    return { highest: highestFinal, lowest: lowestFinal, average, absorptionRate, total: classStudents.length, tuntas };
  }, [classStudents, grades, activeSubject, activeClass]);

  // Handle Revision Submission
  const handleConfirmRevision = () => {
    if (!revisionNote.trim() || !currentUser) return;

    requestRevision(
      activeSubject.id,
      activeClass.id,
      currentUser.name,
      currentUser.role,
      revisionNote
    );

    setShowRevisionModal(false);
    setRevisionNote('');
    setToastMessage(`🔄 Nilai rombel ${activeClass.name} dikembalikan ke Guru pengajar untuk direvisi.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Deadline Update
  const handleSaveDeadline = () => {
    if (!currentUser) return;
    addOrUpdateDeadline(activeSubject.id, newDeadlineDate, currentUser.name);
    setShowDeadlineModal(false);
    setToastMessage(`📅 Batas waktu penyerahan nilai ${activeSubject.name} diperbarui ke ${newDeadlineDate}.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export to Excel (PhpSpreadsheet format)
  const handleExportExcel = () => {
    const dataRows = classStudents.map((st, i) => {
      const g = grades.find(
        (grade) =>
          grade.studentId === st.id &&
          grade.subjectId === activeSubject.id &&
          grade.classId === activeClass.id
      );
      return {
        No: i + 1,
        NISN: st.nisn,
        'Nama Siswa': st.fullName,
        'UH 1': g?.uh1 ?? '',
        'UH 2': g?.uh2 ?? '',
        'UH 3': g?.uh3 ?? '',
        'Rata-Rata UH': g?.avgUh ?? '',
        'UAS Teori': g?.uasTeori ?? '',
        'UAS Praktik': g?.uasPraktik ?? '',
        'Nilai Akhir (NA)': g?.finalScore ?? '',
        'Status KKM': g?.statusKkm ?? 'Belum Lengkap',
        Catatan: g?.competencyNotes ?? '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai Rapor');
    XLSX.writeFile(
      workbook,
      `Rekap_Nilai_${activeSubject.code}_${activeClass.name.replace(/\s+/g, '_')}_SMKN1TP.xlsx`
    );

    setToastMessage('📊 File Excel berhasil diunduh (Kompatibel dengan PhpSpreadsheet).');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-white px-5 py-3 rounded-xl shadow-modal flex items-center gap-3 animate-fadeIn">
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Header Context & Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
            <span>Administrasi Kurikulum & Kepala Sekolah</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">SMKN 1 Tanjungpandan</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Monitoring & Rekap Nilai Rapor Kurikulum Merdeka
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pantau status penyerahan leger nilai, analisis distribusi KKM, serta verifikasi atau kembalikan draf nilai untuk revisi.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowDeadlineModal(true)}
            className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-xl text-xs font-bold shadow-xs border border-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">event</span>
            <span>Atur Batas Waktu Nilai</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Excel (PhpSpreadsheet)</span>
          </button>
        </div>
      </div>

      {/* 3-STEP NAVIGATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Pilih Mapel */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Langkah 1: Pilih Mata Pelajaran
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
          </div>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-surface-container-low text-on-surface font-bold text-sm p-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.code} — {subj.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-on-surface-variant">
            KKM: {activeSubject.kkm.toFixed(1)} • Kategori: {activeSubject.category}
          </span>
        </div>

        {/* Step 2: Pilih Kelas */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Langkah 2: Pilih Kelas / Rombel
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-surface-container-low text-on-surface font-bold text-sm p-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Kelas {cls.name} ({cls.totalStudents} Siswa)
              </option>
            ))}
          </select>
          <span className="text-[11px] text-on-surface-variant">
            Tingkat {activeClass.tingkat} • Konsentrasi: {activeClass.jurusan}
          </span>
        </div>

        {/* Step 3: Status & Action Revision */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Langkah 3: Status Leger Rombel
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                submissionStatus === 'terkirim'
                  ? 'bg-emerald-100 text-emerald-800'
                  : submissionStatus === 'sedang_diisi'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  submissionStatus === 'terkirim'
                    ? 'bg-emerald-600'
                    : submissionStatus === 'sedang_diisi'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}
              ></span>
              {submissionStatus === 'terkirim'
                ? '🟢 Terkirim & Final'
                : submissionStatus === 'sedang_diisi'
                ? '🟡 Sedang Diisi'
                : '🔴 Belum Mulai'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {submissionStatus === 'terkirim' && (
              <button
                onClick={() => setShowRevisionModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">replay</span>
                <span>Kirim Balik untuk Revisi</span>
              </button>
            )}
            {submissionStatus !== 'terkirim' && (
              <div className="text-xs text-on-surface-variant py-2 italic text-center w-full">
                Menunggu penyerahan nilai dari pengajar rombel ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS BAR: Rata-Rata, Tertinggi, Terendah, Daya Serap */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Nilai Rata-Rata Rombel
            </span>
            <span className="text-2xl font-extrabold text-primary mt-0.5">{stats.average}</span>
            <span className="text-[11px] text-on-surface-variant">Standar KKM: {activeSubject.kkm}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">analytics</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Nilai Tertinggi
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-0.5">{stats.highest}</span>
            <span className="text-[11px] text-emerald-800">Capaian Maksimal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">trending_up</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Nilai Terendah
            </span>
            <span className="text-2xl font-extrabold text-rose-700 mt-0.5">{stats.lowest}</span>
            <span className="text-[11px] text-rose-800">Perlu Pengawasan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">trending_down</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Daya Serap (Ketuntasan)
            </span>
            <span className="text-2xl font-extrabold text-secondary mt-0.5">
              {stats.absorptionRate}%
            </span>
            <span className="text-[11px] text-secondary">
              {stats.tuntas} dari {stats.total} Siswa Tuntas
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">pie_chart</span>
          </div>
        </div>
      </div>

      {/* STUDENT GRADES LEDGER TABLE */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden flex flex-col">
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
            <span className="text-sm font-bold text-on-surface">
              Daftar Nilai Siswa: {activeSubject.name} — Kelas {activeClass.name}
            </span>
          </div>
          <div className="text-xs font-semibold text-on-surface-variant">
            Batas Penyerahan: {activeDeadline ? activeDeadline.deadline : '15 Okt 2026'}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-32">NISN</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3 px-2 text-center w-16">UH 1</th>
                <th className="py-3 px-2 text-center w-16">UH 2</th>
                <th className="py-3 px-2 text-center w-16">UH 3</th>
                <th className="py-3 px-2 text-center w-20 text-primary">Rata UH</th>
                <th className="py-3 px-2 text-center w-20">UAS Teori</th>
                <th className="py-3 px-2 text-center w-20">UAS Praktik</th>
                <th className="py-3 px-3 text-center w-24 bg-surface-container-highest text-primary">NA</th>
                <th className="py-3 px-3 text-center w-28">Status KKM</th>
                <th className="py-3 px-4 min-w-[260px]">Catatan Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {classStudents.map((student, idx) => {
                const g = grades.find(
                  (grade) =>
                    grade.studentId === student.id &&
                    grade.subjectId === activeSubject.id &&
                    grade.classId === activeClass.id
                );

                return (
                  <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-outline">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-on-surface-variant">{student.nisn}</td>
                    <td className="py-2.5 px-4 font-bold">{student.fullName}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{g?.uh1 ?? '—'}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{g?.uh2 ?? '—'}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{g?.uh3 ?? '—'}</td>
                    <td className="py-2 px-2 text-center tabular-nums font-bold text-primary">
                      {g?.avgUh ? g.avgUh.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-2 text-center tabular-nums">{g?.uasTeori ?? '—'}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{g?.uasPraktik ?? '—'}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums font-extrabold text-sm text-primary bg-surface-container-highest/60">
                      {g?.finalScore ? g.finalScore.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {g?.finalScore ? (
                        g.finalScore >= activeSubject.kkm ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Tuntas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Remedial
                          </span>
                        )
                      ) : (
                        <span className="text-outline text-[11px]">Belum Nilai</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-on-surface-variant truncate max-w-[280px]">
                      {g?.competencyNotes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision Dialog ("Kirim Balik untuk Revisi") */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-md w-full">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <span className="material-symbols-outlined text-[28px]">reply_all</span>
              <h3 className="text-lg font-bold text-on-surface">Kirim Balik Nilai untuk Revisi</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              Nilai rombel <strong>{activeClass.name}</strong> ({activeSubject.name}) akan dibuka kuncinya agar guru pengajar dapat memperbaiki data. Catatan revisi akan dicatat pada audit log.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">
                Catatan Instruksi Revisi (Wajib Diisi):
              </label>
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Contoh: Mohon perbaiki komponen UAS Praktik siswa atas nama Bayu Saputra dan sesuaikan catatan deskripsi capaian..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={!revisionNote.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Konfirmasi Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Setting Dialog */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="material-symbols-outlined text-[26px]">calendar_clock</span>
              <h3 className="text-base font-bold text-on-surface">Atur Batas Waktu Nilai</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              Tentukan batas akhir penyerahan nilai untuk mata pelajaran <strong>{activeSubject.name}</strong>.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Batas Tanggal (Deadline):</label>
              <input
                type="date"
                value={newDeadlineDate}
                onChange={(e) => setNewDeadlineDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeadlineModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDeadline}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Simpan Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
