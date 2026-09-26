import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';

export interface FormulaWeights {
  id?: number | null;
  subject_id?: string | number | null;
  ulangan_harian_weight: number;
  tugas_weight: number;
  uas_weight: number;
  updated_by_name?: string;
  updated_at?: string;
}

export const GradeFormulaSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const { subjects } = useSchool();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(''); // '' = Global Default
  const [uhWeight, setUhWeight] = useState<number>(40);
  const [tugasWeight, setTugasWeight] = useState<number>(0);
  const [uasWeight, setUasWeight] = useState<number>(60);
  const [updatedBy, setUpdatedBy] = useState<string>('Administrator');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check role authorization
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'kepsek';

  // Load weights from API or localStorage fallback
  const fetchWeights = (subjectIdParam: string) => {
    setLoading(true);
    const token = localStorage.getItem('sinilai_jwt_token') || '';
    const query = subjectIdParam ? `?subject_id=${subjectIdParam}` : '';

    fetch(`http://127.0.0.1:8000/api/grade-formula-settings${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat pengaturan bobot');
        return res.json();
      })
      .then((data) => {
        if (data.weights) {
          setUhWeight(data.weights.ulangan_harian_weight ?? 40);
          setTugasWeight(data.weights.tugas_weight ?? 0);
          setUasWeight(data.weights.uas_weight ?? 60);
          setUpdatedBy(data.weights.updated_by_name || 'Administrator');
          setUpdatedAt(data.weights.updated_at || new Date().toLocaleString('id-ID'));
        }
      })
      .catch(() => {
        // LocalStorage fallback if offline
        const key = subjectIdParam ? `sinilai_weights_${subjectIdParam}` : 'sinilai_weights_global';
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUhWeight(parsed.ulangan_harian_weight);
          setTugasWeight(parsed.tugas_weight);
          setUasWeight(parsed.uas_weight);
          setUpdatedBy(parsed.updated_by_name || 'Administrator');
          setUpdatedAt(parsed.updated_at || new Date().toLocaleString('id-ID'));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchWeights(selectedSubjectId);
    }
  }, [selectedSubjectId, isAuthorized]);

  const totalWeight = Math.round((uhWeight + tugasWeight + uasWeight) * 100) / 100;
  const isValidTotal = totalWeight === 100;

  const handleSave = () => {
    if (!isValidTotal) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      subject_id: selectedSubjectId ? selectedSubjectId : null,
      ulangan_harian_weight: uhWeight,
      tugas_weight: tugasWeight,
      uas_weight: uasWeight,
    };

    const token = localStorage.getItem('sinilai_jwt_token') || '';

    fetch('http://127.0.0.1:8000/api/grade-formula-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Terjadi kesalahan saat menyimpan bobot');
        }
        return data;
      })
      .then((data) => {
        setMessage({ type: 'success', text: data.message || 'Pengaturan bobot nilai berhasil disimpan!' });
        if (data.weights) {
          setUpdatedBy(data.weights.updated_by_name || currentUser?.name || 'Administrator');
          setUpdatedAt(data.weights.updated_at || new Date().toLocaleString('id-ID'));
        }
        // Save to localStorage for instant client fallback
        const key = selectedSubjectId ? `sinilai_weights_${selectedSubjectId}` : 'sinilai_weights_global';
        localStorage.setItem(
          key,
          JSON.stringify({
            ulangan_harian_weight: uhWeight,
            tugas_weight: tugasWeight,
            uas_weight: uasWeight,
            updated_by_name: currentUser?.name || 'Administrator',
            updated_at: new Date().toLocaleString('id-ID'),
          })
        );
      })
      .catch((err: any) => {
        setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan bobot.' });
      })
      .finally(() => setSaving(false));
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-900 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-red-600 block mb-2">lock_person</span>
          <h3 className="text-lg font-bold">Akses Dibatasi</h3>
          <p className="text-xs text-red-700 mt-1">
            Halaman **Pengaturan Bobot Nilai (NA)** hanya dapat diakses oleh **Admin** dan **Kepala Sekolah**.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined text-[28px]">tune</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Pengaturan Bobot Nilai Akhir (NA)</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Konfigurasi persentase bobot Ulangan Harian, Tugas, dan UAS secara global atau per mata pelajaran.
            </p>
          </div>
        </div>
      </div>

      {/* Target Subject Selector */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-card space-y-6">
        <div>
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
            Target Pengaturan Bobot
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-80 bg-surface-container-low px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">🌐 Standar Global (Semua Mata Pelajaran)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                📌 Override Khusus: {s.code} - {s.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            {selectedSubjectId === ''
              ? 'Pengaturan ini akan menjadi bobot bawaan untuk seluruh mata pelajaran yang tidak memiliki override khusus.'
              : 'Pengaturan ini khusus berlaku untuk mata pelajaran ini saja.'}
          </p>
        </div>

        {/* Weights Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Ulangan Harian Weight */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary">Ulangan Harian (UH)</label>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Formatif</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={uhWeight}
                onChange={(e) => setUhWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-lg font-bold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-outline">%</span>
            </div>
            <p className="text-[10px] text-on-surface-variant">Bobot persentase rata-rata UH.</p>
          </div>

          {/* Tugas Weight */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-700">Tugas Siswa</label>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">Formatif</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tugasWeight}
                onChange={(e) => setTugasWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-lg font-bold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-outline">%</span>
            </div>
            <p className="text-[10px] text-on-surface-variant">Bobot persentase rata-rata Tugas.</p>
          </div>

          {/* UAS / SAS Weight */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-secondary">UAS / SAS</label>
              <span className="text-[10px] bg-secondary-container/40 text-secondary px-2 py-0.5 rounded font-bold">Sumatif</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={uasWeight}
                onChange={(e) => setUasWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-lg font-bold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-outline">%</span>
            </div>
            <p className="text-[10px] text-on-surface-variant">Bobot persentase nilai akhir semester.</p>
          </div>
        </div>

        {/* Live Total Badge & Save Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-surface-container-high">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                isValidTotal
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isValidTotal ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              ></span>
              <span>Total Bobot: {totalWeight}%</span>
              {!isValidTotal && <span>(Harus Tepat 100%)</span>}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={!isValidTotal || saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Bobot'}</span>
          </button>
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Audit Trail */}
        <div className="pt-2 text-[11px] text-outline flex items-center gap-1.5 border-t border-surface-container-high/60">
          <span className="material-symbols-outlined text-[14px]">history</span>
          <span>
            Terakhir diubah oleh <strong>{updatedBy}</strong> pada {updatedAt || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
