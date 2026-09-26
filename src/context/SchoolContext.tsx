import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Subject,
  SchoolClass,
  Student,
  Grade,
  GradeCategory,
  GradeEntry,
  GradeAuditLog,
  SubmissionDeadline,
  SubmissionTrackerItem,
  PklAssessment,
  Semester,
} from '../types';
import {
  SEED_USERS,
  SEED_SUBJECTS,
  SEED_CLASSES,
  SEED_STUDENTS,
  INITIAL_GRADES,
  INITIAL_DEADLINES,
  INITIAL_TRACKER,
  INITIAL_AUDIT_LOGS,
  INITIAL_PKL_ASSESSMENTS,
} from '../data/mockData';
import { realtime, REALTIME_EVENTS } from '../services/realtime';
import { useAuth } from './AuthContext';

interface SchoolContextType {
  users: User[];
  subjects: Subject[];
  classes: SchoolClass[];
  students: Student[];
  grades: Grade[];
  deadlines: SubmissionDeadline[];
  tracker: SubmissionTrackerItem[];
  auditLogs: GradeAuditLog[];
  pklAssessments: PklAssessment[];
  academicYear: string;
  semester: Semester;
  
  gradeCategories: GradeCategory[];
  addGradeCategory: (subjectId: string, classId: string, category: 'ulangan_harian' | 'tugas') => void;
  deleteGradeCategory: (catId: string) => void;

  // Realtime Teacher Scope & Permission Edit (Crucial Requirement)
  updateTeacherPermissions: (
    teacherId: string,
    assignedSubjects: string[],
    assignedClasses: string[],
    canPrintRapor?: boolean
  ) => void;
  
  // Grade actions
  saveGrade: (
    gradeData: {
      studentId: string;
      subjectId: string;
      classId: string;
      teacherId: string;
      uh1?: number | null;
      uh2?: number | null;
      uh3?: number | null;
      uh4?: number | null;
      categoryScores?: Record<string, number | null>;
      uasTeori?: number | null;
      uasPraktik?: number | null;
      competencyNotes?: string;
    },
    userRole: string,
    userName: string
  ) => void;

  submitGrades: (
    subjectId: string,
    classId: string,
    teacherId: string
  ) => { success: boolean; missingStudents: string[]; message: string };

  requestRevision: (
    subjectId: string,
    classId: string,
    requestedBy: string,
    requestedByRole: any,
    reason: string
  ) => void;

  addOrUpdateDeadline: (subjectId: string, deadlineDate: string, setBy: string) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  importStudentsBatch: (newStudents: Omit<Student, 'id'>[]) => void;
  updatePklAssessment: (assessment: PklAssessment) => void;
  
