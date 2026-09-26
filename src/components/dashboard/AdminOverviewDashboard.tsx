import React, { useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';

interface AdminOverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminOverviewDashboard: React.FC<AdminOverviewDashboardProps> = ({ onNavigate }) => {
  const { users, subjects, classes, students, grades, tracker, auditLogs } = useSchool();

  const teacherList = useMemo(() => {
    return users.filter((u) => u.role === 'guru' || u.role === 'waka');
  }, [users]);

  const activeTeachersCount = teacherList.filter((t) => t.assignedSubjects.length > 0).length;
  const unassignedTeachersCount = teacherList.length - activeTeachersCount;

  // Grade progress calculation
  const totalRombelMapelCombinations = classes.length * subjects.length;
  const submittedCount = tracker.filter((t) => t.status === 'terkirim').length;
  const inProgressCount = tracker.filter((t) => t.status === 'sedang_diisi').length;
  const notStartedCount = Math.max(0, totalRombelMapelCombinations - submittedCount - inProgressCount);

  const percentComplete = totalRombelMapelCombinations > 0
    ? Math.round((submittedCount / totalRombelMapelCombinations) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Sistem Manajemen Sekolah</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">SMKN 1 Tanjungpandan</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Ringkasan Umum Sekolah & Capaian Nilai
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Selamat datang di portal SiNilai SMKN 1 Tanjungpandan. Pantau perkembangan pengisian nilai rapor, data guru, serta siswa secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Sistem Sekolah Aktif
          </div>
        </div>
      </div>

      {/* 4 Core Master Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Guru */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between group hover:border-primary/40 transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Tenaga Pendidik (Guru)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-on-surface">{teacherList.length}</span>
              <span className="text-xs text-on-surface-variant">Orang</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">
              {activeTeachersCount} Aktif Mengajar • {unassignedTeachersCount} Perlu Alokasi
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">groups</span>
          </div>
        </div>

        {/* Total Siswa */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between group hover:border-secondary/40 transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Total Siswa Terdaftar
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-secondary">{students.length}</span>
              <span className="text-xs text-on-surface-variant">Siswa</span>
            </div>
            <span className="text-[11px] text-secondary font-medium mt-1">
              Terdistribusi di {classes.length} Rombel
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">school</span>
          </div>
        </div>

        {/* Total Kelas */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between group hover:border-indigo-400 transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Rombel / Kelas Aktif
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-indigo-900">{classes.length}</span>
              <span className="text-xs text-on-surface-variant">Rombel</span>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium mt-1">
              Tingkat X, XI, dan XII
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">meeting_room</span>
          </div>
        </div>

        {/* Total Mapel */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between group hover:border-amber-400 transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Mata Pelajaran (Mapel)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-amber-700">{subjects.length}</span>
              <span className="text-xs text-on-surface-variant">Mapel</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1">
              Kurikulum Merdeka SMK
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">menu_book</span>
          </div>
        </div>
      </div>

      {/* Progress & Quick Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bar Card */}
        <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Progres Penilaian Rapor
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                T.A. 2024/2025 Genap
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mt-1">
              Keterisian Nilai Rapor Guru
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Ringkasan kelengkapan nilai yang sudah dinilai dan diserahkan oleh bapak/ibu guru untuk dicetak di rapor.
            </p>

            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-extrabold text-primary">{percentComplete}%</span>
              <span className="text-xs text-on-surface-variant font-semibold">Tuntas Dinilai</span>
            </div>

            <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden mt-3">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, percentComplete)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="block text-base font-extrabold text-emerald-800">{submittedCount}</span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Tuntas</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span className="block text-base font-extrabold text-amber-800">{inProgressCount}</span>
                <span className="text-[10px] font-bold text-amber-700 uppercase">Proses</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high">
                <span className="block text-base font-extrabold text-outline">{notStartedCount}</span>
                <span className="text-[10px] font-bold text-outline uppercase">Belum</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('realtime-tracker')}
            className="w-full mt-5 bg-surface-container-low hover:bg-surface-container-high text-primary font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Pantau Pengumpulan Nilai Guru</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Quick Action Navigation Cards (2 Cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Tugas Mengajar Guru */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between hover:border-primary/40 transition-all group">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">school</span>
              </div>
              <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                Tugas Mengajar Guru
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Kelola akun tenaga pendidik, atur mata pelajaran yang diampu, serta tentukan rombel kelas yang diajar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('guru-management')}
              className="mt-4 inline-flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Buka Tugas Mengajar Guru</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Card 2: Data Kelas & Mapel */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between hover:border-secondary/40 transition-all group">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">tune</span>
              </div>
              <h4 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">
                Data Kelas & Mapel
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Daftar rombel kelas (Tingkat X, XI, XII) dan mata pelajaran. Tambah rombel atau mapel baru sekolah di sini.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('kelola-kelas-mapel')}
              className="mt-4 inline-flex items-center justify-between text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Buka Data Kelas & Mapel</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Card 3: Rekapitulasi Nilai Sekolah */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between hover:border-indigo-400 transition-all group">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">analytics</span>
              </div>
              <h4 className="text-base font-bold text-on-surface group-hover:text-indigo-600 transition-colors">
                Rekapitulasi Nilai Sekolah
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pantau rekap nilai rapor per rombel kelas, ketuntasan kriteria KKM, serta verifikasi kelengkapan nilai.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('monitoring-rekap')}
              className="mt-4 inline-flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Buka Rekapitulasi Nilai</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Card 4: Pengaturan Bobot Rapor */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex flex-col justify-between hover:border-amber-400 transition-all group">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">calculate</span>
              </div>
              <h4 className="text-base font-bold text-on-surface group-hover:text-amber-700 transition-colors">
                Pengaturan Bobot Rapor
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Atur formula persentase pembobotan Nilai Akhir (Ulangan Harian %, Tugas %, dan UAS %) sesuai pedoman kurikulum.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('formula-settings')}
              className="mt-4 inline-flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Atur Bobot Nilai</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">history</span>
            <h3 className="text-sm font-bold text-on-surface">Catatan Aktivitas Penilaian Terbaru</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit-log')}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Lihat Seluruh Riwayat
          </button>
        </div>

        <div className="divide-y divide-surface-container-high">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span className="font-bold text-on-surface">{log.changedBy}</span>
                <span className="text-on-surface-variant">
                  mengubah {log.field} {log.studentName} ({log.oldScore ?? '—'} → {log.newScore ?? '—'})
                </span>
                <span className="text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded text-outline font-semibold">
                  {log.subjectName}
                </span>
              </div>
              <span className="font-mono text-[11px] text-outline">{log.changedAt}</span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="py-4 text-center text-outline text-xs">Belum ada riwayat aktivitas.</div>
          )}
        </div>
      </div>
    </div>
  );
};
