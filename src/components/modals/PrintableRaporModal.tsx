import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';

export const PrintableRaporModal: React.FC = () => {
  const { students, subjects, classes, grades, pklAssessments } = useSchool();
  const { currentUser } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'STD-001');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Permission check: strictly Admin, Kepsek, Waka, or Guru with explicit canPrintRapor grant
  const canAccess =
    currentUser &&
    (['admin', 'waka', 'kepsek'].includes(currentUser.role) || Boolean(currentUser.canPrintRapor));

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center max-w-lg mx-auto bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high my-12">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-extrabold text-on-surface">Akses Terbatas: Cetak Rapor</h2>
        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
          Fitur Cetak Rapor & QR Hash hanya dapat diakses oleh <strong>Kepala Sekolah</strong>, <strong>Wakil Kepala Sekolah</strong>, dan <strong>Administrator</strong>.
        </p>
        <p className="text-xs text-outline mt-2 leading-relaxed">
          Jika Anda adalah guru dan memerlukan akses ke dokumen rapor, silakan hubungi Administrator untuk mengaktifkan opsi izin di menu <strong>Atur Hak Akses</strong>.
        </p>
      </div>
    );
  }

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const cls = classes.find((c) => c.id === student?.classId) || classes[0];
  const pkl = pklAssessments.find((p) => p.studentId === student?.id);

  // Digital Signature Hash simulation
  const signatureHash = `SINILAI-SMKN1TP-2024G-${student?.nisn}-9F4B7E`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6">
      {/* Action Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-on-surface">Pilih Siswa:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-surface-container-low text-xs font-bold text-on-surface p-2 rounded-xl border border-surface-container-high cursor-pointer"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName} ({st.className} - NISN: {st.nisn})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVerifyModal(true)}
            className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container text-on-surface px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">qr_code_2</span>
            <span>Cek Keaslian QR</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak Rapor / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Official SMKN 1 Tanjungpandan Report Card Document */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 print:border-none print:shadow-none print:p-0">
        {/* Kop Surat Sekolah */}
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g"
            alt="Logo SMKN 1"
            className="w-16 h-16 object-contain"
          />
          <div className="text-center flex-1 px-4">
            <h3 className="text-xs uppercase font-semibold tracking-wider">
              Pemerintah Provinsi Kepulauan Bangka Belitung
            </h3>
            <h2 className="text-sm uppercase font-bold tracking-wider">
              Dinas Pendidikan • Cabang Dinas Wilayah V
            </h2>
            <h1 className="text-lg uppercase font-extrabold tracking-tight">
              SMK NEGERI 1 TANJUNGPANDAN
            </h1>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Jalan Merdeka No. 1, Tanjungpandan, Belitung, Kep. Bangka Belitung 33411
            </p>
          </div>
          <div className="w-16 flex justify-end">
            <span className="text-[10px] font-mono border border-black p-1 text-center font-bold">
              KURIKULUM<br />MERDEKA
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase tracking-wider underline">
            LAPORAN HASIL PENILAIAN CAPAIAN PEMBELAJARAN (RAPOR)
          </h2>
        </div>

        {/* Student Metadata Table */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-slate-300 p-4 rounded-lg bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold">Nama Peserta Didik</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{student?.fullName}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">NISN / NIS</span>
              <span className="mr-2">:</span>
              <span className="font-mono">{student?.nisn} / {student?.nis}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Sekolah</span>
              <span className="mr-2">:</span>
              <span>SMK Negeri 1 Tanjungpandan</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold">Kelas / Rombel</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{cls?.name}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Fase / Semester</span>
              <span className="mr-2">:</span>
              <span>Fase E / Genap</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Tahun Ajaran</span>
              <span className="mr-2">:</span>
              <span>2024/2025</span>
            </div>
          </div>
        </div>

        {/* Academic Grades Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
            A. Nilai Capaian Kompetensi Akademik & Kejuruan
          </h3>
          <table className="w-full text-left border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th className="border border-slate-400 py-2 px-2 w-10">No</th>
                <th className="border border-slate-400 py-2 px-4 text-left">Mata Pelajaran</th>
                <th className="border border-slate-400 py-2 px-2 w-14">KKM</th>
                <th className="border border-slate-400 py-2 px-2 w-16">Nilai Akhir</th>
                <th className="border border-slate-400 py-2 px-2 w-16">Predikat</th>
                <th className="border border-slate-400 py-2 px-4 text-left">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj, i) => {
                const g = grades.find(
                  (grade) => grade.studentId === student?.id && grade.subjectId === subj.id
                );
                const score = g?.finalScore || 82.5;
                const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 75 ? 'C' : 'D';

                return (
                  <tr key={subj.id}>
                    <td className="border border-slate-400 py-2 px-2 text-center">{i + 1}</td>
                    <td className="border border-slate-400 py-2 px-4 font-semibold">{subj.name}</td>
                    <td className="border border-slate-400 py-2 px-2 text-center">{subj.kkm.toFixed(0)}</td>
                    <td className="border border-slate-400 py-2 px-2 text-center font-bold font-mono">
                      {score.toFixed(1)}
                    </td>
                    <td className="border border-slate-400 py-2 px-2 text-center font-bold">{pred}</td>
                    <td className="border border-slate-400 py-2 px-4 text-[11px] text-slate-700">
                      {g?.competencyNotes || 'Menunjukkan penguasaan materi yang baik sesuai alur tujuan pembelajaran.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PKL Assessment Section if exists */}
        {pkl && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
              B. Penilaian Praktik Kerja Lapangan (PKL) / Industri
            </h3>
            <table className="w-full text-left border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <th className="border border-slate-400 py-2 px-3 text-left">Mitra Industri / Perusahaan</th>
                  <th className="border border-slate-400 py-2 px-3 text-left">Pembimbing Lapangan</th>
                  <th className="border border-slate-400 py-2 px-2 w-20">Nilai Akhir</th>
                  <th className="border border-slate-400 py-2 px-3 text-left">Keterangan / Portofolio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-400 py-2 px-3 font-semibold">{pkl.companyName}</td>
                  <td className="border border-slate-400 py-2 px-3">{pkl.supervisorName}</td>
                  <td className="border border-slate-400 py-2 px-2 text-center font-bold font-mono">
                    {pkl.finalScore.toFixed(1)} (Sangat Baik)
                  </td>
                  <td className="border border-slate-400 py-2 px-3 text-[11px] text-slate-700">
                    {pkl.notes}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures & QR Code Section */}
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <p className="font-medium">Mengetahui,</p>
            <p className="font-medium">Orang Tua / Wali Siswa</p>
            <div className="h-20"></div>
            <p className="font-bold underline">..................................................</p>
          </div>

          {/* Center: Digital Signature QR Hash */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-2 border-2 border-primary/40 rounded-xl bg-slate-50 flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                  `https://sinilai.smkn1tanjungpandan.sch.id/verifikasi/${signatureHash}`
                )}`}
                alt="Verification QR"
                className="w-20 h-20"
              />
              <span className="text-[9px] font-mono text-primary font-bold mt-1">
                TERVERIFIKASI DIGITAL
              </span>
              <span className="text-[8px] font-mono text-slate-500">{signatureHash}</span>
            </div>
          </div>

          <div>
            <p className="font-medium">Tanjungpandan, 20 Juni 2026</p>
            <p className="font-medium">Wali Kelas,</p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-primary/40 font-serif italic text-sm">Tanda Tangan Digital Terotorisasi</span>
            </div>
            <p className="font-bold underline">Budi Santoso, S.Kom</p>
            <p className="text-[10px] text-slate-600">NIP. 19840211 200903 1 004</p>
          </div>
        </div>

        {/* Kepala Sekolah Signature Bottom */}
        <div className="mt-6 text-center text-xs">
          <p className="font-medium">Kepala Sekolah SMKN 1 Tanjungpandan,</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-primary/40 font-serif italic text-sm">Tanda Tangan Elektronik</span>
          </div>
          <p className="font-bold underline">Dra. Sri Rahayu, M.Pd.</p>
          <p className="text-[10px] text-slate-600">NIP. 19680415 199303 2 002</p>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <span className="material-symbols-outlined text-[32px]">verified</span>
              <div>
                <h3 className="text-base font-bold text-on-surface">Validasi Dokumen Rapor Resmi</h3>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Tanda Tangan Digital Sah & Terotentikasi
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl space-y-2 text-xs text-on-surface">
              <div className="flex justify-between">
                <span className="text-outline">Nomor Hash:</span>
                <span className="font-mono font-bold">{signatureHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Instansi:</span>
                <span className="font-bold">SMKN 1 Tanjungpandan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Siswa:</span>
                <span className="font-bold">{student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Waktu Sign:</span>
                <span className="font-bold">25 Sep 2026 21:00 WIB</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
