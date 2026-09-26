import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import confetti from 'canvas-confetti';

export const GuruDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    subjects,
    classes,
    students,
    grades,
    deadlines,
    saveGrade,
    submitGrades,
    academicYear,
    semester,
    gradeCategories,
    addGradeCategory,
    deleteGradeCategory,
  } = useSchool();

  // Toggle state for Teori & Praktik columns
  const [showTeori, setShowTeori] = useState<boolean>(true);
  const [showPraktik, setShowPraktik] = useState<boolean>(true);

  // Filter subjects and classes strictly assigned to this teacher (or all if admin or empty)
  const allowedSubjects = useMemo(() => {
    if (!currentUser) return subjects;
    if (currentUser.role === 'admin' || currentUser.role === 'waka' || currentUser.role === 'kepsek') return subjects;
    const userSubs = subjects.filter((s) => currentUser.assignedSubjects?.includes(s.id));
    return userSubs.length > 0 ? userSubs : subjects;
  }, [subjects, currentUser]);

  const allowedClasses = useMemo(() => {
    if (!currentUser) return classes;
    if (currentUser.role === 'admin' || currentUser.role === 'waka' || currentUser.role === 'kepsek') return classes;
    const userClasses = classes.filter((c) => currentUser.assignedClasses?.includes(c.id));
    return userClasses.length > 0 ? userClasses : classes;
  }, [classes, currentUser]);

  // Selected subject and class state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return allowedSubjects[0]?.id || 'SUB-RPL';
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return allowedClasses[0]?.id || 'CLS-10RPL1';
  });

  // Filter state for students
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'remedial' | 'lengkap'>('all');

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [missingStudentsList, setMissingStudentsList] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fallback if selections become invalid after permission changes
  const activeSubject =
    allowedSubjects.find((s) => s.id === selectedSubjectId) || allowedSubjects[0] || subjects[0];
  const activeClass =
    allowedClasses.find((c) => c.id === selectedClassId) || allowedClasses[0] || classes[0];

  // Get students in this active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students.filter((s) => s.classId === activeClass.id);
  }, [students, activeClass]);

  // Find deadline for active subject
  const currentDeadline = useMemo(() => {
    return deadlines.find((d) => d.subjectId === activeSubject?.id);
  }, [deadlines, activeSubject]);

  // Check submission status for current subject & class
  const isClassSubmitted = useMemo(() => {
    if (classStudents.length === 0) return false;
    const sampleGrade = grades.find(
      (g) =>
        g.subjectId === activeSubject?.id &&
        g.classId === activeClass?.id &&
        g.studentId === classStudents[0]?.id
    );
    return sampleGrade?.submitted || false;
  }, [grades, activeSubject, activeClass, classStudents]);

  // Calculate stats for current class & subject
  const stats = useMemo(() => {
    let tuntasCount = 0;
    let remedialCount = 0;
    let belumCount = 0;
    let totalScore = 0;
    let gradedCount = 0;

    classStudents.forEach((student) => {
      const g = grades.find(
        (grade) =>
          grade.studentId === student.id &&
          grade.subjectId === activeSubject?.id &&
          grade.classId === activeClass?.id
      );

      if (g && g.finalScore !== null) {
        gradedCount++;
        totalScore += g.finalScore;
        if (g.finalScore >= (activeSubject?.kkm || 75)) {
          tuntasCount++;
        } else {
          remedialCount++;
        }
      } else {
        belumCount++;
      }
    });

    const average = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : '0.0';
    const tuntasPercent =
      classStudents.length > 0
        ? Math.round((tuntasCount / classStudents.length) * 100)
        : 0;

    return { tuntasCount, remedialCount, belumCount, average, tuntasPercent, total: classStudents.length };
  }, [classStudents, grades, activeSubject, activeClass]);

  // Derive dynamic categories for active subject and class
  const uhCategories = useMemo(() => {
    return gradeCategories
      .filter(
        (c) =>
          (c.subjectId === activeSubject?.id || c.subjectId === 'ALL') &&
          (c.classId === activeClass?.id || c.classId === 'ALL') &&
          c.category === 'ulangan_harian'
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [gradeCategories, activeSubject, activeClass]);

  const tugasCategories = useMemo(() => {
    return gradeCategories
      .filter(
        (c) =>
          (c.subjectId === activeSubject?.id || c.subjectId === 'ALL') &&
          (c.classId === activeClass?.id || c.classId === 'ALL') &&
          c.category === 'tugas'
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [gradeCategories, activeSubject, activeClass]);

  // Handle Score Input Change for Dynamic Categories
  const handleCategoryScoreChange = (
    studentId: string,
    categoryId: string,
    valStr: string
  ) => {
    if (isClassSubmitted || !currentUser) return;
    const val = valStr === '' ? null : Math.min(100, Math.max(0, parseFloat(valStr)));

    const existingGrade = grades.find(
      (g) => g.studentId === studentId && g.subjectId === activeSubject.id && g.classId === activeClass.id
    );
    const updatedCategoryScores = {
      ...(existingGrade?.categoryScores || {}),
      [categoryId]: val,
    };

    saveGrade(
      {
        studentId,
        subjectId: activeSubject.id,
        classId: activeClass.id,
        teacherId: currentUser.id,
        categoryScores: updatedCategoryScores,
      },
      currentUser.role,
      currentUser.name
    );
  };

  // Handle Score Input Change
  const handleScoreChange = (
    studentId: string,
    field: 'uh1' | 'uh2' | 'uh3' | 'uasTeori' | 'uasPraktik',
    valStr: string
  ) => {
    if (isClassSubmitted || !currentUser) return;

    const val = valStr === '' ? null : Math.min(100, Math.max(0, parseFloat(valStr)));

    saveGrade(
      {
        studentId,
        subjectId: activeSubject.id,
        classId: activeClass.id,
        teacherId: currentUser.id,
        [field]: val,
      },
      currentUser.role,
      currentUser.name
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    if (isClassSubmitted || !currentUser) return;
    saveGrade(
      {
        studentId,
        subjectId: activeSubject.id,
        classId: activeClass.id,
        teacherId: currentUser.id,
        competencyNotes: notes,
      },
      currentUser.role,
      currentUser.name
    );
  };

  // Submit Flow
  const handleCheckValidation = () => {
    const missing: string[] = [];
    classStudents.forEach((student) => {
      const g = grades.find(
        (grade) =>
          grade.studentId === student.id &&
          grade.subjectId === activeSubject?.id &&
          grade.classId === activeClass?.id
      );
      if (
        !g ||
        g.uh1 === null ||
        g.uh2 === null ||
        g.uh3 === null ||
        g.uasTeori === null ||
        g.uasPraktik === null
      ) {
        missing.push(`${student.fullName} (NISN: ${student.nisn})`);
      }
    });

    if (missing.length > 0) {
      setMissingStudentsList(missing);
      setShowValidationModal(true);
    } else {
      setToastMessage('✅ Validasi berhasil: Semua nilai siswa lengkap dan siap diserahkan!');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleOpenSubmitDialog = () => {
    const missing: string[] = [];
    classStudents.forEach((student) => {
      const g = grades.find(
        (grade) =>
          grade.studentId === student.id &&
          grade.subjectId === activeSubject?.id &&
          grade.classId === activeClass?.id
      );
      if (
        !g ||
        g.uh1 === null ||
        g.uh2 === null ||
        g.uh3 === null ||
        g.uasTeori === null ||
        g.uasPraktik === null
      ) {
        missing.push(`${student.fullName} (NISN: ${student.nisn})`);
      }
    });

    if (missing.length > 0) {
      setMissingStudentsList(missing);
      setShowValidationModal(true);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (!currentUser) return;
    const res = submitGrades(activeSubject.id, activeClass.id, currentUser.id);
    if (res.success) {
      setShowSubmitModal(false);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      setToastMessage('🎉 Nilai rapor berhasil diserahkan ke Waka Kurikulum & Kepala Sekolah!');
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setShowSubmitModal(false);
      setMissingStudentsList(res.missingStudents);
      setShowValidationModal(true);
    }
  };

  // Filtered student list
  const filteredStudents = classStudents.filter((student) => {
    const g = grades.find(
      (grade) =>
        grade.studentId === student.id &&
        grade.subjectId === activeSubject?.id &&
        grade.classId === activeClass?.id
    );

    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterMode === 'remedial') {
      return g && g.finalScore !== null && g.finalScore < (activeSubject?.kkm || 75);
    }
    if (filterMode === 'lengkap') {
      return (
        g &&
        g.uh1 !== null &&
        g.uh2 !== null &&
        g.uh3 !== null &&
        g.uasTeori !== null &&
        g.uasPraktik !== null
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-white px-5 py-3 rounded-xl shadow-modal flex items-center gap-3 animate-fadeIn">
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Top Context Bar: Subject & Class Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-card border border-surface-container-high">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[28px]">terminal</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <span>Portal Penilaian Guru</span>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface-variant font-medium">
                {currentUser?.name} {currentUser?.nip ? `(NIP. ${currentUser.nip})` : ''}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mt-0.5">
              Input Nilai: {activeSubject?.name} ({activeClass?.name})
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                KKM Satuan: <strong>{activeSubject?.kkm.toFixed(2)}</strong>
              </span>
              <span className="text-outline-variant">•</span>
              <span>Kategori: <strong>{activeSubject?.category}</strong></span>
              <span className="text-outline-variant">•</span>
              <span>Total Siswa: <strong>{classStudents.length} Terdaftar</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Selectors & Example Guide */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-2xl border border-surface-container-high shadow-xs hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                <span>Mata Pelajaran</span>
                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-semibold">Mapel</span>
              </span>
              <select
                value={activeSubject?.id}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer py-0.5 pr-2"
                title="Pilih Mata Pelajaran untuk menilai"
              >
                {allowedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} • {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Dropdown */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-2xl border border-surface-container-high shadow-xs hover:border-secondary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div className="flex flex-col min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                <span>Rombel / Kelas</span>
                <span className="text-[9px] bg-secondary/15 text-secondary px-1.5 py-0.2 rounded font-semibold">Rombel</span>
              </span>
              <select
                value={activeClass?.id}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer py-0.5 pr-2"
                title="Pilih Kelas yang dinilai"
              >
                {allowedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner & Grading Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-stretch">
        {/* Banner */}
        <div
          className={`xl:col-span-3 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border shadow-card transition-all ${
            isClassSubmitted
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-surface-container-low border-surface-container-high text-on-surface'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl mt-0.5 ${
                isClassSubmitted
                  ? 'bg-emerald-200/60 text-emerald-800'
                  : 'bg-secondary-container/30 text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isClassSubmitted ? 'lock' : 'pending_actions'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isClassSubmitted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isClassSubmitted ? 'bg-white' : 'bg-amber-600 animate-pulse'
                    }`}
                  ></span>
                  {isClassSubmitted ? 'TERKIRIM KE WAKA / KEPSEK (TERKUNCI)' : 'DRAFT / BELUM DISERAHKAN'}
                </span>

                <span className="text-xs text-outline font-medium">
                  Batas Entri: {currentDeadline ? currentDeadline.deadline : '15 Okt 2026'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                {isClassSubmitted
                  ? 'Data nilai rapor rombel ini telah berhasil dikirim dan kini terkunci (Read-Only). Hubungi Waka Kurikulum jika memerlukan revisi nilai.'
                  : 'Harap periksa kelengkapan UH 1-3, Teori, dan Praktik sebelum diserahkan. Formula: NA = (avg(UH) × 40%) + (UAS Teori × 30%) + (UAS Praktik × 30%). Nilai kosong akan memblokir proses submit.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleCheckValidation}
              className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-xs border border-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">rule</span>
              <span>Cek Kelengkapan ({stats.belumCount} Belum)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between shadow-card border border-surface-container-high">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Distribusi Kelulusan KKM
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {activeClass?.name}
            </span>
          </div>

          <div className="flex items-end justify-between my-2">
            <div>
              <div className="text-3xl font-extrabold text-on-surface leading-none">
                {stats.tuntasPercent}%
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Tuntas KKM ({activeSubject?.kkm})
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {stats.tuntasCount} Tuntas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                {stats.remedialCount} Remedial
              </span>
            </div>
          </div>

          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${stats.tuntasPercent}%` }}
            ></div>
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${100 - stats.tuntasPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Table Toolbar & Actions */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa atau NISN..."
              className="w-full bg-surface-container-low pl-9 pr-3 py-2 rounded-xl text-xs font-medium text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Semua ({classStudents.length})
            </button>
            <button
              onClick={() => setFilterMode('remedial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'remedial'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Remedial (&lt; 75)
            </button>
            <button
              onClick={() => setFilterMode('lengkap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'lengkap'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Sudah Lengkap
            </button>
          </div>
        </div>

        {/* Right: Submit Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          {!isClassSubmitted ? (
            <button
              onClick={handleOpenSubmitDialog}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Kirim Nilai Rapor</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-300">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Nilai Rapor Terkirim & Terkunci</span>
            </div>
          )}
        </div>
      </div>

      {/* Editable Ledger Sheet */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden flex flex-col">
        <div className="p-4 bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">table_chart</span>
            <span className="text-sm font-bold text-on-surface">
              Lembar Entri Nilai Capaian Pembelajaran Siswa
            </span>
          </div>

          {/* ON/OFF Switches for Teori & Praktik */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded-xl border border-surface-container-high shadow-xs">
              <span className="text-on-surface-variant font-bold text-[11px]">Komponen UAS:</span>
              
              {/* Toggle Teori */}
              <button
                type="button"
                onClick={() => setShowTeori(!showTeori)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showTeori
                    ? 'bg-secondary text-white shadow-xs'
                    : 'bg-surface-container-high text-outline line-through hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showTeori ? 'toggle_on' : 'toggle_off'}
                </span>
                <span>UAS Teori</span>
              </button>

              {/* Toggle Praktik */}
              <button
                type="button"
                onClick={() => setShowPraktik(!showPraktik)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showPraktik
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-surface-container-high text-outline line-through hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showPraktik ? 'toggle_on' : 'toggle_off'}
                </span>
                <span>UAS Praktik</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-2 text-center w-[48px] min-w-[48px] max-w-[48px] sticky left-0 bg-surface-container border-r border-surface-container-high z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]" rowSpan={2}>
                  No
                </th>
                <th className="py-3 px-2 text-center w-[110px] min-w-[110px] max-w-[110px] sticky left-[48px] bg-surface-container border-r border-surface-container-high z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]" rowSpan={2}>
                  NISN
                </th>
                <th className="py-3 px-3 text-left w-[220px] min-w-[220px] max-w-[220px] sticky left-[158px] bg-surface-container border-r-2 border-surface-container-high z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]" rowSpan={2}>
                  Nama Lengkap Siswa
                </th>
                <th className="py-2 px-3 text-center bg-surface-container-high text-primary font-bold" colSpan={uhCategories.length + 1}>
                  <div className="flex items-center justify-center gap-2">
                    <span>Ulangan Harian (Formatif / TP)</span>
                    {!isClassSubmitted && (
                      <button
                        type="button"
                        onClick={() => addGradeCategory(activeSubject.id, activeClass.id, 'ulangan_harian')}
                        className="inline-flex items-center gap-1 bg-primary text-white hover:bg-primary-container px-2 py-0.5 rounded text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        title="Tambah Kolom Ulangan Harian"
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        <span>Tambah Kolom</span>
                      </button>
                    )}
                  </div>
                </th>
                <th className="py-2 px-3 text-center bg-indigo-50 text-indigo-700 font-bold border-l border-indigo-200" colSpan={tugasCategories.length + 1}>
                  <div className="flex items-center justify-center gap-2">
                    <span>Tugas (Formatif)</span>
                    {!isClassSubmitted && (
                      <button
                        type="button"
                        onClick={() => addGradeCategory(activeSubject.id, activeClass.id, 'tugas')}
                        className="inline-flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        title="Tambah Kolom Tugas"
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        <span>Tambah Kolom</span>
                      </button>
                    )}
                  </div>
                </th>

                {(showTeori || showPraktik) && (
                  <th className="py-2 px-3 text-center bg-surface-container text-secondary font-bold border-l" colSpan={(showTeori ? 1 : 0) + (showPraktik ? 1 : 0)}>
                    UAS / SAS
                  </th>
                )}

                {currentUser?.role !== 'guru' && (
                  <th className="py-3 px-3 text-center w-24 bg-surface-container-highest text-primary font-bold" rowSpan={2}>
                    Nilai Akhir (NA)
                  </th>
                )}
                <th className="py-3 px-3 text-center w-28" rowSpan={2}>
                  Status KKM
                </th>
                <th className="py-3 px-4 min-w-[260px]" rowSpan={2}>
                  Deskripsi Capaian Kompetensi / Catatan
                </th>
              </tr>
              <tr className="bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                {uhCategories.map((cat) => (
                  <th key={cat.id} className="py-2 px-2 text-center w-16 bg-surface-container-high/60 relative group/col">
                    <span>{cat.label}</span>
                    {!isClassSubmitted && (
                      <button
                        type="button"
                        onClick={() => deleteGradeCategory(cat.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold opacity-0 group-hover/col:opacity-100 transition-opacity shadow-xs cursor-pointer z-40"
                        title={`Hapus kolom ${cat.label}`}
                      >
                        ✕
                      </button>
                    )}
                  </th>
                ))}
                <th className="py-2 px-2 text-center w-20 bg-surface-container-high text-primary font-bold">
                  Rata UH
                </th>

                {tugasCategories.map((cat) => (
                  <th key={cat.id} className="py-2 px-2 text-center w-16 bg-indigo-50/80 text-indigo-900 border-l border-indigo-100 relative group/col">
                    <span>{cat.label}</span>
                    {!isClassSubmitted && (
                      <button
                        type="button"
                        onClick={() => deleteGradeCategory(cat.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold opacity-0 group-hover/col:opacity-100 transition-opacity shadow-xs cursor-pointer z-40"
                        title={`Hapus kolom ${cat.label}`}
                      >
                        ✕
                      </button>
                    )}
                  </th>
                ))}
                <th className="py-2 px-2 text-center w-20 bg-indigo-100 text-indigo-900 font-bold border-l border-indigo-200">
                  Rata Tugas
                </th>

                {showTeori && <th className="py-2 px-2 text-center w-20 border-l">Teori</th>}
                {showPraktik && <th className="py-2 px-2 text-center w-20 border-l">Praktik</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {filteredStudents.map((student, idx) => {
                const g = grades.find(
                  (grade) =>
                    grade.studentId === student.id &&
                    grade.subjectId === activeSubject?.id &&
                    grade.classId === activeClass?.id
                );

                const catScores = g?.categoryScores || {};

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-outline sticky left-0 w-[48px] min-w-[48px] max-w-[48px] bg-surface-container-lowest group-hover:bg-surface-container-low border-r border-surface-container-high z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums sticky left-[48px] w-[110px] min-w-[110px] max-w-[110px] bg-surface-container-lowest group-hover:bg-surface-container-low border-r border-surface-container-high z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-on-surface-variant">
                      {student.nisn}
                    </td>
                    <td className="py-2.5 px-4 font-bold sticky left-[158px] w-[220px] min-w-[220px] max-w-[220px] bg-surface-container-lowest group-hover:bg-surface-container-low border-r-2 border-surface-container-high z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] truncate">
                      {student.fullName}
                      <span className="block text-[10px] font-normal text-on-surface-variant">
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Absen {student.absenNumber}
                      </span>
                    </td>

                    {/* Dynamic UH Inputs */}
                    {uhCategories.map((cat, catIdx) => {
                      // Fallback for static uh1, uh2, uh3 if categoryScores is empty
                      let scoreVal: number | null | undefined = catScores[cat.id];
                      if (scoreVal === undefined) {
                        if (catIdx === 0) scoreVal = g?.uh1;
                        else if (catIdx === 1) scoreVal = g?.uh2;
                        else if (catIdx === 2) scoreVal = g?.uh3;
                        else if (catIdx === 3) scoreVal = g?.uh4;
                      }

                      return (
                        <td key={cat.id} className="py-2 px-1 text-center bg-surface-container-low/50">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={isClassSubmitted}
                            value={scoreVal !== null && scoreVal !== undefined ? scoreVal : ''}
                            onChange={(e) => handleCategoryScoreChange(student.id, cat.id, e.target.value)}
                            placeholder="—"
                            className="w-14 text-center py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs border border-surface-container-high disabled:opacity-75 disabled:bg-surface-container"
                          />
                        </td>
                      );
                    })}

                    {/* Avg UH */}
                    <td className="py-2 px-2 text-center bg-surface-container-high/40 tabular-nums font-bold text-primary">
                      {g?.avgUh !== null && g?.avgUh !== undefined ? g.avgUh.toFixed(1) : '—'}
                    </td>

                    {/* Dynamic Tugas Inputs */}
                    {tugasCategories.map((cat) => {
                      const scoreVal = catScores[cat.id];
                      return (
                        <td key={cat.id} className="py-2 px-1 text-center bg-indigo-50/30 border-l border-indigo-100">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={isClassSubmitted}
                            value={scoreVal !== null && scoreVal !== undefined ? scoreVal : ''}
                            onChange={(e) => handleCategoryScoreChange(student.id, cat.id, e.target.value)}
                            placeholder="—"
                            className="w-14 text-center py-1.5 rounded-lg bg-surface-container-lowest text-indigo-950 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs border border-indigo-200 disabled:opacity-75 disabled:bg-surface-container"
                          />
                        </td>
                      );
                    })}

                    {/* Avg Tugas */}
                    <td className="py-2 px-2 text-center bg-indigo-100/60 tabular-nums font-bold text-indigo-900 border-l border-indigo-200">
                      {g?.avgTugas !== null && g?.avgTugas !== undefined ? g.avgTugas.toFixed(1) : '—'}
                    </td>

                    {/* UAS Teori */}
                    {showTeori && (
                      <td className="py-2 px-1 text-center border-l">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isClassSubmitted}
                          value={g?.uasTeori !== null && g?.uasTeori !== undefined ? g.uasTeori : ''}
                          onChange={(e) => handleScoreChange(student.id, 'uasTeori', e.target.value)}
                          placeholder="—"
                          className="w-14 text-center py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-secondary shadow-xs border border-surface-container-high disabled:opacity-75 disabled:bg-surface-container"
                        />
                      </td>
                    )}

                    {/* UAS Praktik */}
                    {showPraktik && (
                      <td className="py-2 px-1 text-center border-l">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isClassSubmitted}
                          value={g?.uasPraktik !== null && g?.uasPraktik !== undefined ? g.uasPraktik : ''}
                          onChange={(e) => handleScoreChange(student.id, 'uasPraktik', e.target.value)}
                          placeholder="—"
                          className="w-14 text-center py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-secondary shadow-xs border border-surface-container-high disabled:opacity-75 disabled:bg-surface-container"
                        />
                      </td>
                    )}

                    {/* Nilai Akhir (NA) */}
                    <td className="py-2 px-3 text-center bg-surface-container-highest/60 font-mono tabular-nums font-bold text-sm text-primary">
                      {g?.finalScore !== null && g?.finalScore !== undefined
                        ? g.finalScore.toFixed(1)
                        : '—'}
                    </td>

                    {/* Status KKM */}
                    <td className="py-2 px-3 text-center">
                      {g?.finalScore !== null && g?.finalScore !== undefined ? (
                        g.finalScore >= (activeSubject?.kkm || 75) ? (
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
                        <span className="text-[11px] font-semibold text-outline">
                          Belum Lengkap
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        disabled={isClassSubmitted}
                        value={g?.competencyNotes || ''}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        placeholder="Masukkan catatan capaian kompetensi..."
                        className="w-full text-xs py-1.5 px-3 rounded-lg bg-surface-container-lowest text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline disabled:opacity-75 disabled:bg-surface-container"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double Confirmation Modal (Exact wording requested) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="text-lg font-bold text-on-surface">Konfirmasi Kirim Nilai Rapor</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Yakin kirim nilai untuk <strong>[{activeSubject?.name}] - [{activeClass?.name}]</strong>? Data tidak bisa diubah lagi tanpa dikembalikan oleh Admin/Waka/Kepsek.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete / Missing Scores Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 text-error mb-2">
              <span className="material-symbols-outlined text-[32px]">error</span>
              <h3 className="text-lg font-bold text-on-surface">Nilai Belum Lengkap</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              Sistem menolak pengiriman karena terdapat siswa dengan komponen nilai yang masih kosong. Lengkapi seluruh nilai berikut sebelum menyerahkan:
            </p>
            <div className="max-h-56 overflow-y-auto bg-surface-container-low rounded-xl p-3 border border-surface-container-high space-y-1.5">
              {missingStudentsList.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-error font-medium">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-5 py-2.5 bg-on-surface text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90"
              >
                Mengerti & Kembali Mengisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
