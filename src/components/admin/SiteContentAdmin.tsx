import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSiteContent, SiteContentItem } from '../../context/SiteContentContext';

export const SiteContentAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const { items, updateBulk, lastUpdatedBy, lastUpdatedAt, refetchContent } = useSiteContent();

  const [activeGroup, setActiveGroup] = useState<string>('global');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAuthorized = currentUser?.role === 'admin';

  useEffect(() => {
    refetchContent();
  }, []);

  useEffect(() => {
    const initialMap: Record<string, string> = {};
    items.forEach((item) => {
      initialMap[item.content_key] = item.content_value;
    });
    setFormData(initialMap);
  }, [items]);

  const groups = [
    { id: 'global', label: '🌐 Global & Header' },
    { id: 'login', label: '🔑 Halaman Login' },
    { id: 'dashboard_guru', label: '👨‍🏫 Dashboard Guru' },
    { id: 'dashboard_waka', label: '📊 Dashboard Waka' },
    { id: 'dashboard_kepsek', label: '🏛️ Dashboard Kepsek' },
    { id: 'dashboard_admin', label: '⚙️ Dashboard Admin' },
  ];

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setToast(null);

    try {
      await updateBulk(formData);
      setToast({ type: 'success', text: 'Seluruh perubahan teks website berhasil disimpan dan dipublikasikan!' });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Terjadi kesalahan saat menyimpan teks website.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-900 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-red-600 block mb-2">lock_person</span>
          <h3 className="text-lg font-bold">Akses Dibatasi</h3>
          <p className="text-xs text-red-700 mt-1">
            Halaman **Kelola Konten Website** hanya dapat diakses oleh **Administrator**.
          </p>
        </div>
      </div>
    );
  }

  const filteredItems = items.filter((item) => item.page_group === activeGroup);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined text-[28px]">edit_note</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Pesan & Teks Sekolah (SMKN 1 Tanjungpandan)</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Sesuaikan teks pengumuman, salam pembuka, dan informasi sekolah yang tampil pada seluruh portal SiNilai.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
        </button>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-container-high pb-3">
        {groups.map((group) => {
          const count = items.filter((i) => i.page_group === group.id).length;
          const isActive = activeGroup === group.id;

          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high border border-surface-container-high'
              }`}
            >
              <span>{group.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-outline'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Fields Container */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">
            Daftar Teks ({groups.find((g) => g.id === activeGroup)?.label})
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Format variabel seperti <code className="bg-surface-container px-1 py-0.5 rounded text-primary">{'{nama_guru}'}</code> akan diisi otomatis oleh sistem.
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-outline">
            Belum ada kunci teks untuk grup ini.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const val = formData[item.content_key] !== undefined ? formData[item.content_key] : item.content_value;
              const isLongText = val.length > 60 || val.includes('\n');

              return (
                <div
                  key={item.id}
                  className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {item.content_key}
                    </span>
                    <span className="text-[10px] text-outline">
                      ID: #{item.id}
                    </span>
                  </div>

                  {isLongText ? (
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) => handleInputChange(item.content_key, e.target.value)}
                      className="w-full bg-surface-container-lowest p-3 rounded-xl text-xs font-semibold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleInputChange(item.content_key, e.target.value)}
                      className="w-full bg-surface-container-lowest px-3 py-2 rounded-xl text-xs font-semibold text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toast.text}</span>
          </div>
        )}

        {/* Audit Trail */}
        <div className="pt-2 text-[11px] text-outline flex items-center justify-between border-t border-surface-container-high/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>
              Terakhir diubah oleh <strong>{lastUpdatedBy}</strong> pada {lastUpdatedAt || '—'}
            </span>
          </span>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
