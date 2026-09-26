import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { currentUser, realtimeAlert, clearRealtimeAlert } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', icon: 'shield_person', bg: 'bg-primary-container text-white' };
      case 'waka':
        return { label: 'Waka Kurikulum', icon: 'verified_user', bg: 'bg-secondary text-white' };
      case 'kepsek':
        return { label: 'Kepala Sekolah', icon: 'military_tech', bg: 'bg-amber-600 text-white' };
      case 'guru':
      default:
        return { label: 'Guru Mata Pelajaran', icon: 'school', bg: 'bg-emerald-600 text-white' };
    }
  };

  const badge = getRoleBadge(currentUser?.role || 'guru');

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'admin-dashboard':
        return 'Ringkasan Sekolah';
      case 'guru-management':
        return 'Tugas Mengajar Guru';
      case 'kelola-kelas-mapel':
        return 'Data Kelas & Mapel';
      case 'monitoring-rekap':
        return 'Rekap & Pantau Nilai';
      case 'input-nilai':
        return 'Input Nilai Siswa';
      case 'realtime-tracker':
        return 'Progres Pengisian Nilai';
      case 'pkl-assessment':
        return 'Nilai PKL / Magang';
      case 'cetak-rapor':
        return 'Cetak Rapor & Verifikasi';
      case 'audit-log':
        return 'Riwayat Perubahan Nilai';
      case 'import-data':
        return 'Impor Data Dapodik/Excel';
      case 'formula-settings':
        return 'Pengaturan Bobot Rapor';
      case 'site-content':
        return 'Pesan & Teks Sekolah';
      default:
        return tab.replace(/-/g, ' ');
    }
  };

  return (
    <>
      {/* Realtime Alert Banner if teacher permission modified */}
      {realtimeAlert && (
        <div className="fixed top-16 left-64 right-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-2.5 shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[20px] animate-pulse">sync</span>
            <span>{realtimeAlert}</span>
          </div>
          <button
            onClick={clearRealtimeAlert}
            className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high z-30 flex items-center justify-between px-6 shadow-sm">
        {/* Left Side: Context / Academic Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1.5 text-on-surface-variant text-xs">
            <span className="text-primary font-bold">SiNilai SMK</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">
              {getTabLabel(currentTab)}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-surface-container-low border border-surface-container-high px-3 py-1 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-on-surface">
              T.A. 2024/2025 Genap — Kurikulum Merdeka
            </span>
          </div>
        </div>

        {/* Right Side: Dark Mode, Role Badge, Profile */}
        <div className="flex items-center gap-3">
          {/* Role Pill Badge */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs ${badge.bg}`}>
            <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
            <span>{badge.label}</span>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Mini Bar */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-surface-container-high">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-primary/20"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-[150px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  {currentUser.nip ? `NIP. ${currentUser.nip.split(' ')[0]}...` : currentUser.role.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
