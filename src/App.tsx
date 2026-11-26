import { useEffect, useState } from 'react';
import { AddUserAccountView } from './components/AddUserAccountView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssetFormModal } from './components/AssetFormModal';
import { AttendanceView } from './components/AttendanceView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InventoryView } from './components/InventoryView';
import { LoansView } from './components/LoansView';
import { LoginView } from './components/LoginView';
import { MaintenanceView } from './components/MaintenanceView';
import { ReportsView } from './components/ReportsView';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleView } from './components/ScheduleView';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { UsersProfileView } from './components/UsersProfileView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSipalakData } from './hooks/useSipalakData';
import type { Asset, NavSection } from './types/sipalak';

function SipalakWorkspace() {
  const { user, profile, isAdmin, authReady } = useAuth();
  const {
    assets,
    loans,
    schedules,
    maintenances,
    attendances,
    usersList,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    seedSampleAssets,
    addLoan,
    updateLoanStatus,
    deleteLoan,
    addSchedule,
    updateScheduleStatus,
    deleteSchedule,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    addAttendance,
    checkOutAttendance,
    deleteAttendance,
    createUserAccount,
    updateUserByAdmin,
    deleteUserAccount,
  } = useSipalakData();

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [usersTab, setUsersTab] = useState<'profil' | 'direktori'>('profil');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Support QR code deep link (?aset=LAB-PRN-001)
  useEffect(() => {
    if (!assets.length) return;
    const params = new URLSearchParams(window.location.search);
    const asetCode = params.get('aset');
    if (asetCode) {
      const found = assets.find((a) => a.code === asetCode);
      if (found) {
        setActiveNav('inventaris');
        setDetailAsset(found);
      }
    }
  }, [assets]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0D1C36] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl px-6 py-5 text-sm font-medium text-slate-700 shadow-xl">
          Memuat SIPALAK...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginView />;
  }

  const openAddAsset = () => {
    setEditingAsset(null);
    setAssetModalOpen(true);
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6FA] text-slate-900">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isAdmin={isAdmin}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          activeNav={activeNav}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateProfile={() => {
            setUsersTab('profil');
            setActiveNav('pengguna');
          }}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              assets={assets}
              loans={loans}
              schedules={schedules}
              loading={loading}
              onNavigate={setActiveNav}
              onOpenAddAsset={openAddAsset}
              onOpenAddSchedule={() => setScheduleModalOpen(true)}
              onSeedSampleAssets={seedSampleAssets}
            />
          )}

          {activeNav === 'inventaris' && (
            <InventoryView
              assets={assets}
              loading={loading}
              onOpenAdd={openAddAsset}
              onOpenEdit={openEditAsset}
              onOpenDetail={(a) => setDetailAsset(a)}
              onDelete={deleteAsset}
              onSeedSampleAssets={seedSampleAssets}
            />
          )}

          {activeNav === 'peminjaman' && (
            <LoansView
              assets={assets}
              loans={loans}
              loading={loading}
              onAddLoan={addLoan}
              onUpdateLoanStatus={updateLoanStatus}
              onDeleteLoan={deleteLoan}
            />
          )}

          {activeNav === 'jadwal' && (
            <ScheduleView
              schedules={schedules}
              loading={loading}
              onOpenAdd={() => setScheduleModalOpen(true)}
              onUpdateStatus={updateScheduleStatus}
              onDelete={deleteSchedule}
            />
          )}

          {activeNav === 'maintenance' && (
            <MaintenanceView
              assets={assets}
              maintenances={maintenances}
              loading={loading}
              onAddMaintenance={addMaintenance}
              onUpdateMaintenance={updateMaintenance}
              onDeleteMaintenance={deleteMaintenance}
            />
          )}

          {activeNav === 'pengguna' && (
            <UsersProfileView
              activeTab={usersTab}
              onChangeTab={setUsersTab}
              usersList={usersList}
              onNavigateAddAccount={() => setActiveNav('tambah-pengguna')}
              onUpdateUserByAdmin={updateUserByAdmin}
              onDeleteUserAccount={deleteUserAccount}
            />
          )}

          {activeNav === 'tambah-pengguna' && isAdmin && (
            <AddUserAccountView
              usersCount={usersList.length}
              onCreateUserAccount={createUserAccount}
              onNavigateUsers={() => {
                setUsersTab('direktori');
                setActiveNav('pengguna');
              }}
            />
          )}

          {activeNav === 'absensi' && (
            <AttendanceView
              attendances={attendances}
              loading={loading}
              onAddAttendance={addAttendance}
              onCheckOut={checkOutAttendance}
              onDelete={deleteAttendance}
            />
          )}

          {activeNav === 'laporan' && (
            <ReportsView
              assets={assets}
              loans={loans}
              schedules={schedules}
              maintenances={maintenances}
              attendances={attendances}
            />
          )}
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400 no-print">
          SIPALAK · Sistem Pelayanan Laboratorium Komputer · SMK Negeri 1 Sambeng
        </footer>
      </div>

      <AssetFormModal
        open={assetModalOpen}
        editingAsset={editingAsset}
        onClose={() => {
          setAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={async (data) => {
          if (editingAsset) {
            await updateAsset(editingAsset.id, data);
          } else {
            await addAsset(data);
          }
        }}
      />

      <AssetDetailModal
        asset={detailAsset}
        onClose={() => setDetailAsset(null)}
        onEdit={isAdmin ? openEditAsset : undefined}
      />

      <ScheduleFormModal
        open={scheduleModalOpen}
        existingSchedules={schedules}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={addSchedule}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SipalakWorkspace />
      </AuthProvider>
    </ErrorBoundary>
  );
}
