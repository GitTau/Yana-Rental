
import React, { useState, useEffect } from 'react';
import { useYanaData } from './hooks/useYanaData';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Vehicles from './views/Vehicles';
import Bookings from './views/Bookings';
import Batteries from './views/Batteries';
import Customers from './views/Customers';
import Maintenance from './views/Maintenance';
import Logs from './views/Logs';
import AdminStoreManagement from './views/AdminStoreManagement';
import OperatorPortal from './views/OperatorPortal';
import RiderPortal from './views/RiderPortal';
import Financials from './views/Financials';
import AdminBookings from './views/AdminBookings';
import { UserRole } from './types';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentView, setCurrentView] = useState('dashboard');
  const yana = useYanaData();

  // Auto-route on role change
  useEffect(() => {
    if (currentRole === UserRole.OPERATOR) {
      setCurrentView('operator-portal');
    } else if (currentRole === UserRole.RIDER) {
      setCurrentView('rider-portal');
    } else if (currentRole === UserRole.ADMIN) {
      if (['operator-portal', 'rider-portal'].includes(currentView)) {
        setCurrentView('dashboard');
      }
    }
  }, [currentRole, currentView]);

  const renderView = () => {
    if (currentRole === UserRole.OPERATOR) {
      return (
        <OperatorPortal 
          state={yana.state}
          // Fix: Added missing userRole prop required by OperatorPortalProps
          userRole={currentRole}
          onStart={yana.startBooking}
          onPause={yana.pauseBooking}
          onComplete={yana.completeBooking}
          onCreateBooking={yana.createBooking}
          onOnboardCustomer={yana.createCustomer}
          onRecordPayment={yana.recordPayment}
          onMarkSettled={yana.markBookingAsSettled}
          onSwapVehicle={yana.swapVehicle}
          onSwapBattery={yana.swapBattery}
        />
      );
    }

    if (currentRole === UserRole.RIDER) {
      return (
        <RiderPortal 
          state={yana.state}
          onBook={(custId, vehId, plan, startDateTs) => {
            yana.createBooking(custId, vehId, 'WAITING_FOR_BATTERY', plan, startDateTs);
          }}
          onOnboard={yana.createCustomer}
        />
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard state={yana.state} />;
      case 'fleet': return (
        <Vehicles 
          state={yana.state} 
          onUpdateStatus={yana.updateVehicleStatus} 
          onAssignBattery={yana.assignBattery} 
        />
      );
      case 'booking-history': return (
        <AdminBookings 
          state={yana.state}
          onUpdateBooking={yana.updateBooking}
        />
      );
      case 'batteries': return <Batteries state={yana.state} />;
      case 'financials': return (
        <Financials 
          state={yana.state}
          onRecordPayment={yana.recordPayment}
          onMarkSettled={yana.markBookingAsSettled}
        />
      );
      case 'customers': return <Customers state={yana.state} onCreate={yana.createCustomer} />;
      case 'maintenance': return (
        <Maintenance 
          state={yana.state} 
          onCreateJob={yana.createMaintenanceJob} 
          onCloseJob={yana.closeMaintenanceJob} 
        />
      );
      case 'logs': return <Logs state={yana.state} />;
      case 'admin': return (
        <AdminStoreManagement 
          state={yana.state} 
          onCreate={yana.createStore} 
          onUpdateStore={yana.updateStore}
          onDeleteStore={yana.deleteStore}
          onUpdateRates={yana.updateRentalRates}
          onMigrate={yana.migrateAsset}
          onBulkStores={yana.bulkCreateStores}
          onBulkVehicles={yana.bulkCreateVehicles}
          onBulkBatteries={yana.bulkCreateBatteries}
          onBulkCustomers={yana.bulkCreateCustomers}
          onUpdateVehicle={yana.updateVehicle}
          onUpdateBattery={yana.updateBattery}
        />
      );
      default: return <Dashboard state={yana.state} />;
    }
  };

  return (
    <Layout 
      stores={yana.state.stores}
      activeStoreId={yana.state.activeStoreId}
      onStoreSwitch={yana.switchStore}
      onReset={yana.resetData}
      currentView={currentView}
      setCurrentView={setCurrentView}
      currentRole={currentRole}
      setCurrentRole={setCurrentRole}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
