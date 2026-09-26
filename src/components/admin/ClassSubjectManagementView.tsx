import React, { useState, useMemo } from 'react';
import { Subject, SchoolClass } from '../../types';
import { useSchool } from '../../context/SchoolContext';

export const ClassSubjectManagementView: React.FC = () => {
  const {
    users,
    subjects,
    classes,
    students,
    addClass,
    deleteClass,
    addSubject,
    deleteSubject,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const teacherList = useMemo(() => {
    return users.filter((u) => u.role === 'guru' || u.role === 'waka');
  }, [users]);

  // ----------------------------------------------------
  // CLASS MANAGEMENT STATE
  // ----------------------------------------------------
  const [searchClass, setSearchClass] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('all');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTingkat, setNewClassTingkat] = useState<number>(10);
  const [newClassJurusan, setNewClassJurusan] = useState('PPLG / Rekayasa Perangkat Lunak');

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchClass.toLowerCase()) ||
        c.jurusan.toLowerCase().includes(searchClass.toLowerCase());
      if (!matchSearch) return false;
      if (filterTingkat !== 'all' && c.tingkat.toString() !== filterTingkat) return false;
      return true;
    });
  }, [classes, searchClass, filterTingkat]);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast('⚠️ Nama kelas wajib diisi!');
      return;
    }
    const created = addClass({
      name: newClassName.trim(),
      tingkat: Number(newClassTingkat),
      jurusan: newClassJurusan,
    });
    showToast(`✅ Kelas "${created.name}" berhasil ditambahkan ke sistem!`);
    setNewClassName('');
    setIsAddClassModalOpen(false);
  };

  const handleDeleteClass = (cls: SchoolClass) => {
    if (window.confirm(`Yakin ingin menghapus Kelas "${cls.name}"? Akses guru pada kelas ini juga akan dicabut.`)) {
      deleteClass(cls.id);
      showToast(`🗑️ Kelas "${cls.name}" berhasil dihapus.`);
    }
  };

  // ----------------------------------------------------
  // SUBJECT MANAGEMENT STATE
  // ----------------------------------------------------
  const [searchSub, setSearchSub] = useState('');
  const [filterSubCat, setFilterSubCat] = useState('all');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<'Kejuruan' | 'Umum' | 'Muatan Lokal'>('Kejuruan');
  const [newSubKkm, setNewSubKkm] = useState<number>(75);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchSub.toLowerCase()) ||
        s.code.toLowerCase().includes(searchSub.toLowerCase());
      if (!matchSearch) return false;
      if (filterSubCat !== 'all' && s.category !== filterSubCat) return false;
      return true;
    });
  }, [subjects, searchSub, filterSubCat]);

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) {
      showToast('⚠️ Kode dan nama mata pelajaran wajib diisi!');
      return;
    }
    const created = addSubject({
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
      category: newSubCategory,
      kkm: Number(newSubKkm),
    });
    showToast(`✅ Mata Pelajaran "${created.name}" (${created.code}) berhasil ditambahkan!`);
    setNewSubCode('');
    setNewSubName('');
    setNewSubKkm(75);
    setIsAddSubjectModalOpen(false);
  };

  const handleDeleteSubject = (subj: Subject) => {
    if (window.confirm(`Yakin ingin menghapus Mapel "${subj.name}" (${subj.code})? Seluruh penugasan guru terkait mapel ini akan dicabut.`)) {
      deleteSubject(subj.id);
      showToast(`🗑️ Mata Pelajaran "${subj.name}" berhasil dihapus.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-white px-5 py-3 rounded-2xl shadow-xl border border-surface-container-high flex items-center gap-3 animate-fadeIn">
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Master Data Sekolah</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Rombel & Kurikulum Mapel</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Kelola Master Data Kelas & Mata Pelajaran
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Tambah, perbarui, dan sesuaikan data rombel kelas serta mata pelajaran kurikulum merdeka sekolah dengan database realtime.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Master Sync Aktif
          </div>
        </div>
      </div>

      {/* Subtab Bar */}
      <div className="flex items-center gap-2 border-b border-surface-container-high pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-secondary text-white shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">meeting_room</span>
          <span>1. Kelola Rombel Kelas</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {classes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>2. Kelola Mata Pelajaran</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {subjects.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KELOLA ROMBEL KELAS */}
      {/* ========================================================= */}
      {activeTab === 'classes' && (
        <div className="flex flex-col gap-5">
          {/* Class Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Total Rombel Kelas
                </span>
                <span className="text-3xl font-extrabold text-on-surface mt-1">{classes.length}</span>
                <span className="text-[11px] text-secondary font-semibold mt-1">Aktif Semester Ini</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[26px]">meeting_room</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Total Siswa Terdaftar
                </span>
                <span className="text-3xl font-extrabold text-on-surface mt-1">{students.length}</span>
                <span className="text-[11px] text-primary font-semibold mt-1">Terbagi di semua rombel</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px]">school</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Distribusi Tingkat
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold bg-surface-container-high px-2 py-0.5 rounded">
                    X: {classes.filter((c) => c.tingkat === 10).length}
                  </span>
                  <span className="text-xs font-bold bg-surface-container-high px-2 py-0.5 rounded">
                    XI: {classes.filter((c) => c.tingkat === 11).length}
                  </span>
                  <span className="text-xs font-bold bg-surface-container-high px-2 py-0.5 rounded">
                    XII: {classes.filter((c) => c.tingkat === 12).length}
                  </span>
                </div>
                <span className="text-[11px] text-outline mt-1">Kelas X, XI, XII</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                <span className="material-symbols-outlined text-[26px]">layers</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchClass}
                  onChange={(e) => setSearchClass(e.target.value)}
                  placeholder="Cari nama rombel / jurusan..."
                  className="w-full bg-surface-container-low text-on-surface pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-secondary/20 border border-surface-container-high"
                />
              </div>

              <select
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className="bg-surface-container-low text-xs font-semibold text-on-surface px-3 py-2 rounded-xl border border-surface-container-high focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Tingkat</option>
                <option value="10">Tingkat 10 (Kelas X)</option>
                <option value="11">Tingkat 11 (Kelas XI)</option>
                <option value="12">Tingkat 12 (Kelas XII)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddClassModalOpen(true)}
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-container text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Tambah Kelas Baru</span>
            </button>
          </div>

          {/* Classes Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[160px]">Nama Rombel / Kelas</th>
                    <th className="py-3 px-4 min-w-[100px] text-center">Tingkat</th>
                    <th className="py-3 px-4 min-w-[200px]">Konsentrasi Keahlian (Jurusan)</th>
                    <th className="py-3 px-4 min-w-[140px] text-center">Jumlah Siswa</th>
                    <th className="py-3 px-4 min-w-[200px]">Guru Pengajar</th>
                    <th className="py-3 px-4 min-w-[100px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
                  {filteredClasses.map((cls, idx) => {
                    const studentCount = students.filter((s) => s.classId === cls.id).length;
                    const assignedTeachers = teacherList.filter((t) => t.assignedClasses.includes(cls.id));

                    return (
                      <tr key={cls.id} className="hover:bg-surface-container-low/70 transition-colors group">
                        <td className="py-3.5 px-4 text-center font-bold text-outline">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-sm text-on-surface">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            <span>Kelas {cls.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block bg-secondary/10 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-lg border border-secondary/20">
                            Kelas {cls.tingkat}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-semibold">{cls.jurusan}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold bg-surface-container-high px-2.5 py-1 rounded-lg text-primary">
                            {studentCount} Siswa
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {assignedTeachers.length > 0 ? (
                              assignedTeachers.map((t) => (
                                <span
                                  key={t.id}
                                  className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded border border-surface-container-high"
                                >
                                  {t.name.split(' ')[0]}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-outline italic">Belum ada guru</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls)}
                            className="inline-flex items-center gap-1 text-error hover:bg-error-container/40 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title={`Hapus kelas ${cls.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClasses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        Tidak ada kelas yang sesuai pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KELOLA MATA PELAJARAN */}
      {/* ========================================================= */}
      {activeTab === 'subjects' && (
        <div className="flex flex-col gap-5">
          {/* Subject Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Total Mata Pelajaran
                </span>
                <span className="text-3xl font-extrabold text-on-surface mt-1">{subjects.length}</span>
                <span className="text-[11px] text-indigo-600 font-semibold mt-1">Kurikulum Merdeka SMK</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                <span className="material-symbols-outlined text-[26px]">menu_book</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Mapel Kejuruan
                </span>
                <span className="text-3xl font-extrabold text-primary mt-1">
                  {subjects.filter((s) => s.category === 'Kejuruan').length}
                </span>
                <span className="text-[11px] text-outline mt-1">
                  {subjects.filter((s) => s.category === 'Umum').length} Mapel Umum
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px]">engineering</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Standar KKM Rata-rata
                </span>
                <span className="text-3xl font-extrabold text-secondary mt-1">75.00</span>
                <span className="text-[11px] text-secondary font-medium mt-1">Batas Minimal Kelulusan</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[26px]">verified</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchSub}
                  onChange={(e) => setSearchSub(e.target.value)}
                  placeholder="Cari nama atau kode mata pelajaran..."
                  className="w-full bg-surface-container-low text-on-surface pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-surface-container-high"
                />
              </div>

              <select
                value={filterSubCat}
                onChange={(e) => setFilterSubCat(e.target.value)}
                className="bg-surface-container-low text-xs font-semibold text-on-surface px-3 py-2 rounded-xl border border-surface-container-high focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="Kejuruan">Kejuruan</option>
                <option value="Umum">Umum</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSubjectModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Tambah Mata Pelajaran</span>
            </button>
          </div>

          {/* Subjects Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[120px]">Kode Mapel</th>
                    <th className="py-3 px-4 min-w-[260px]">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4 min-w-[140px] text-center">Kategori</th>
                    <th className="py-3 px-4 min-w-[100px] text-center">Standar KKM</th>
                    <th className="py-3 px-4 min-w-[200px]">Guru Pengajar</th>
                    <th className="py-3 px-4 min-w-[100px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
                  {filteredSubjects.map((subj, idx) => {
                    const assignedTeachers = teacherList.filter((t) => t.assignedSubjects.includes(subj.id));

                    return (
                      <tr key={subj.id} className="hover:bg-surface-container-low/70 transition-colors group">
                        <td className="py-3.5 px-4 text-center font-bold text-outline">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">{subj.code}</td>
                        <td className="py-3.5 px-4 font-bold text-sm text-on-surface">{subj.name}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                              subj.category === 'Kejuruan'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : subj.category === 'Muatan Lokal'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-surface-container text-on-surface-variant border-surface-container-high'
                            }`}
                          >
                            {subj.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-secondary">
                          {subj.kkm.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {assignedTeachers.length > 0 ? (
                              assignedTeachers.map((t) => (
                                <span
                                  key={t.id}
                                  className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded border border-surface-container-high"
                                >
                                  {t.name.split(' ')[0]}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-outline italic">Belum ada guru</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subj)}
                            className="inline-flex items-center gap-1 text-error hover:bg-error-container/40 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title={`Hapus mapel ${subj.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        Tidak ada mata pelajaran yang sesuai pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KELAS BARU */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">meeting_room</span>
                <h3 className="font-extrabold text-base text-on-surface">Tambah Rombel Kelas Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Nama Kelas / Rombel <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: 10 RPL 2, 11 TKJ 1, 12 DKV"
                  className="bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
                <span className="text-[10px] text-outline">Format standar: [Tingkat] [Jurusan] [Nomor Rombel]</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface">Tingkat</label>
                  <select
                    value={newClassTingkat}
                    onChange={(e) => setNewClassTingkat(Number(e.target.value))}
                    className="bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-semibold border border-surface-container-high focus:outline-none cursor-pointer"
                  >
                    <option value={10}>Kelas 10 (X)</option>
                    <option value={11}>Kelas 11 (XI)</option>
                    <option value={12}>Kelas 12 (XII)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface">Jurusan / Konsentrasi</label>
                  <select
                    value={newClassJurusan}
                    onChange={(e) => setNewClassJurusan(e.target.value)}
                    className="bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-semibold border border-surface-container-high focus:outline-none cursor-pointer"
                  >
                    <option value="PPLG / Rekayasa Perangkat Lunak">PPLG / RPL</option>
                    <option value="TJKT / Teknik Komputer & Jaringan">TJKT / TKJ</option>
                    <option value="Pemasaran (PM)">Pemasaran (PM)</option>
                    <option value="Desain Komunikasi Visual (DKV)">DKV</option>
                    <option value="Akuntansi (AKL)">Akuntansi (AKL)</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-secondary hover:bg-secondary-container text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MATA PELAJARAN BARU */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[22px]">menu_book</span>
                <h3 className="font-extrabold text-base text-on-surface">Tambah Mata Pelajaran Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Kode Mata Pelajaran <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="Contoh: RPL-02, MTK-01, IPAS"
                  className="bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Nama Mata Pelajaran <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Contoh: Pemrograman Berorientasi Objek"
                  className="bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface">Kategori</label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-semibold border border-surface-container-high focus:outline-none cursor-pointer"
                  >
                    <option value="Kejuruan">Kejuruan</option>
                    <option value="Umum">Umum</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface">Standar KKM</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    step="0.5"
                    value={newSubKkm}
                    onChange={(e) => setNewSubKkm(Number(e.target.value))}
                    className="bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-center border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
