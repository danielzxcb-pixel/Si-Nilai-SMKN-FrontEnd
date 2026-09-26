import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GuruDashboard } from './components/dashboard/GuruDashboard';
import { WakaKepsekDashboard } from './components/dashboard/WakaKepsekDashboard';
import { AdminOverviewDashboard } from './components/dashboard/AdminOverviewDashboard';
import { TeacherManagementView } from './components/admin/TeacherManagementView';
import { ClassSubjectManagementView } from './components/admin/ClassSubjectManagementView';
import { RealtimeTrackerView } from './components/dashboard/RealtimeTrackerView';
import { PrintableRaporModal } from './components/modals/PrintableRaporModal';
import { PklModuleModal } from './components/modals/PklModuleModal';
import { AuditLogModal } from './components/modals/AuditLogModal';
import { ImportDataModal } from './components/modals/ImportDataModal';
import { GradeFormulaSettings } from './components/settings/GradeFormulaSettings';
import { SiteContentAdmin } from './components/admin/SiteContentAdmin';
import { LoginView } from './components/auth/LoginView';

const MainApplication: React.FC = () => {
  const { currentUser } = useAuth();

  // Set default tab based on user's role
  const [currentTab, setCurrentTab] = useState<string>('input-nilai');

  // Whenever user switches or logs in, align default tab
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      setCurrentTab('guru-management');
    } else if (currentUser.role === 'waka' || currentUser.role === 'kepsek') {
      setCurrentTab('monitoring-rekap');
    } else {
      setCurrentTab('input-nilai');
    }
  }, [currentUser]);

  if (!currentUser) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'admin-dashboard':
        return <AdminOverviewDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'guru-management':
        return <TeacherManagementView />;
      case 'kelola-kelas-mapel':
        return <ClassSubjectManagementView />;
      case 'monitoring-rekap':
        return <WakaKepsekDashboard />;
      case 'input-nilai':
        return <GuruDashboard />;
      case 'realtime-tracker':
        return <RealtimeTrackerView />;
      case 'pkl-assessment':
        return <PklModuleModal />;
      case 'cetak-rapor':
        return <PrintableRaporModal />;
      case 'audit-log':
        return <AuditLogModal />;
      case 'import-data':
        return <ImportDataModal />;
      case 'formula-settings':
        return <GradeFormulaSettings />;
      case 'site-content':
        return <SiteContentAdmin />;
      default:
        return <GuruDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Work Area */}
      <div className="pl-64">
        {/* Top Header Context Bar */}
        <Header currentTab={currentTab} />

        {/* Dynamic Page Content */}
        <main className="pt-16 min-h-[calc(100vh-64px)] pb-12">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <SiteContentProvider>
          <MainApplication />
        </SiteContentProvider>
      </SchoolProvider>
    </AuthProvider>
  );
}
