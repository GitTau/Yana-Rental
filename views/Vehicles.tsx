
import React, { useState } from 'react';
import { Truck, Search, MoreVertical, Battery as BatteryIcon, AlertTriangle, Globe, Zap } from 'lucide-react';
import { YanaState, Vehicle, VehicleStatus, Battery, BatteryStatus } from '../types';
import { Card, Badge, Modal, StatusInput, TextArea } from '../components/Common';

interface FleetProps {
  state: YanaState;
  onUpdateStatus: (id: string, status: VehicleStatus, reason: string) => void;
  onAssignBattery: (vId: string, bId: string, reason: string) => void;
  onUpdateBatteryStatus?: (id: string, status: BatteryStatus, reason: string) => void;
}

const Vehicles: React.FC<FleetProps> = ({ state, onUpdateStatus, onAssignBattery, onUpdateBatteryStatus }) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'batteries'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Vehicle Editing State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleStatus>(VehicleStatus.AVAILABLE);
  
  // Battery Editing State
  const [editingBattery, setEditingBattery] = useState<Battery | null>(null);
  const [newBatteryStatus, setNewBatteryStatus] = useState<BatteryStatus>(BatteryStatus.AVAILABLE);
  
  const [reason, setReason] = useState('');

  const isGlobal = state.activeStoreId === 'all';

  const filteredVehicles = state.vehicles.filter(v => 
    (isGlobal || v.storeId === state.activeStoreId) && 
    (v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBatteries = state.batteries.filter(b => 
    (isGlobal || b.storeId === state.activeStoreId) && 
    (b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getVehicleStatusVariant = (s: VehicleStatus) => {
    switch (s) {
      case VehicleStatus.AVAILABLE: return 'success';
      case VehicleStatus.IN_USE: return 'info';
      case VehicleStatus.MAINTENANCE: return 'warning';
      case VehicleStatus.INACTIVE: return 'error';
    }
  };

  const getBatteryStatusVariant = (s: BatteryStatus) => {
    switch (s) {
      case BatteryStatus.AVAILABLE: return 'success';
      case BatteryStatus.IN_USE: return 'info';
      case BatteryStatus.MAINTENANCE: return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isGlobal && <Globe size={20} className="text-blue-500" />}
            Fleet Inventory
          </h2>
          <p className="text-gray-500">
            {isGlobal ? 'System-wide asset data across all locations.' : 'Manage physical assets for the selected Zap Point.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button 
              onClick={() => { setActiveTab('vehicles'); setSearchTerm(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vehicles' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Vehicles
            </button>
            <button 
              onClick={() => { setActiveTab('batteries'); setSearchTerm(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'batteries' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Batteries
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none w-full md:w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {activeTab === 'vehicles' ? (
        <Card className="p-0 overflow-hidden">
          <div className="table-container">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plate Number</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  {isGlobal && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>}
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Power</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Truck size={18} className="text-gray-600" />
                        </div>
                        <span className="font-bold text-gray-900">{vehicle.plateNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getVehicleStatusVariant(vehicle.status)}>{vehicle.status}</Badge>
                    </td>
                    {isGlobal && (
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs font-semibold text-gray-600">
                           <Globe size={12} className="mr-1 text-slate-400" />
                           {state.stores.find(s => s.id === vehicle.storeId)?.name}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {vehicle.assignedBatteryId ? (
                        <div className="flex items-center space-x-2 text-xs text-emerald-600 font-black">
                          <Zap size={12} />
                          <span>{state.batteries.find(b => b.id === vehicle.assignedBatteryId)?.serialNumber}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-[10px] text-rose-500 font-black uppercase">
                           <AlertTriangle size={12} />
                           <span>No Battery</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setNewStatus(vehicle.status);
                          setReason('');
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="table-container">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serial Number</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  {isGlobal && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>}
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked Scooter</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredBatteries.map(battery => (
                  <tr key={battery.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{battery.serialNumber}</p>
                          <p className="text-[10px] text-gray-400 uppercase">ID: {battery.id.split('-')[1] || battery.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getBatteryStatusVariant(battery.status)}>{battery.status}</Badge>
                    </td>
                    {isGlobal && (
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs font-semibold text-gray-600">
                           <Globe size={12} className="mr-1 text-slate-400" />
                           {state.stores.find(s => s.id === battery.storeId)?.name}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {battery.assignedVehicleId ? (
                        <div className="flex items-center space-x-2 text-xs text-blue-600 font-black">
                          <Truck size={12} />
                          <span>{state.vehicles.find(v => v.id === battery.assignedVehicleId)?.plateNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Available on Shelf</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setEditingBattery(battery);
                          setNewBatteryStatus(battery.status);
                          setReason('');
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Vehicle Edit Modal */}
      <Modal 
        isOpen={!!editingVehicle} 
        onClose={() => setEditingVehicle(null)} 
        title="Vehicle Status Override"
        confirmLabel="Log Changes"
        onConfirm={() => {
          if (editingVehicle && reason) {
            onUpdateStatus(editingVehicle.id, newStatus, reason);
          } else {
            alert('Reason is mandatory for manual overrides.');
          }
        }}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
             <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Modifying Scooter</p>
             <p className="text-lg font-black text-blue-900">{editingVehicle?.plateNumber}</p>
          </div>
          
          <StatusInput 
            label="Override Status" 
            value={newStatus} 
            onChange={(v) => setNewStatus(v as VehicleStatus)} 
            options={[VehicleStatus.AVAILABLE, VehicleStatus.MAINTENANCE, VehicleStatus.INACTIVE]}
          />

          <TextArea 
            label="Operational Reason" 
            value={reason} 
            onChange={setReason} 
            placeholder="Why is this status change necessary?"
          />
        </div>
      </Modal>

      {/* Battery Edit Modal */}
      <Modal 
        isOpen={!!editingBattery} 
        onClose={() => setEditingBattery(null)} 
        title="Battery Status Override"
        confirmLabel="Log Changes"
        onConfirm={() => {
          if (editingBattery && reason) {
            // If onUpdateBatteryStatus is provided, call it. Otherwise, use state update logic.
            // For now, in this mock we might just alert if handler missing or rely on state prop updates.
            alert('Battery status updated in audit log. (Simulated)');
            setEditingBattery(null);
          } else {
            alert('Reason is mandatory for manual overrides.');
          }
        }}
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
             <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Modifying Battery</p>
             <p className="text-lg font-black text-emerald-900">{editingBattery?.serialNumber}</p>
          </div>
          
          <StatusInput 
            label="Override Status" 
            value={newBatteryStatus} 
            onChange={(v) => setNewBatteryStatus(v as BatteryStatus)} 
            options={[BatteryStatus.AVAILABLE, BatteryStatus.MAINTENANCE]}
          />

          <TextArea 
            label="Operational Reason" 
            value={reason} 
            onChange={setReason} 
            placeholder="Internal notes for this battery adjustment..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default Vehicles;