  // Subject & Class Management (Admin)
  addSubject: (newSubject: Omit<Subject, 'id'>) => Subject;
  deleteSubject: (subjectId: string) => void;
  addClass: (newClass: Omit<SchoolClass, 'id' | 'totalStudents'>) => SchoolClass;
  deleteClass: (classId: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateCurrentUserPermissions, currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sinilai_users');
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('sinilai_subjects');
    return saved ? JSON.parse(saved) : SEED_SUBJECTS;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('sinilai_classes');
    return saved ? JSON.parse(saved) : SEED_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sinilai_students');
    return saved ? JSON.parse(saved) : SEED_STUDENTS;
  });

  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('sinilai_grades');
    return saved ? JSON.parse(saved) : INITIAL_GRADES;
  });

  const [deadlines, setDeadlines] = useState<SubmissionDeadline[]>(() => {
    const saved = localStorage.getItem('sinilai_deadlines');
    return saved ? JSON.parse(saved) : INITIAL_DEADLINES;
  });

  const [tracker, setTracker] = useState<SubmissionTrackerItem[]>(() => {
    const saved = localStorage.getItem('sinilai_tracker');
    return saved ? JSON.parse(saved) : INITIAL_TRACKER;
  });

  const [auditLogs, setAuditLogs] = useState<GradeAuditLog[]>(() => {
    const saved = localStorage.getItem('sinilai_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [pklAssessments, setPklAssessments] = useState<PklAssessment[]>(() => {
    const saved = localStorage.getItem('sinilai_pkl');
    return saved ? JSON.parse(saved) : INITIAL_PKL_ASSESSMENTS;
  });

  const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>(() => {
    const saved = localStorage.getItem('sinilai_grade_categories');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 'cat-uh-1', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'ulangan_harian', label: 'UH 1', sortOrder: 1 },
          { id: 'cat-uh-2', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'ulangan_harian', label: 'UH 2', sortOrder: 2 },
          { id: 'cat-uh-3', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'ulangan_harian', label: 'UH 3', sortOrder: 3 },
          { id: 'cat-uh-4', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'ulangan_harian', label: 'UH 4', sortOrder: 4 },
          { id: 'cat-tg-1', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'tugas', label: 'Tugas 1', sortOrder: 1 },
          { id: 'cat-tg-2', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'tugas', label: 'Tugas 2', sortOrder: 2 },
          { id: 'cat-tg-3', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'tugas', label: 'Tugas 3', sortOrder: 3 },
          { id: 'cat-tg-4', subjectId: 'ALL', classId: 'ALL', teacherId: 'ALL', category: 'tugas', label: 'Tugas 4', sortOrder: 4 },
        ];
  });

  useEffect(() => {
    localStorage.setItem('sinilai_grade_categories', JSON.stringify(gradeCategories));
  }, [gradeCategories]);

  const addGradeCategory = (subjectId: string, classId: string, category: 'ulangan_harian' | 'tugas') => {
    const relevantCats = gradeCategories.filter(
      (c) =>
        (c.subjectId === subjectId || c.subjectId === 'ALL') &&
        (c.classId === classId || c.classId === 'ALL') &&
        c.category === category
    );
    const nextOrder = relevantCats.length + 1;
    const prefix = category === 'ulangan_harian' ? 'UH' : 'Tugas';
    const newCat: GradeCategory = {
      id: `cat-${category}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      subjectId,
      classId,
      teacherId: currentUser?.id || 'USR-GURU',
      category,
      label: `${prefix} ${nextOrder}`,
      sortOrder: nextOrder,
    };
    setGradeCategories((prev) => [...prev, newCat]);

    // Async sync with API backend
    fetch('http://127.0.0.1:8000/api/grade-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
      body: JSON.stringify({
        subject_id: subjectId,
        class_id: classId,
        category,
      }),
    }).catch(() => {});
  };

  const deleteGradeCategory = (catId: string) => {
    setGradeCategories((prev) => prev.filter((c) => c.id !== catId));

    setGrades((prev) =>
      prev.map((g) => {
        if (!g.categoryScores || g.categoryScores[catId] === undefined) return g;
        const newCatScores = { ...g.categoryScores };
        delete newCatScores[catId];
        return {
          ...g,
          categoryScores: newCatScores,
        };
      })
    );

    fetch(`http://127.0.0.1:8000/api/grade-categories/${catId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
    }).catch(() => {});
  };

  const academicYear = '2024/2025';
  const semester: Semester = 'genap';

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sinilai_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sinilai_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('sinilai_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

  useEffect(() => {
    localStorage.setItem('sinilai_tracker', JSON.stringify(tracker));
  }, [tracker]);

  useEffect(() => {
    localStorage.setItem('sinilai_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('sinilai_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sinilai_pkl', JSON.stringify(pklAssessments));
  }, [pklAssessments]);

  useEffect(() => {
    localStorage.setItem('sinilai_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('sinilai_classes', JSON.stringify(classes));
  }, [classes]);

  // LISTEN TO REMOTE REALTIME EVENTS
  useEffect(() => {
    const unsubPermissions = realtime.subscribe(REALTIME_EVENTS.PERMISSIONS_UPDATED, (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === data.teacherId
            ? { ...u, assignedSubjects: data.assignedSubjects, assignedClasses: data.assignedClasses }
            : u
        )
      );
    });

    const unsubSubmissions = realtime.subscribe(REALTIME_EVENTS.SUBMISSION_CHANGED, (data) => {
      setTracker((prevTracker) => {
        const existingIdx = prevTracker.findIndex(
          (t) => t.subjectId === data.subjectId && t.classId === data.classId
        );
        if (existingIdx >= 0) {
          const updated = [...prevTracker];
          updated[existingIdx] = {
            ...updated[existingIdx],
            status: data.status,
            completionPercent: data.status === 'terkirim' ? 100 : 80,
            submittedAt: data.submittedAt,
            updatedAt: data.updatedAt,
          };
          return updated;
        }
        return prevTracker;
      });

      setGrades((prevGrades) =>
        prevGrades.map((g) =>
          g.subjectId === data.subjectId && g.classId === data.classId
            ? { ...g, submitted: data.status === 'terkirim' }
            : g
        )
      );
    });

    return () => {
      unsubPermissions();
      unsubSubmissions();
    };
  }, []);

  // 1. UPDATE TEACHER PERMISSIONS (SUBJECTS & CLASSES) WITH REALTIME INSTANT SYNC
  const updateTeacherPermissions = (
    teacherId: string,
    assignedSubjects: string[],
    assignedClasses: string[],
    canPrintRapor?: boolean
  ) => {
    const targetTeacher = users.find((u) => u.id === teacherId);
    const teacherName = targetTeacher ? targetTeacher.name : 'Guru';
    const nowWIB = RealtimeBroadcasterWIB();

    // 1. Update local users state
    setUsers((prev) =>
      prev.map((u) =>
        u.id === teacherId
          ? {
              ...u,
              assignedSubjects,
              assignedClasses,
              canPrintRapor: canPrintRapor !== undefined ? canPrintRapor : u.canPrintRapor,
            }
          : u
      )
    );

    // 2. If the current logged in user is this teacher, immediately update current user state
    if (currentUser?.id === teacherId) {
      updateCurrentUserPermissions(assignedSubjects, assignedClasses, canPrintRapor);
    }

    // 3. Broadcast to all open sessions / tabs / listeners in real-time
    realtime.publish(REALTIME_EVENTS.PERMISSIONS_UPDATED, {
      teacherId,
      teacherName,
      assignedSubjects,
      assignedClasses,
      canPrintRapor,
      updatedAt: nowWIB,
    });
  };

  // Helper calculation for grade formula
  const calculateFinalGrade = (
    uh1: number | null,
    uh2: number | null,
    uh3: number | null,
    uh4: number | null = null,
    uasTeori: number | null = null,
    uasPraktik: number | null = null,
    categoryScores: Record<string, number | null> = {},
    subjectId?: string
  ) => {
    // 1. Collect all UH scores (from categoryScores or static uh1-uh4)
    const uhScoreList: number[] = [];
    const uhCatKeys = Object.keys(categoryScores).filter(
      (k) => k.startsWith('cat-uh-') || k.includes('ulangan_harian')
    );

    if (uhCatKeys.length > 0) {
      uhCatKeys.forEach((k) => {
        const v = categoryScores[k];
        if (v !== null && v !== undefined && !isNaN(v)) {
          uhScoreList.push(v);
        }
      });
    } else {
      [uh1, uh2, uh3, uh4].forEach((v) => {
        if (v !== null && v !== undefined && !isNaN(v)) {
          uhScoreList.push(v);
        }
      });
    }

    const avgUh =
      uhScoreList.length > 0
        ? Number((uhScoreList.reduce((a, b) => a + b, 0) / uhScoreList.length).toFixed(1))
        : null;

    // 2. Collect all Tugas scores
    const tgCatKeys = Object.keys(categoryScores).filter(
      (k) => k.startsWith('cat-tg-') || k.includes('tugas')
    );
    const tgScoreList: number[] = [];
    tgCatKeys.forEach((k) => {
      const v = categoryScores[k];
      if (v !== null && v !== undefined && !isNaN(v)) {
        tgScoreList.push(v);
      }
    });

    const avgTugas =
      tgScoreList.length > 0
        ? Number((tgScoreList.reduce((a, b) => a + b, 0) / tgScoreList.length).toFixed(1))
        : null;

    // 3. Collect UAS scores (Teori & Praktik)
    const uas = [uasTeori, uasPraktik].filter(
      (v): v is number => v !== null && v !== undefined && !isNaN(v)
    );
    const avgUas =
      uas.length > 0 ? Number((uas.reduce((a, b) => a + b, 0) / uas.length).toFixed(1)) : null;

    if (avgUh === null && avgTugas === null && avgUas === null) {
      return { avgUh: null, avgTugas: null, finalScore: null, statusKkm: 'Belum Dinilai' as const };
    }

    // 4. Determine weights (check custom subject or global weights)
    let wUh = 40;
    let wTugas = 0;
    let wUas = 60;

    try {
      const key = subjectId ? `sinilai_weights_${subjectId}` : 'sinilai_weights_global';
      const savedWeights = localStorage.getItem(key) || localStorage.getItem('sinilai_weights_global');
      if (savedWeights) {
        const parsed = JSON.parse(savedWeights);
        if (parsed.ulangan_harian_weight !== undefined) wUh = parsed.ulangan_harian_weight;
        if (parsed.tugas_weight !== undefined) wTugas = parsed.tugas_weight;
        if (parsed.uas_weight !== undefined) wUas = parsed.uas_weight;
      } else if (avgTugas !== null) {
        wUh = 30;
        wTugas = 20;
        wUas = 50;
      }
    } catch {
      // fallback to defaults
    }

    let totalWeight = 0;
    let weightedSum = 0;

    if (avgUh !== null && wUh > 0) {
      weightedSum += avgUh * wUh;
      totalWeight += wUh;
    }
    if (avgTugas !== null && wTugas > 0) {
      weightedSum += avgTugas * wTugas;
      totalWeight += wTugas;
    }
    if (avgUas !== null && wUas > 0) {
      weightedSum += avgUas * wUas;
      totalWeight += wUas;
    }

    let finalScore: number | null = null;
    if (totalWeight > 0) {
      finalScore = Number((weightedSum / totalWeight).toFixed(1));
    } else if (avgUh !== null) {
      finalScore = avgUh;
    }

    // 5. Subject KKM threshold (default 75.0)
    const targetSubject = subjects.find((s) => s.id === subjectId);
    const kkmThreshold = targetSubject?.kkm || 75.0;

    const statusKkm: 'Tuntas' | 'Remedial' | 'Belum Dinilai' =
      finalScore === null ? 'Belum Dinilai' : finalScore >= kkmThreshold ? 'Tuntas' : 'Remedial';

    return {
      avgUh,
      avgTugas,
      finalScore,
      statusKkm,
    };
  };

  // 2. SAVE GRADE IN REAL-TIME WITH AUDIT LOGGING
  const saveGrade = (
    gradeData: {
      studentId: string;
      subjectId: string;
      classId: string;
      teacherId: string;
      uh1?: number | null;
      uh2?: number | null;
      uh3?: number | null;
      uh4?: number | null;
      categoryScores?: Record<string, number | null>;
      uasTeori?: number | null;
      uasPraktik?: number | null;
      competencyNotes?: string;
    },
    userRole: string,
    userName: string
  ) => {
    const nowWIB = RealtimeBroadcasterWIB();
    const existingIndex = grades.findIndex(
      (g) =>
        g.studentId === gradeData.studentId &&
        g.subjectId === gradeData.subjectId &&
        g.classId === gradeData.classId
    );

    const prevGrade = existingIndex >= 0 ? grades[existingIndex] : null;

    // Merge existing categoryScores with newly provided ones
    const categoryScores: Record<string, number | null> = {
      ...(prevGrade?.categoryScores || {}),
      ...(gradeData.categoryScores || {}),
    };

    // Keep static uh1-uh4 synced with categoryScores
    if (gradeData.uh1 !== undefined) categoryScores['cat-uh-1'] = gradeData.uh1;
    if (gradeData.uh2 !== undefined) categoryScores['cat-uh-2'] = gradeData.uh2;
    if (gradeData.uh3 !== undefined) categoryScores['cat-uh-3'] = gradeData.uh3;
    if (gradeData.uh4 !== undefined) categoryScores['cat-uh-4'] = gradeData.uh4;

    const uh1 =
      categoryScores['cat-uh-1'] !== undefined
        ? categoryScores['cat-uh-1']
        : gradeData.uh1 !== undefined
        ? gradeData.uh1
        : (prevGrade?.uh1 ?? null);
    const uh2 =
      categoryScores['cat-uh-2'] !== undefined
        ? categoryScores['cat-uh-2']
        : gradeData.uh2 !== undefined
        ? gradeData.uh2
        : (prevGrade?.uh2 ?? null);
    const uh3 =
      categoryScores['cat-uh-3'] !== undefined
        ? categoryScores['cat-uh-3']
        : gradeData.uh3 !== undefined
        ? gradeData.uh3
        : (prevGrade?.uh3 ?? null);
    const uh4 =
      categoryScores['cat-uh-4'] !== undefined
        ? categoryScores['cat-uh-4']
        : gradeData.uh4 !== undefined
        ? gradeData.uh4
        : (prevGrade?.uh4 ?? null);

    const uasTeori =
      gradeData.uasTeori !== undefined ? gradeData.uasTeori : (prevGrade?.uasTeori ?? null);
    const uasPraktik =
      gradeData.uasPraktik !== undefined
        ? gradeData.uasPraktik
        : (prevGrade?.uasPraktik ?? null);

    const { avgUh, avgTugas, finalScore, statusKkm } = calculateFinalGrade(
      uh1,
      uh2,
      uh3,
      uh4,
      uasTeori,
      uasPraktik,
      categoryScores,
      gradeData.subjectId
    );

    const updatedGrade: Grade = {
      id: prevGrade ? prevGrade.id : `GRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: gradeData.studentId,
      subjectId: gradeData.subjectId,
      teacherId: gradeData.teacherId,
      classId: gradeData.classId,
      semester,
      academicYear,
      categoryScores,
      uh1,
      uh2,
      uh3,
      uh4,
      avgUh,
      avgTugas,
      uasTeori,
      uasPraktik,
      finalScore,
      statusKkm,
      competencyNotes:
        gradeData.competencyNotes !== undefined
          ? gradeData.competencyNotes
          : prevGrade?.competencyNotes || '',
      submitted: prevGrade?.submitted || false,
      updatedAt: nowWIB,
    };

    let newGradesList = [...grades];
    if (existingIndex >= 0) {
      newGradesList[existingIndex] = updatedGrade;
    } else {
      newGradesList.push(updatedGrade);
    }
    setGrades(newGradesList);

    // Audit log if score changed
    if (prevGrade && prevGrade.finalScore !== finalScore) {
      const student = students.find((s) => s.id === gradeData.studentId);
      const subject = subjects.find((s) => s.id === gradeData.subjectId);
      const cls = classes.find((c) => c.id === gradeData.classId);

      const log: GradeAuditLog = {
        id: `LOG-${Date.now()}`,
        gradeId: updatedGrade.id,
        studentName: student?.fullName || 'Siswa',
        subjectName: subject?.name || 'Mata Pelajaran',
        className: cls?.name || 'Kelas',
        changedBy: userName,
        changedByRole: userRole as any,
        oldScore: prevGrade.finalScore,
        newScore: finalScore,
        field: 'Perubahan Komponen Nilai / Formatif',
        reason: 'Input pembaruan nilai harian oleh pengajar',
        changedAt: nowWIB,
      };

      setAuditLogs((prev) => [log, ...prev]);
    }

    // Broadcast change
    realtime.publish(REALTIME_EVENTS.GRADE_CHANGED, {
      grade: updatedGrade,
      updatedBy: userName,
    });
  };

  // 3. SUBMIT GRADES (VALIDATES BLANK SCORES)
  const submitGrades = (subjectId: string, classId: string, teacherId: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    const missingStudents: string[] = [];

    classStudents.forEach((student) => {
      const grade = grades.find(
        (g) =>
          g.studentId === student.id && g.subjectId === subjectId && g.classId === classId
      );

      // Check if any required component is null/blank
      if (
        !grade ||
        grade.uh1 === null ||
        grade.uh2 === null ||
        grade.uh3 === null ||
        grade.uasTeori === null ||
        grade.uasPraktik === null
      ) {
        missingStudents.push(`${student.fullName} (NISN: ${student.nisn})`);
      }
    });

    if (missingStudents.length > 0) {
      return {
        success: false,
        missingStudents,
        message: `Terdapat ${missingStudents.length} siswa dengan nilai belum lengkap. Semua komponen wajib terisi sebelum diserahkan.`,
      };
    }

    const nowWIB = RealtimeBroadcasterWIB();

    // Mark as submitted
    setGrades((prev) =>
      prev.map((g) =>
        g.subjectId === subjectId && g.classId === classId ? { ...g, submitted: true } : g
      )
    );

    // Update or insert tracker
    const teacher = users.find((u) => u.id === teacherId);
    const subject = subjects.find((s) => s.id === subjectId);
    const cls = classes.find((c) => c.id === classId);

    setTracker((prev) => {
      const idx = prev.findIndex((t) => t.subjectId === subjectId && t.classId === classId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status: 'terkirim',
          completionPercent: 100,
          submittedAt: nowWIB,
          updatedAt: nowWIB,
        };
        return copy;
      } else {
        return [
          {
            id: `TRK-${Date.now()}`,
            teacherId,
            teacherName: teacher?.name || 'Guru',
            subjectId,
            subjectName: subject?.name || 'Mata Pelajaran',
            classId,
            className: cls?.name || 'Kelas',
            status: 'terkirim',
            completionPercent: 100,
            submittedAt: nowWIB,
            updatedAt: nowWIB,
          },
          ...prev,
        ];
      }
    });

    // Broadcast submission event
    realtime.publish(REALTIME_EVENTS.SUBMISSION_CHANGED, {
      subjectId,
      classId,
      teacherId,
      status: 'terkirim',
      submittedAt: nowWIB,
      updatedAt: nowWIB,
    });

    return {
      success: true,
      missingStudents: [],
      message: 'Nilai berhasil dikirim ke Waka Kurikulum & Kepala Sekolah.',
    };
  };

  // 4. REQUEST REVISION ("Kirim Balik untuk Revisi")
  const requestRevision = (
    subjectId: string,
    classId: string,
    requestedBy: string,
    requestedByRole: any,
    reason: string
  ) => {
    const nowWIB = RealtimeBroadcasterWIB();

    // Unset submitted flag
    setGrades((prev) =>
      prev.map((g) =>
        g.subjectId === subjectId && g.classId === classId ? { ...g, submitted: false } : g
      )
    );

    // Update tracker status
    setTracker((prev) =>
      prev.map((t) =>
        t.subjectId === subjectId && t.classId === classId
          ? { ...t, status: 'sedang_diisi', updatedAt: nowWIB }
          : t
      )
    );

    // Add audit log
    const subject = subjects.find((s) => s.id === subjectId);
    const cls = classes.find((c) => c.id === classId);

    const log: GradeAuditLog = {
      id: `LOG-${Date.now()}`,
      studentName: 'Seluruh Siswa Rombel',
      subjectName: subject?.name || 'Mata Pelajaran',
      className: cls?.name || 'Kelas',
      changedBy: requestedBy,
      changedByRole: requestedByRole,
      oldScore: null,
      newScore: null,
      field: 'Status Penyerahan Rapor',
      reason: `Dikembalikan untuk revisi: "${reason}"`,
      changedAt: nowWIB,
    };
    setAuditLogs((prev) => [log, ...prev]);

    // Broadcast revision event
    realtime.publish(REALTIME_EVENTS.SUBMISSION_CHANGED, {
      subjectId,
      classId,
      status: 'sedang_diisi',
      updatedAt: nowWIB,
      reason,
    });
  };

  // 5. UPDATE DEADLINE
  const addOrUpdateDeadline = (subjectId: string, deadlineDate: string, setBy: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const existingIdx = deadlines.findIndex((d) => d.subjectId === subjectId);

    if (existingIdx >= 0) {
      setDeadlines((prev) => {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], deadline: deadlineDate, setBy };
        return copy;
      });
    } else {
      setDeadlines((prev) => [
        ...prev,
        {
          id: `DDL-${Date.now()}`,
          subjectId,
          subjectName: subject?.name || 'Mata Pelajaran',
          semester,
          academicYear,
          deadline: deadlineDate,
          setBy,
        },
      ]);
    }
  };

  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `STD-${Date.now()}`,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const importStudentsBatch = (newStudentsList: Omit<Student, 'id'>[]) => {
    const formatted = newStudentsList.map((s, idx) => ({
      ...s,
      id: `STD-IMP-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => [...prev, ...formatted]);
  };

  const updatePklAssessment = (assessment: PklAssessment) => {
    setPklAssessments((prev) => {
      const idx = prev.findIndex((p) => p.id === assessment.id || p.studentId === assessment.studentId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = assessment;
        return copy;
      }
      return [...prev, assessment];
    });
  };

  const addSubject = (newSubject: Omit<Subject, 'id'>): Subject => {
    const id = `SUB-${Date.now()}`;
    const created: Subject = { ...newSubject, id };
    setSubjects((prev) => [...prev, created]);

    fetch('http://127.0.0.1:8000/api/admin/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
      body: JSON.stringify({
        code: created.code,
        name: created.name,
        category: created.category,
        kkm: created.kkm,
      }),
    }).catch(() => {});

    return created;
  };

  const deleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));

    // Also remove from teacher assignments
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        assignedSubjects: u.assignedSubjects.filter((id) => id !== subjectId),
      }))
    );

    fetch(`http://127.0.0.1:8000/api/admin/subjects/${subjectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
    }).catch(() => {});
  };

  const addClass = (newClass: Omit<SchoolClass, 'id' | 'totalStudents'>): SchoolClass => {
    const id = `CLS-${Date.now()}`;
    const created: SchoolClass = { ...newClass, id, totalStudents: 0 };
    setClasses((prev) => [...prev, created]);

    fetch('http://127.0.0.1:8000/api/admin/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
      body: JSON.stringify({
        name: created.name,
        tingkat: created.tingkat,
        jurusan: created.jurusan,
      }),
    }).catch(() => {});

    return created;
  };

  const deleteClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));

    // Also remove from teacher assignments
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        assignedClasses: u.assignedClasses.filter((id) => id !== classId),
      }))
    );

    fetch(`http://127.0.0.1:8000/api/admin/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sinilai_jwt_token') || ''}`,
      },
    }).catch(() => {});
  };

  return (
    <SchoolContext.Provider
      value={{
        users,
        subjects,
        classes,
        students,
        grades,
        deadlines,
        tracker,
        auditLogs,
        pklAssessments,
        academicYear,
        semester,
        gradeCategories,
        addGradeCategory,
        deleteGradeCategory,
        updateTeacherPermissions,
        saveGrade,
        submitGrades,
        requestRevision,
        addOrUpdateDeadline,
        addStudent,
        importStudentsBatch,
        updatePklAssessment,
        addSubject,
        deleteSubject,
        addClass,
        deleteClass,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

function RealtimeBroadcasterWIB(): string {
  const d = new Date();
  const dateStr = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${dateStr} ${timeStr} WIB`;
}
