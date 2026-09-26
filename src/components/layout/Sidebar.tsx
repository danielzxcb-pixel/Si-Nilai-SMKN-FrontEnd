import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    {
      group: 'Menu Utama',
      items: [
        {
          id: 'admin-dashboard',
          label: 'Ringkasan Sekolah',
          icon: 'dashboard',
          roles: ['admin'],
        },
        {
          id: 'guru-management',
          label: 'Tugas Mengajar Guru',
          icon: 'school',
          roles: ['admin', 'waka', 'kepsek'],
          badge: 'Otomatis',
        },
        {
          id: 'kelola-kelas-mapel',
          label: 'Data Kelas & Mapel',
          icon: 'tune',
          roles: ['admin'],
        },
        {
          id: 'monitoring-rekap',
          label: 'Rekap & Pantau Nilai',
          icon: 'analytics',
          roles: ['admin', 'waka', 'kepsek'],
        },
        {
          id: 'realtime-tracker',
          label: 'Progres Pengisian Nilai',
          icon: 'track_changes',
          roles: ['admin', 'waka', 'kepsek'],
          badge: 'Live',
        },
      ],
    },
    {
      group: 'Portal Guru',
      items: [
        {
          id: 'input-nilai',
          label: 'Input Nilai Siswa',
          icon: 'edit_square',
          roles: ['guru', 'admin'],
        },
        {
          id: 'pkl-assessment',
          label: 'Nilai PKL / Magang',
          icon: 'work_outline',
          roles: ['guru', 'admin', 'waka'],
        },
      ],
    },
    {
      group: 'Rapor & Dokumen',
      items: [
        {
          id: 'cetak-rapor',
          label: 'Cetak Rapor & Verifikasi',
          icon: 'verified',
          roles: ['admin', 'waka', 'kepsek'],
        },
        {
          id: 'audit-log',
          label: 'Riwayat Perubahan Nilai',
          icon: 'history_edu',
          roles: ['admin', 'waka', 'kepsek'],
        },
        {
          id: 'import-data',
          label: 'Impor Data Dapodik/Excel',
          icon: 'cloud_upload',
          roles: ['admin'],
        },
        {
          id: 'formula-settings',
          label: 'Pengaturan Bobot Rapor',
          icon: 'tune',
          roles: ['admin', 'kepsek'],
          badge: 'Bobot Nilai',
        },
        {
          id: 'site-content',
          label: 'Pesan & Teks Sekolah',
          icon: 'edit_note',
          roles: ['admin'],
          badge: 'Pengumuman',
        },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest z-40 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high overflow-y-auto">
      <div className="flex flex-col">
        {/* App Logo & School Name */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-container-high bg-surface-container-lowest">
          <img
            alt="SiNilai SMK Emblem Logo"
            className="h-9 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-headline font-bold text-lg text-primary leading-tight truncate">
              SiNilai SMK
            </span>
            <span className="text-[11px] font-medium text-on-surface-variant leading-none truncate">
              SMKN 1 Tanjungpandan
            </span>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navItems.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (!currentUser) return false;
              if (item.id === 'cetak-rapor') {
                return (
                  ['admin', 'waka', 'kepsek'].includes(currentUser.role) ||
                  Boolean(currentUser.canPrintRapor)
                );
              }
              return item.roles.includes(currentUser.role);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="flex flex-col mb-3">
                <span className="px-3 pt-2 pb-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
                  {group.group}
                </span>

                {visibleItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                        isActive
                          ? 'bg-primary-container text-white shadow-sm font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-outline'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-primary-fixed text-primary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-surface-container-high bg-surface-container-lowest">
        <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant">Sistem Penilaian Rapor</span>
            <span className="text-xs font-semibold text-primary">v2.4.0 (Kurikulum Merdeka)</span>
          </div>
          <button
            onClick={logout}
            className="text-error hover:bg-error-container hover:text-on-error-container p-1.5 rounded transition-colors"
            title="Keluar / Ganti Akun"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
