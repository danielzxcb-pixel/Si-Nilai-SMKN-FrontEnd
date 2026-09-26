import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { TeacherAssignmentModal } from '../modals/TeacherAssignmentModal';

export const TeacherManagementView: React.FC = () => {
  const { users, subjects, classes } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Teacher assignment modal state
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter teachers (only users with role 'guru' or 'waka')
  const teacherList = useMemo(() => {
    return users.filter((u) => u.role === 'guru' || u.role === 'waka');
  }, [users]);

  const filteredTeachers = useMemo(() => {
    return teacherList.filter((teacher) => {
      const matchSearch =
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.nip && teacher.nip.includes(searchQuery)) ||
        teacher.assignedSubjects.some((sId) => {
          const s = subjects.find((sub) => sub.id === sId);
          return s && s.name.toLowerCase().includes(searchQuery.toLowerCase());
        });

      if (!matchSearch) return false;

      if (filterStatus === 'bebas' && teacher.assignedSubjects.length > 0) return false;
      if (filterStatus === 'aktif' && teacher.assignedSubjects.length === 0) return false;

      return true;
    });
  }, [teacherList, searchQuery, filterStatus, subjects]);

  const handleOpenAssignModal = (teacher: User) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Administrasi Akademik</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Penugasan Pengajar</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Manajemen Guru & Hak Akses Penugasan
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Atur pembagian mata pelajaran yang diampu, alokasi rombel kelas, serta hak akses khusus cetak rapor dengan <strong>live sync instan</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Realtime Auto-Sync Aktif
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Guru */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Total Guru Terdaftar
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-on-surface">{teacherList.length}</span>
              <span className="text-xs text-on-surface-variant">Tenaga Pendidik</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">
              Sinkron Otomatis
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">groups</span>
          </div>
        </div>

        {/* Guru Aktif */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Guru Aktif Mengajar
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-secondary">
                {teacherList.filter((t) => t.assignedSubjects.length > 0).length}
              </span>
              <span className="text-xs text-on-surface-variant">Memiliki Rombel</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-secondary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Terdistribusi Ideal
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
          </div>
        </div>

        {/* Belum Ditugaskan */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-error">
              Belum Ditugaskan
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-error">
                {teacherList.filter((t) => t.assignedSubjects.length === 0).length}
              </span>
              <span className="text-xs text-on-surface-variant">Perlu Alokasi</span>
            </div>
            <span className="text-[11px] text-error/80 font-medium mt-1">
              Klik "Atur Hak Akses"
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
            <span className="material-symbols-outlined text-[26px]">person_alert</span>
          </div>
        </div>

        {/* Beban JP */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Beban Jam Mengajar
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-primary">23.6</span>
              <span className="text-xs text-on-surface-variant">JP / Minggu / Guru</span>
            </div>
            <span className="text-[11px] text-outline mt-1 font-medium">
              Standar Kemdikbud & BKN
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">schedule</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau mata pelajaran..."
            className="w-full bg-surface-container-low text-on-surface pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-xl gap-2 border border-surface-container-high">
            <span className="material-symbols-outlined text-outline text-[18px]">filter_alt</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif Mengajar</option>
              <option value="bebas">Belum Ditugaskan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teacher Assignments Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[240px]">Nama Guru & NIP</th>
                <th className="py-3 px-4 min-w-[260px]">Mata Pelajaran Diampu</th>
                <th className="py-3 px-4 min-w-[200px]">Kelas / Rombel yang Diakses</th>
                <th className="py-3 px-4 min-w-[120px]">Beban Jam</th>
                <th className="py-3 px-4 min-w-[140px]">Izin Cetak Rapor</th>
                <th className="py-3 px-4 min-w-[120px]">Status Akun</th>
                <th className="py-3 px-4 min-w-[160px] text-right">Aksi Realtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {filteredTeachers.map((teacher, idx) => {
                const assignedSubjObjects = subjects.filter((s) =>
                  teacher.assignedSubjects.includes(s.id)
                );
                const assignedClassObjects = classes.filter((c) =>
                  teacher.assignedClasses.includes(c.id)
                );
                const approxJP = assignedClassObjects.length * 4;

                return (
                  <tr
                    key={teacher.id}
                    className="hover:bg-surface-container-low/70 transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-outline">
                      {idx + 1}
                    </td>

                    {/* Name & NIP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            teacher.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'
                          }
                          alt={teacher.name}
                          className="w-10 h-10 rounded-full object-cover border border-surface-container-high shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-on-surface truncate">
                            {teacher.name}
                          </span>
                          <span className="text-[11px] font-mono text-on-surface-variant">
                            {teacher.nip ? `NIP. ${teacher.nip}` : teacher.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Subjects */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {assignedSubjObjects.length > 0 ? (
                          assignedSubjObjects.map((subj) => (
                            <span
                              key={subj.id}
                              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-lg border border-primary/20"
                            >
                              <span className="font-mono">{subj.code}</span>
                              <span className="font-normal text-[10px] text-on-surface-variant truncate max-w-[120px]">
                                {subj.name}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-outline italic">
                            Belum ada mapel
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Classes */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {assignedClassObjects.length > 0 ? (
                          assignedClassObjects.map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center gap-1 bg-secondary-container/20 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-lg border border-secondary/20"
                            >
                              <span>{cls.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-outline italic">
                            Belum ada kelas
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Teaching Hours */}
                    <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                      {approxJP > 0 ? `${approxJP} JP / Minggu` : '—'}
                    </td>

                    {/* Izin Cetak Rapor */}
                    <td className="py-3.5 px-4">
                      {teacher.canPrintRapor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          <span>Diizinkan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-outline bg-surface-container px-2 py-0.5 rounded-full">
                          <span>Tidak Ada</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {assignedSubjObjects.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Aktif Mengajar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          Belum Ditugaskan
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(teacher)}
                        className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Edit mapel, rombel, dan hak akses guru"
                      >
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        <span>Atur Hak Akses</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Realtime Modal */}
      <TeacherAssignmentModal
        teacher={editingTeacher}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
