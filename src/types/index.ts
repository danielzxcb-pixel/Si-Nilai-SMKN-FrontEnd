export type Role = 'admin' | 'guru' | 'waka' | 'kepsek';

export type Semester = 'ganjil' | 'genap';

export type SubmissionStatus = 'belum_mulai' | 'sedang_diisi' | 'terkirim';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  nip?: string;
  avatar?: string;
  phone?: string;
  assignedSubjects: string[]; // Subject IDs or codes
  assignedClasses: string[];  // Class IDs or names
  canPrintRapor?: boolean;    // Specific authorization for Cetak Rapor & QR Hash
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Kejuruan' | 'Umum' | 'Muatan Lokal';
  kkm: number;
}

export interface SchoolClass {
  id: string;
  name: string;      // e.g. "10 RPL 1", "10 TKJ", "10 PM", "11 RPL", "12 RPL"
  tingkat: number;   // 10, 11, 12
  jurusan: string;   // RPL, TKJ, PM, DKV, etc.
  waliKelasId?: string;
  totalStudents: number;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  nik?: string;
  fullName: string;
  gender: 'L' | 'P';
  classId: string;
  className: string;
  absenNumber: number;
}

export interface GradeCategory {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  category: 'ulangan_harian' | 'tugas';
  label: string;
  sortOrder: number;
}

export interface GradeEntry {
  id: string;
  studentId: string;
  gradeCategoryId: string;
  score: number | null;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  semester: Semester;
  academicYear: string;
  categoryScores?: Record<string, number | null>; // categoryId -> score
  uh1?: number | null;
  uh2?: number | null;
  uh3?: number | null;
  uh4?: number | null;
  avgUh: number | null;
  avgTugas?: number | null;
  avgFormatif?: number | null;
  uasTeori: number | null;
  uasPraktik: number | null;
  finalScore: number | null;
  statusKkm: 'Tuntas' | 'Remedial' | 'Belum Dinilai';
  competencyNotes: string;
  submitted: boolean;
  updatedAt: string;
}

export interface GradeAuditLog {
  id: string;
  gradeId?: string;
  studentName: string;
  subjectName: string;
  className: string;
  changedBy: string;
  changedByRole: Role;
  oldScore: number | null;
  newScore: number | null;
  field: string;
  reason?: string;
  changedAt: string;
}

export interface SubmissionDeadline {
  id: string;
  subjectId: string;
  subjectName: string;
  semester: Semester;
  academicYear: string;
  deadline: string; // YYYY-MM-DD
  setBy: string;
}

export interface SubmissionTrackerItem {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  status: SubmissionStatus;
  completionPercent: number;
  submittedAt?: string;
  updatedAt: string;
}

export interface PklAssessment {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  companyName: string;
  supervisorName: string;
  startDate: string;
  endDate: string;
  disiplinScore: number;    // 25%
  skillScore: number;       // 35%
  teamworkScore: number;    // 20%
  portfolioScore: number;   // 20%
  finalScore: number;
  notes: string;
}
