import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { realtime, REALTIME_EVENTS } from '../../services/realtime';

export const RealtimeTrackerView: React.FC = () => {
  const { tracker, subjects, classes, users } = useSchool();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator helper: simulates real-time WebSocket push from a teacher
  const handleSimulateLiveSubmission = () => {
    const unsubmitted = tracker.filter((t) => t.status !== 'terkirim');
    const target = unsubmitted.length > 0 ? unsubmitted[0] : tracker[0];

    if (target) {
      const now = new Date();
      const nowWIB = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB`;

      realtime.publish(REALTIME_EVENTS.SUBMISSION_CHANGED, {
        subjectId: target.subjectId,
        classId: target.classId,
        teacherId: target.teacherId,
        status: 'terkirim',
        submittedAt: nowWIB,
        updatedAt: nowWIB,
      });
    }
  };

  const filteredItems = tracker.filter((item) => {
    const matchesSearch =
      item.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const countTerkirim = tracker.filter((t) => t.status === 'terkirim').length;
  const countSedang = tracker.filter((t) => t.status === 'sedang_diisi').length;
  const countBelum = tracker.filter((t) => t.status === 'belum_mulai').length;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
            <span>SMKN 1 Tanjungpandan</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Pantau Keterisian Rapor</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Progres Pengisian & Penyerahan Nilai Guru
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pantau status guru yang sedang mengisi atau sudah menyerahkan nilai rapor kelas secara langsung dan otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateLiveSubmission}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
            title="Uji coba pembaruan status nilai langsung"
          >
            <span className="material-symbols-outlined text-[18px]">autorenew</span>
            <span>Uji Simulasi Nilai Masuk</span>
          </button>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              🟢 Terkirim & Terverifikasi
            </span>
            <span className="text-3xl font-extrabold text-emerald-700 mt-1">{countTerkirim}</span>
            <span className="text-[11px] text-on-surface-variant">Siap Cetak Rapor</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              🟡 Sedang Diisi / Draf
            </span>
            <span className="text-3xl font-extrabold text-amber-700 mt-1">{countSedang}</span>
            <span className="text-[11px] text-on-surface-variant">Dalam Proses Entri</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">edit_note</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              🔴 Belum Mulai
            </span>
            <span className="text-3xl font-extrabold text-rose-700 mt-1">{countBelum}</span>
            <span className="text-[11px] text-on-surface-variant">Perlu Pengingat H-3</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru, mata pelajaran, atau rombel..."
            className="w-full bg-surface-container-low pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-primary-container text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Semua ({tracker.length})
          </button>
          <button
            onClick={() => setFilterStatus('terkirim')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'terkirim'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            🟢 Terkirim ({countTerkirim})
          </button>
          <button
            onClick={() => setFilterStatus('sedang_diisi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'sedang_diisi'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            🟡 Sedang Diisi ({countSedang})
          </button>
          <button
            onClick={() => setFilterStatus('belum_mulai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'belum_mulai'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            🔴 Belum Mulai ({countBelum})
          </button>
        </div>
      </div>

      {/* Tracker Grid / List */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Guru Pengampu</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Kelas / Rombel</th>
                <th className="py-3 px-4">Progress Kelengkapan</th>
                <th className="py-3 px-4">Waktu Penyerahan (WIB)</th>
                <th className="py-3 px-4">Pembaruan Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/70 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    {item.status === 'terkirim' && (
                      <span className="inline-flex w-3 h-3 rounded-full bg-emerald-500 shadow-sm" title="Terkirim"></span>
                    )}
                    {item.status === 'sedang_diisi' && (
                      <span className="inline-flex w-3 h-3 rounded-full bg-amber-500 shadow-sm animate-pulse" title="Sedang Diisi"></span>
                    )}
                    {item.status === 'belum_mulai' && (
                      <span className="inline-flex w-3 h-3 rounded-full bg-rose-500 shadow-sm" title="Belum Mulai"></span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold">{item.teacherName}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg border border-primary/20">
                      {item.subjectName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-secondary">Kelas {item.className}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.status === 'terkirim'
                              ? 'bg-emerald-600'
                              : item.status === 'sedang_diisi'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.completionPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums font-bold">
                        {item.completionPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                    {item.submittedAt ? (
                      <span className="text-emerald-700 font-semibold">{item.submittedAt}</span>
                    ) : (
                      <span className="text-outline italic">Menunggu submit</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-outline text-[11px]">
                    {item.updatedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
