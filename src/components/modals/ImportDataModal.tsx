import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import * as XLSX from 'xlsx';

export const ImportDataModal: React.FC = () => {
  const { students, importStudentsBatch, classes } = useSchool();
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Upload and Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        // Map parsed rows to student structure
        const mapped = data.map((row, i) => {
          const nisn = String(row['NISN'] || row['nisn'] || `006${Date.now()}${i}`).trim();
          const fullName = String(row['Nama'] || row['Nama Siswa'] || row['fullName'] || 'Siswa Baru').trim();
          const nis = String(row['NIS'] || `2425${1000 + i}`).trim();
          const gender = String(row['JK'] || row['gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
          const className = String(row['Kelas'] || row['className'] || '10 RPL 1').trim();
          
          const matchedClass = classes.find((c) => c.name.toLowerCase() === className.toLowerCase()) || classes[0];

          // Check if existing
          const existing = students.some((s) => s.nisn === nisn);

          return {
            nisn,
            nis,
            fullName,
            gender,
            classId: matchedClass.id,
            className: matchedClass.name,
            absenNumber: i + 1,
            isExisting: existing,
          };
        });

        setPreviewData(mapped);
      } catch (err) {
        console.error('Error parsing excel:', err);
        setToastMessage('⚠️ Gagal membaca berkas Excel. Pastikan format kolom sesuai.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitImport = () => {
    if (previewData.length === 0) return;

    // Filter only new records
    const newOnly = previewData.filter((p) => !p.isExisting);
    if (newOnly.length > 0) {
      importStudentsBatch(
        newOnly.map((n) => ({
          nisn: n.nisn,
          nis: n.nis,
          fullName: n.fullName,
          gender: n.gender,
          classId: n.classId,
          className: n.className,
          absenNumber: n.absenNumber,
        }))
      );
      setToastMessage(`🎉 Berhasil mengimpor ${newOnly.length} data siswa baru ke database!`);
    } else {
      setToastMessage('Semua data dalam berkas sudah ada di sistem (tidak ada duplikasi).');
    }

    setPreviewData([]);
    setFileName(null);
    setTimeout(() => setToastMessage(null), 4000);
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
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
          <span>Sinkronisasi Data Massal</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Admin Portal</span>
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          Import Data Peserta Didik & Integrasi Dapodik
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Unggah berkas Excel/CSV siswa dengan preview komparasi diff sebelum commit data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Upload Box */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-card border border-surface-container-high space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Unggah Berkas Spreadsheet (Excel / CSV)</h3>
            <span className="text-[11px] text-primary font-semibold">Format: .xlsx / .csv</span>
          </div>

          <div className="border-2 border-dashed border-surface-container-high hover:border-primary rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low/40 transition-colors">
            <span className="material-symbols-outlined text-[42px] text-primary mb-2">
              cloud_upload
            </span>
            <p className="text-sm font-bold text-on-surface">
              {fileName ? fileName : 'Pilih atau Tarik Berkas Excel ke Sini'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Kolom wajib: NISN, NIS, Nama Siswa, JK (L/P), Kelas (Contoh: 10 RPL 1)
            </p>

            <label className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all active:scale-95">
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span>Pilih Berkas Dari Komputer</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview / Diff Table */}
          {previewData.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-surface-container-high animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">
                    Pratinjau Diff ({previewData.length} Baris Ditemukan)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {previewData.filter((p) => !p.isExisting).length} Data Baru
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {previewData.filter((p) => p.isExisting).length} Sudah Ada (Dilewati)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCommitImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Commit & Simpan Siswa Baru
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-surface-container-high">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-surface-container-low text-outline text-[11px] font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">JK</th>
                      <th className="p-2.5">Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className={row.isExisting ? 'bg-slate-50 opacity-60' : 'bg-emerald-50/40'}>
                        <td className="p-2.5 font-bold">
                          {row.isExisting ? (
                            <span className="text-slate-500 text-[11px]">Duplikat</span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">Baru ✨</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono">{row.nisn}</td>
                        <td className="p-2.5 font-semibold">{row.fullName}</td>
                        <td className="p-2.5">{row.gender}</td>
                        <td className="p-2.5">{row.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Inactive DAPODIK Web Service Placeholder */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-card border border-surface-container-high space-y-4 opacity-85">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[22px]">dns</span>
              <h3 className="text-sm font-bold text-on-surface">DAPODIK Web Service</h3>
            </div>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300">
              Belum Terhubung
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Integrasi langsung dengan server Pusat Data dan Teknologi Informasi (Pusdatin) Kemdikbudristek via REST Web Service Dapodik Lokal.
          </p>

          <div className="space-y-3 pointer-events-none opacity-60">
            <div>
              <label className="text-[11px] font-bold text-outline">Dapodik Host URL:</label>
              <input
                type="text"
                disabled
                value="http://192.168.1.100:5774/WebService/"
                className="w-full text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">Token Pengguna (Bearer Token):</label>
              <input
                type="password"
                disabled
                value="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">NPSN Sekolah:</label>
              <input
                type="text"
                disabled
                value="10400871 (SMKN 1 Tanjungpandan)"
                className="w-full text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high mt-1 text-slate-500 font-semibold"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
            <span>
              Bagian ini siap disambungkan segera setelah admin Dapodik sekolah mengaktifkan modul Web Service pada server Dapodik lokal SMKN 1 Tanjungpandan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
