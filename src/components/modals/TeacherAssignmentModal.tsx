import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';

interface TeacherAssignmentModalProps {
  teacher: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherAssignmentModal: React.FC<TeacherAssignmentModalProps> = ({
  teacher,
  isOpen,
  onClose,
}) => {
  const { subjects, classes, updateTeacherPermissions } = useSchool();
  const { currentUser } = useAuth();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [canPrintRapor, setCanPrintRapor] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync state when teacher prop changes
  useEffect(() => {
    if (teacher) {
      setSelectedSubjects(teacher.assignedSubjects || []);
      setSelectedClasses(teacher.assignedClasses || []);
      setCanPrintRapor(Boolean(teacher.canPrintRapor));
      setSyncFeedback(null);
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  // Realtime instant toggle handler
  const handleToggleSubject = (subjectId: string) => {
    const updated = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter((id) => id !== subjectId)
      : [...selectedSubjects, subjectId];

    setSelectedSubjects(updated);
    commitRealtimeUpdate(updated, selectedClasses, canPrintRapor);
  };

  const handleToggleClass = (classId: string) => {
    const updated = selectedClasses.includes(classId)
      ? selectedClasses.filter((id) => id !== classId)
      : [...selectedClasses, classId];

    setSelectedClasses(updated);
    commitRealtimeUpdate(selectedSubjects, updated, canPrintRapor);
  };

  const handleTogglePrintRapor = () => {
    const nextVal = !canPrintRapor;
    setCanPrintRapor(nextVal);
    commitRealtimeUpdate(selectedSubjects, selectedClasses, nextVal);
  };

  const handleSelectAllSubjects = () => {
    const all = subjects.map((s) => s.id);
    setSelectedSubjects(all);
    commitRealtimeUpdate(all, selectedClasses, canPrintRapor);
  };

  const handleClearAllSubjects = () => {
    setSelectedSubjects([]);
    commitRealtimeUpdate([], selectedClasses, canPrintRapor);
  };

  const handleSelectAllClasses = () => {
    const all = classes.map((c) => c.id);
    setSelectedClasses(all);
    commitRealtimeUpdate(selectedSubjects, all, canPrintRapor);
  };

  const handleClearAllClasses = () => {
    setSelectedClasses([]);
    commitRealtimeUpdate(selectedSubjects, [], canPrintRapor);
  };

  const commitRealtimeUpdate = (
    newSubjects: string[],
    newClasses: string[],
    printRaporVal = canPrintRapor
  ) => {
    updateTeacherPermissions(teacher.id, newSubjects, newClasses, printRaporVal);
    const now = new Date().toLocaleTimeString('id-ID');
    setLastSyncTime(now);
    setSyncFeedback('Perubahan tersimpan otomatis & disinkronkan ke seluruh sesi live!');
    
    // Auto clear feedback after 3s
    setTimeout(() => {
      setSyncFeedback(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface">
                  Atur Hak Akses & Penugasan Mengajar
                </h2>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  Live Sync Aktif
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Centang mata pelajaran dan kelas yang dapat diinput atau dilihat oleh{' '}
                <strong className="text-primary">{teacher.name}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Live Sync Realtime Banner */}
        {syncFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>{syncFeedback}</span>
            {lastSyncTime && <span className="text-[11px] text-emerald-600 font-normal">({lastSyncTime} WIB)</span>}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Teacher Profile Summary Card */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high">
            <div className="flex items-center gap-3">
              <img
                src={teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                alt={teacher.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">{teacher.name}</span>
                <span className="text-xs text-on-surface-variant">
                  {teacher.nip ? `NIP. ${teacher.nip}` : teacher.email} • Peran: {teacher.role.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                Total Alokasi Akses
              </span>
              <span className="text-xs font-bold text-primary">
                {selectedSubjects.length} Mapel • {selectedClasses.length} Rombel Kelas
              </span>
            </div>
          </div>

          {/* Section 1: Mata Pelajaran (MTK, IPAS, RPL, TKJ, dll) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                <h3 className="text-sm font-bold text-on-surface">
                  1. Mata Pelajaran yang Dapat Dilihat & Diinput Nilai:
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSubjects}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-outline text-xs">•</span>
                <button
                  type="button"
                  onClick={handleClearAllSubjects}
                  className="text-[11px] font-semibold text-error hover:underline"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {subjects.map((subj) => {
                const isChecked = selectedSubjects.includes(subj.id);
                return (
                  <label
                    key={subj.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleSubject(subj.id);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-primary-container/10 border-primary text-primary shadow-xs ring-1 ring-primary/20'
                        : 'bg-surface-container-lowest border-surface-container-high hover:border-outline text-on-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono px-1.5 py-0.2 rounded bg-surface-container">
                          {subj.code}
                        </span>
                        <span className="text-xs font-bold truncate">{subj.name}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant mt-0.5">
                        {subj.category} • KKM: {subj.kkm.toFixed(1)}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 2: Kelas / Rombel (10 RPL, 10 TKJ, 10 PM, 11 RPL, dll) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
                <h3 className="text-sm font-bold text-on-surface">
                  2. Kelas / Rombel yang Dapat Diakses:
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-outline text-xs">•</span>
                <button
                  type="button"
                  onClick={handleClearAllClasses}
                  className="text-[11px] font-semibold text-error hover:underline"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5">
              {classes.map((cls) => {
                const isChecked = selectedClasses.includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleClass(cls.id);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-secondary-container/15 border-secondary text-secondary shadow-xs ring-1 ring-secondary/20'
                        : 'bg-surface-container-lowest border-surface-container-high hover:border-outline text-on-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-secondary focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{cls.name}</span>
                      <span className="text-[11px] text-on-surface-variant mt-0.5">
                        Tingkat {cls.tingkat} • {cls.jurusan} ({cls.totalStudents} Siswa)
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Hak Akses Khusus & Cetak Rapor */}
          <div className="space-y-3 pt-2 border-t border-surface-container-high">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">verified_user</span>
              <h3 className="text-sm font-bold text-on-surface">
                3. Hak Akses Khusus & Cetak Dokumen Rapor:
              </h3>
            </div>

            <div
              onClick={handleTogglePrintRapor}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 cursor-pointer transition-all ${
                canPrintRapor
                  ? 'bg-amber-500/10 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-500/20'
                  : 'bg-surface-container-lowest border-surface-container-high hover:border-outline text-on-surface'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={canPrintRapor}
                  onChange={() => {}}
                  className="mt-1 rounded text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">
                      Izin Akses & Cetak Rapor Siswa (Cetak Rapor & QR Hash)
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      Izin Khusus
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Fitur <strong>Cetak Rapor & QR Hash</strong> secara default hanya dapat diakses oleh <strong>Kepala Sekolah</strong>, <strong>Wakil Kepala Sekolah</strong>, dan <strong>Admin</strong>. Centang opsi ini jika Anda ingin memberikan hak khusus kepada <strong>{teacher.name}</strong> untuk mengakses menu cetak rapor dan mengunduh/mencetak dokumen rapor resmi siswa.
                  </p>
                </div>
              </div>

              <div className="shrink-0 mt-0.5">
                <span className={`material-symbols-outlined text-[26px] ${canPrintRapor ? 'text-amber-600' : 'text-outline'}`}>
                  {canPrintRapor ? 'toggle_on' : 'toggle_off'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/20 flex items-start gap-3 text-xs text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              bolt
            </span>
            <div>
              <p className="font-semibold text-primary">Sistem Auto-Save & Live Broadcaster:</p>
              <p className="text-on-surface-variant mt-0.5">
                Setiap kali checkbox dicentang atau dihilangkan, sistem langsung menyimpan perubahan ke basis data dan mengirim event WebSocket. Akun guru yang bersangkutan langsung mendapatkan update mata pelajaran dan rombel secara <strong>realtime tanpa perlu reload halaman atau login ulang</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-high bg-surface-container-low/40">
          <div className="text-xs text-on-surface-variant">
            {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime} WIB` : 'Otomatis tersimpan saat dipilih'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-95"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
