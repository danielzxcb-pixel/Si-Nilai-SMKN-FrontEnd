import React, { createContext, useContext, useState, useEffect } from 'react';
import { realtime, REALTIME_EVENTS } from '../services/realtime';

export interface SiteContentItem {
  id: number;
  content_key: string;
  page_group: string;
  content_value: string;
  updated_by: number;
  updated_by_name: string;
  updated_at: string;
}

interface SiteContentContextType {
  content: Record<string, string>;
  items: SiteContentItem[];
  loading: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  getContent: (key: string, defaultText: string, replacements?: Record<string, string>) => string;
  updateBulk: (updatedItems: Record<string, string>) => Promise<void>;
  refetchContent: () => Promise<void>;
}

const DEFAULT_CONTENT_MAP: Record<string, string> = {
  'login.title': 'Portal Masuk SiNilai SMK',
  'login.subtitle': 'Silakan masuk dengan akun terdaftar Anda',
  'dashboard_guru.welcome': 'Selamat datang, {nama_guru}',
  'dashboard_guru.deadline_label': 'Batas Waktu Pengumpulan Nilai',
  'dashboard_waka.tracker_title': 'Status Pengumpulan Nilai Rapor',
  'dashboard_kepsek.header_title': 'Dashboard Akademik SMK',
  'dashboard_admin.header_title': 'Panel Kontrol Administrator',
  'global.footer_note': 'SMKN 1 Tanjungpandan',
  'global.app_title': 'SiNilai SMK',
};

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('sinilai_site_content');
    return saved ? JSON.parse(saved) : DEFAULT_CONTENT_MAP;
  });

  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>('Administrator');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  const refetchContent = async () => {
    try {
      const token = localStorage.getItem('sinilai_jwt_token') || '';
      const res = await fetch('http://127.0.0.1:8000/api/site-content', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
          localStorage.setItem('sinilai_site_content', JSON.stringify(data.content));
        }
        if (data.items) {
          setItems(data.items);
        }
        if (data.last_updated_by) setLastUpdatedBy(data.last_updated_by);
        if (data.last_updated_at) setLastUpdatedAt(data.last_updated_at);
      }
    } catch {
      // Ignore network errors, use cached localStorage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchContent();

    // Subscribe to realtime update event for automatic instant propagation across sessions
    const unsub = realtime.subscribe('SITE_CONTENT_UPDATED', () => {
      refetchContent();
    });

    return () => {
      unsub();
    };
  }, []);

  const getContent = (key: string, defaultText: string, replacements?: Record<string, string>): string => {
    let rawText = content[key] !== undefined ? content[key] : defaultText;
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, val]) => {
        rawText = rawText.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), val);
      });
    }
    return rawText;
  };

  const updateBulk = async (updatedItems: Record<string, string>) => {
    const token = localStorage.getItem('sinilai_jwt_token') || '';
    const res = await fetch('http://127.0.0.1:8000/api/site-content/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: updatedItems }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal memperbarui konten website');
    }

    if (data.content) {
      setContent(data.content);
      localStorage.setItem('sinilai_site_content', JSON.stringify(data.content));
    }
    if (data.last_updated_by) setLastUpdatedBy(data.last_updated_by);
    if (data.last_updated_at) setLastUpdatedAt(data.last_updated_at);

    // Broadcast event to all connected clients
    realtime.publish('SITE_CONTENT_UPDATED', { timestamp: Date.now() });

    await refetchContent();
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        items,
        loading,
        lastUpdatedBy,
        lastUpdatedAt,
        getContent,
        updateBulk,
        refetchContent,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
};
