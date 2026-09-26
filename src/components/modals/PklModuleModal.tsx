import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { PklAssessment } from '../../types';

export const PklModuleModal: React.FC = () => {
  const { pklAssessments, students, updatePklAssessment } = useSchool();
  const [editingAssessment, setEditingAssessment] = useState<PklAssessment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEdit = (p: PklAssessment) => {
    setEditingAssessment({ ...p });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment) return;

    // Calculate final score with 4 weighted aspects:
    // Disiplin 25%, Hard Skill 35%, Kerjasama 20%, Portofolio 20%
    const finalScore = Number(
      (
        editingAssessment.disiplinScore * 0.25 +
        editingAssessment.skillScore * 0.35 +
        editingAssessment.teamworkScore * 0.2 +
        editingAssessment.portfolioScore * 0.2
      ).toFixed(1)
    );

    const updated = {
      ...editingAssessment,
      finalScore,
    };

    updatePklAssessment(updated);
    setEditingAssessment(null);
    setToastMessage(`✅ Penilaian PKL untuk ${updated.studentName} berhasil disimpan! Nilai Akhir: ${finalScore}`);
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

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
            <span>Pendidikan Vokasi & Link-and-Match Industri</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">SMKN 1 Tanjungpandan</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Penilaian Praktik Kerja Lapangan (PKL) / Industri
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Komponen penilaian terstandar industri (Disiplin 25%, Hard Skill 35%, Kerjasama 20%, Portofolio 20%).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Integrasi Rapor Kurikulum Merdeka</span>
        </div>
      </div>

      {/* Weight Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-card">
          <span className="text-[11px] font-bold text-outline uppercase">Disiplin & Etos Kerja</span>
          <div className="text-2xl font-extrabold text-primary mt-1">25%</div>
          <span className="text-[11px] text-on-surface-variant">Kehadiran & Tata Tertib</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-card">
          <span className="text-[11px] font-bold text-outline uppercase">Hard Skill / Kompetensi</span>
          <div className="text-2xl font-extrabold text-secondary mt-1">35%</div>
          <span className="text-[11px] text-on-surface-variant">Keahlian Praktis Kejuruan</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-card">
          <span className="text-[11px] font-bold text-outline uppercase">Kerjasama & Komunikasi</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">20%</div>
          <span className="text-[11px] text-on-surface-variant">Teamwork di Lingkungan Kerja</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-card">
          <span className="text-[11px] font-bold text-outline uppercase">Portofolio & Laporan</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">20%</div>
          <span className="text-[11px] text-on-surface-variant">Dokumentasi Proyek Magang</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-4">Perusahaan / DUDI</th>
                <th className="py-3 px-4">Pembimbing Industri</th>
                <th className="py-3 px-2 text-center">Disiplin (25%)</th>
                <th className="py-3 px-2 text-center">Skill (35%)</th>
                <th className="py-3 px-2 text-center">Kerjasama (20%)</th>
                <th className="py-3 px-2 text-center">Portofolio (20%)</th>
                <th className="py-3 px-3 text-center bg-surface-container-highest text-primary font-bold">
                  Nilai Akhir
                </th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {pklAssessments.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-on-surface">{item.studentName}</div>
                    <span className="text-[11px] font-mono text-on-surface-variant">NISN: {item.nisn}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{item.companyName}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{item.supervisorName}</td>
                  <td className="py-3.5 px-2 text-center font-mono tabular-nums">{item.disiplinScore}</td>
                  <td className="py-3.5 px-2 text-center font-mono tabular-nums">{item.skillScore}</td>
                  <td className="py-3.5 px-2 text-center font-mono tabular-nums">{item.teamworkScore}</td>
                  <td className="py-3.5 px-2 text-center font-mono tabular-nums">{item.portfolioScore}</td>
                  <td className="py-3.5 px-3 text-center font-mono tabular-nums font-extrabold text-sm text-primary bg-surface-container-highest/60">
                    {item.finalScore.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Input Nilai</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-modal border border-surface-container-high p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">assignment</span>
                <h3 className="text-base font-bold text-on-surface">
                  Entri Nilai PKL: {editingAssessment.studentName}
                </h3>
              </div>
              <button
                onClick={() => setEditingAssessment(null)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface">Mitra Perusahaan (DUDI):</label>
                  <input
                    type="text"
                    value={editingAssessment.companyName}
                    onChange={(e) =>
                      setEditingAssessment({ ...editingAssessment, companyName: e.target.value })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface">Pembimbing Lapangan:</label>
                  <input
                    type="text"
                    value={editingAssessment.supervisorName}
                    onChange={(e) =>
                      setEditingAssessment({ ...editingAssessment, supervisorName: e.target.value })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-surface-container-high">
                <div>
                  <label className="font-bold text-on-surface">Disiplin (25%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAssessment.disiplinScore}
                    onChange={(e) =>
                      setEditingAssessment({
                        ...editingAssessment,
                        disiplinScore: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-bold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface">Hard Skill (35%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAssessment.skillScore}
                    onChange={(e) =>
                      setEditingAssessment({
                        ...editingAssessment,
                        skillScore: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-bold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface">Kerjasama (20%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAssessment.teamworkScore}
                    onChange={(e) =>
                      setEditingAssessment({
                        ...editingAssessment,
                        teamworkScore: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-bold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface">Portofolio (20%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAssessment.portfolioScore}
                    onChange={(e) =>
                      setEditingAssessment({
                        ...editingAssessment,
                        portfolioScore: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 font-bold font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface">Catatan Pembimbing / Deskripsi Magang:</label>
                <textarea
                  rows={3}
                  value={editingAssessment.notes}
                  onChange={(e) =>
                    setEditingAssessment({ ...editingAssessment, notes: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high mt-1"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="px-4 py-2 text-on-surface hover:bg-surface-container rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Nilai PKL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
