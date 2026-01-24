
import React from 'react';
import { History, Shield, Truck, Battery as BatteryIcon, BookOpen, Wrench } from 'lucide-react';
import { YanaState, AuditLog } from '../types';
import { Card, Badge } from '../components/Common';

const Logs: React.FC<{ state: YanaState }> = ({ state }) => {
  const storeLogs = state.logs.filter(l => l.storeId === state.activeStoreId);

  const getLogIcon = (type: AuditLog['type']) => {
    switch (type) {
      case 'VEHICLE': return <Truck size={16} className="text-blue-500" />;
      case 'BATTERY': return <BatteryIcon size={16} className="text-emerald-500" />;
      case 'BOOKING': return <BookOpen size={16} className="text-indigo-500" />;
      case 'MAINTENANCE': return <Wrench size={16} className="text-amber-500" />;
      case 'SYSTEM': return <Shield size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
        <p className="text-gray-500">Chronological history of all store-level operations and manual overrides.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-100 px-6 py-3 flex items-center space-x-2">
           <History size={16} className="text-slate-400" />
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Events</span>
        </div>
        <div className="divide-y divide-gray-100">
           {storeLogs.length > 0 ? (
             storeLogs.map(log => (
               <div key={log.id} className="px-6 py-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{log.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           {new Date(log.timestamp).toLocaleString()}
                        </p>
                     </div>
                     <p className="text-xs text-gray-500 mt-0.5">Reason: <span className="italic font-medium">"{log.reason}"</span></p>
                     <div className="mt-2 flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold uppercase">
                          {log.operatorId.split('-')[1].substring(0, 2)}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operator: {log.operatorId}</span>
                     </div>
                  </div>
               </div>
             ))
           ) : (
             <div className="py-20 text-center text-gray-400 italic text-sm">
               No logs recorded for this store yet.
             </div>
           )}
        </div>
      </Card>
    </div>
  );
};

export default Logs;
