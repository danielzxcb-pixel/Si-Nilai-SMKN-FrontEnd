import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';

export const AuditLogModal: React.FC = () => {
  const { auditLogs } = useSchool();
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.studentName.toLowerCase().includes(search.toLowerCase()) ||
      log.changedBy.toLowerCase().includes(search.toLowerCase()) ||
      log.subjectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
            <span>SMKN 1 Tanjungpandan</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Keamanan & Riwayat Nilai</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Riwayat Perubahan Nilai Siswa
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Catatan transparan setiap kali ada guru atau petugas yang memperbarui nilai siswa agar terdata dengan rapi dan akurat.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, pengubah, mapel..."
              className="w-full bg-surface-container-low pl-9 pr-3 py-2 rounded-xl text-xs font-medium text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-surface-container-high overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-outline text-[11px] font-bold uppercase tracking-wider border-b border-surface-container-high">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Diubah Oleh</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Subjek / Siswa</th>
                <th className="py-3 px-4">Komponen & Nilai</th>
                <th className="py-3 px-4">Alasan Perubahan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-xs text-on-surface font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                    {log.changedAt}
                  </td>
                  <td className="py-3.5 px-4 font-bold">{log.changedBy}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                      {log.changedByRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold">{log.studentName}</div>
                    <span className="text-[11px] text-outline">
                      {log.subjectName} • {log.className}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {log.oldScore !== null && log.newScore !== null ? (
                      <span>
                        <span className="line-through text-rose-600">{log.oldScore}</span>
                        <span className="mx-1 text-outline">→</span>
                        <span className="font-bold text-emerald-600">{log.newScore}</span>
                      </span>
                    ) : (
                      <span className="text-secondary font-bold">{log.field}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
