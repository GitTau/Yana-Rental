
import React, { useState } from 'react';
import { Battery as BatteryIcon, Search, Truck, Zap, Globe, MoreVertical } from 'lucide-react';
import { YanaState, Battery, BatteryStatus } from '../types';
import { Card, Badge } from '../components/Common';

const Batteries: React.FC<{ state: YanaState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isGlobal = state.activeStoreId === 'all';

  const filteredBatteries = state.batteries.filter(b => 
    (isGlobal || b.storeId === state.activeStoreId) && 
    (b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusVariant = (s: BatteryStatus) => {
    switch (s) {
      case BatteryStatus.AVAILABLE: return 'success';
      case BatteryStatus.IN_USE: return 'info';
      case BatteryStatus.MAINTENANCE: return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isGlobal && <Globe size={20} className="text-blue-500" />}
            Battery Inventory
          </h2>
          <p className="text-gray-500">
            {isGlobal ? 'Global power asset tracking across all stations.' : 'Track charging assets at current location.'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by serial..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none w-full md:w-64 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serial Number</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              {isGlobal && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zap Point</th>}
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Assignment</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredBatteries.map(battery => (
              <tr key={battery.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-none">{battery.serialNumber}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase">ID: {battery.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusVariant(battery.status)}>{battery.status}</Badge>
                </td>
                {isGlobal && (
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-gray-600">
                      {state.stores.find(s => s.id === battery.storeId)?.name}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  {battery.assignedVehicleId ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Truck size={14} />
                      <span className="font-bold text-xs">
                        {state.vehicles.find(v => v.id === battery.assignedVehicleId)?.plateNumber}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Available on Shelf</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBatteries.length === 0 && (
              <tr>
                <td colSpan={isGlobal ? 5 : 4} className="px-6 py-12 text-center text-gray-400 italic">
                  No power assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Batteries;
