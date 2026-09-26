import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { setAuthenticatedUser } = useAuth();
  
  // Security Hardening: NO pre-filled credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanIdentifier = identifier.trim();

    try {
      const response = await apiClient.login(cleanIdentifier, password);
      if (response && response.token && response.user) {
        // Normalize snake_case to camelCase for full React state compatibility
        const normalizedUser = {
          ...response.user,
          assignedSubjects: response.user.assignedSubjects || response.user.assigned_subjects || [],
          assignedClasses: response.user.assignedClasses || response.user.assigned_classes || [],
        };
        apiClient.setToken(response.token);
        setAuthenticatedUser(normalizedUser, response.token);
        onLoginSuccess();
      } else {
        setError('Email/NIP atau kata sandi tidak valid. Periksa kembali kredensial Anda.');
      }
    } catch (err: any) {
      if (err.status === 429) {
        setError(err.message || 'Terlalu banyak percobaan login gagal. Akun/IP terkunci sementara demi keamanan (15 menit).');
      } else if (!err.status || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('fetch')) {
        setError('Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif atau hubungi administrator sekolah.');
      } else {
        setError(err.data?.message || err.message || 'Email/NIP atau kata sandi tidak valid. Periksa kembali kredensial Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-modal border border-surface-container-high p-8 sm:p-10 z-10 flex flex-col items-center">
        {/* Emblem Logo */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpZ6o2KrkbKXybZ8cIkhA02LSpGOzSFlKIw3CipEuDrqObqM96n2s41f6-eE5v8RSsP5b719kbLOB-6T04n5thTef-An5Mz-25dpf7XHsBVqUZvd5Zi_wm4Ay4yLSCy3fV2_97BphWxxWq5S3u-rCp2FJXecQ8gnagFS_JkvyFeCnR5kFXegfvRQLchiwk3jcYLHnZG4ga-y-l3LyWeCKGSYLOYHRWUBr_kk93hCqrucT-lOVsQ3Z20g"
          alt="SiNilai SMK Emblem"
          className="h-16 w-auto object-contain mb-3"
        />

        <h1 className="text-2xl font-extrabold text-on-surface text-center tracking-tight">
          SiNilai SMK
        </h1>
        <p className="text-xs text-on-surface-variant font-medium text-center mt-0.5 mb-6">
          Sistem Penilaian & Pengelolaan Rapor Vokasi<br />
          <strong className="text-primary font-bold">SMK Negeri 1 Tanjungpandan</strong>
        </p>

        {/* Error message banner */}
        {error && (
          <div className="w-full bg-error-container/40 border border-error/20 text-on-error-container text-xs p-3 rounded-xl mb-4 flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Secure Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface block mb-1">
              Nomor Induk Pegawai (NIP) atau Email Resmi
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">
                badge
              </span>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan NIP atau email sekolah"
                className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-on-surface">Kata Sandi</label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">
                lock
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all active:scale-98 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            <span>{isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal Penilaian'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="w-full mt-6 pt-4 border-t border-surface-container-high text-center">
          <p className="text-[11px] text-outline">
            Akses portal diamankan dengan autentikasi enkripsi JWT dan rate-limiting proteksi brute-force.
          </p>
        </div>
      </div>

      <div className="text-[11px] text-outline text-center mt-6">
        © 2026 SMKN 1 Tanjungpandan • Kurikulum Merdeka Terpadu
      </div>
    </div>
  );
};
