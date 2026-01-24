
import React from 'react';
import { Truck, Battery as BatteryIcon, BookOpen, Wrench, AlertCircle, Globe } from 'lucide-react';
import { YanaState, VehicleStatus, BatteryStatus, BookingStatus } from '../types';
import { Card, Badge } from '../components/Common';

const Dashboard: React.FC<{ state: YanaState }> = ({ state }) => {
  const isGlobal = state.activeStoreId === 'all';
  
  const filteredVehicles = isGlobal ? state.vehicles : state.vehicles.filter(v => v.storeId === state.activeStoreId);
  const filteredBatteries = isGlobal ? state.batteries : state.batteries.filter(b => b.storeId === state.activeStoreId);
  const filteredBookings = isGlobal ? state.bookings : state.bookings.filter(b => b.storeId === state.activeStoreId);
  
  const availableVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
  const inUseVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.IN_USE).length;
  const maintenanceVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;

  const availableBatteries = filteredBatteries.filter(b => b.status === BatteryStatus.AVAILABLE).length;
  const activeBookings = filteredBookings.filter(b => b.status === BookingStatus.ACTIVE).length;

  const alerts = [];
  if (availableVehicles === 0) alerts.push(isGlobal ? "System-wide inventory depletion!" : "No vehicles available for booking.");
  if (availableBatteries < (isGlobal ? 10 : 3)) alerts.push(isGlobal ? "Global spare battery stock critically low." : "Low available battery stock.");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            {isGlobal && <Globe className="text-blue-500" />}
            {isGlobal ? 'Global Dashboard' : 'Store Overview'}
          </h2>
          <p className="text-gray-500">
            {isGlobal ? 'Aggregate metrics for all YANA Zap Points.' : 'Real-time metrics for current Zap Point operations.'}
          </p>
        </div>
        {isGlobal && (
          <Badge variant="info">Total Network Stats</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Truck className="text-blue-600" />} label="Total Available" value={availableVehicles} color="blue" />
        <StatCard icon={<BatteryIcon className="text-emerald-600" />} label="Ready Batteries" value={availableBatteries} color="emerald" />
        <StatCard icon={<BookOpen className="text-indigo-600" />} label="Ongoing Rides" value={activeBookings} color="indigo" />
        <StatCard icon={<Wrench className="text-amber-600" />} label="In Repair" value={maintenanceVehicles} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Operational Alerts" className="lg:col-span-1">
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-amber-800">{alert}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
               <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                 <AlertCircle size={24} />
               </div>
               <p className="text-sm font-medium">All zap points operating normally</p>
            </div>
          )}
        </Card>

        <Card title="Total Asset Mix" subtitle="System-wide status distribution" className="lg:col-span-1">
           <div className="space-y-4">
              <UsageRow label="Available" count={availableVehicles} total={filteredVehicles.length} color="bg-emerald-500" />
              <UsageRow label="In Use" count={inUseVehicles} total={filteredVehicles.length} color="bg-blue-500" />
              <UsageRow label="Maintenance" count={maintenanceVehicles} total={filteredVehicles.length} color="bg-amber-500" />
              <UsageRow label="Offline" count={filteredVehicles.length - availableVehicles - inUseVehicles - maintenanceVehicles} total={filteredVehicles.length} color="bg-gray-300" />
           </div>
        </Card>

        <Card title="Global Audit Stream" className="lg:col-span-1">
          <div className="space-y-6">
            {state.logs.filter(l => isGlobal || l.storeId === state.activeStoreId).slice(0, 5).map(log => (
              <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-gray-100 last:border-0 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  {isGlobal && <span className="text-[8px] bg-slate-100 px-1 rounded font-bold text-slate-500">{state.stores.find(s => s.id === log.storeId)?.name.split(' ')[0]}</span>}
                </div>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{log.message}</p>
                <p className="text-xs text-gray-500 italic mt-0.5">"{log.reason}"</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const UsageRow = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">{count} / {total}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default Dashboard;
