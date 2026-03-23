import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  MoreVertical, 
  User, 
  Truck, 
  Calendar, 
  ChevronRight, 
  Zap, 
  Filter,
  Globe,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  FileText,
  Tag
} from 'lucide-react';
import { YanaState, Booking, BookingStatus, RentalPlan } from '../types';
import { Card, Badge, Modal, TextArea, StatusInput } from '../components/Common';

interface AdminBookingsProps {
  state: YanaState;
  onUpdateBooking: (id: string, updates: Partial<Booking>, reason: string) => void;
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ state, onUpdateBooking }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<BookingStatus>(BookingStatus.PENDING);
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');

  const isGlobal = state.activeStoreId === 'all';

  const filteredBookings = useMemo(() => {
    return state.bookings.filter(b => {
      const matchStore = isGlobal || b.storeId === state.activeStoreId;
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const customer = state.customers.find(c => c.id === b.customerId);
      const matchSearch = 
        customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.phone.includes(searchTerm) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchStore && matchStatus && matchSearch;
    });
  }, [state.bookings, state.customers, searchTerm, statusFilter, state.activeStoreId, isGlobal]);

  const selectedBooking = useMemo(() => 
    state.bookings.find(b => b.id === selectedBookingId), 
    [selectedBookingId, state.bookings]
  );

  const getStatusVariant = (s: BookingStatus, isSettled?: boolean) => {
    if (s === BookingStatus.COMPLETED && !isSettled) return 'warning';
    switch (s) {
      case BookingStatus.ACTIVE: return 'success';
      case BookingStatus.PAUSED: return 'warning';
      case BookingStatus.COMPLETED: return 'info';
      case BookingStatus.PENDING: return 'neutral';
      case BookingStatus.CANCELLED: return 'error';
    }
  };

  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleString() : 'N/A';

  const handleOpenEdit = () => {
    if (selectedBooking) {
      setEditStatus(selectedBooking.status);
      setEditNotes(selectedBooking.notes || '');
      setEditReason('');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedBookingId || !editReason) {
      alert('A reason for manual adjustment is required.');
      return;
    }
    onUpdateBooking(selectedBookingId, { status: editStatus, notes: editNotes }, editReason);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Master Registry
          </h2>
          <p className="text-gray-500 text-sm">Comprehensive booking archive and compliance tracking.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <div className="relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search riders, phone, ID..." 
               className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <select 
             className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value as any)}
           >
             <option value="ALL">All Statuses</option>
             {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rider & ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifecycle</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assets</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timestamps</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredBookings.map(booking => {
                const customer = state.customers.find(c => c.id === booking.customerId);
                const vehicle = state.vehicles.find(v => v.id === booking.vehicleId);
                const isPendingSettlement = booking.status === BookingStatus.COMPLETED && !booking.isSettled;
                return (
                  <tr 
                    key={booking.id} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer group ${isPendingSettlement ? 'bg-amber-50/30' : ''}`}
                    onClick={() => setSelectedBookingId(booking.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${isPendingSettlement ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'} rounded-lg flex items-center justify-center font-bold text-xs`}>
                          {customer?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{customer?.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{booking.id.split('-')[1]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{booking.rentalPlan}</span>
                        <span className="text-[9px] text-gray-400 font-medium">₹{booking.totalAmount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusVariant(booking.status, booking.isSettled)}>
                          {isPendingSettlement ? 'Unsettled' : booking.status}
                        </Badge>
                        {booking.isSettled && <span className="text-[8px] font-black text-emerald-600 uppercase flex items-center gap-1"><CheckCircle size={8}/> Settled</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                          <Truck size={12} className="text-slate-400" /> {vehicle?.plateNumber}
                          <Zap size={12} className="text-amber-400" /> {state.batteries.find(bt => bt.id === booking.batteryId)?.serialNumber || 'N/A'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-800">Start: {formatDate(booking.startedAt).split(',')[0]}</span>
                          <span className="text-[10px] text-gray-400">End: {booking.completedAt ? formatDate(booking.completedAt).split(',')[0] : 'Open'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-all inline" />
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No historical records found for this criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={!!selectedBookingId} 
        onClose={() => { setSelectedBookingId(null); setIsEditing(false); }} 
        title={isEditing ? "Manual Record Override" : "Lifecycle Detail"}
      >
        {selectedBooking && (() => {
          const cust = state.customers.find(c => c.id === selectedBooking.customerId);
          const veh = state.vehicles.find(v => v.id === selectedBooking.vehicleId);
          const isPending = selectedBooking.status === BookingStatus.COMPLETED && !selectedBooking.isSettled;

          if (isEditing) {
            return (
              <div className="space-y-4">
                 <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 mb-4">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                       <AlertTriangle size={12} /> System Integrity Warning
                    </p>
                    <p className="text-xs text-rose-900 mt-1 font-medium">Direct status override bypasses standard Ops SOPs. Ensure this is verified by physical audit.</p>
                 </div>
                 
                 <StatusInput 
                    label="Force Status"
                    value={editStatus}
                    onChange={(v) => setEditStatus(v as BookingStatus)}
                    options={Object.values(BookingStatus)}
                 />

                 <TextArea 
                    label="Ops Notes Addendum"
                    value={editNotes}
                    onChange={setEditNotes}
                    placeholder="Append additional details to the record..."
                 />

                 <TextArea 
                    label="Override Justification (Audit Log)"
                    value={editReason}
                    onChange={setEditReason}
                    placeholder="Provide mandatory reason for manual record correction..."
                 />

                 <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Discard</button>
                    <button onClick={handleSaveEdit} className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-black shadow-lg">Save Override</button>
                 </div>
              </div>
            );
          }

          return (
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-hide">
               {isPending && (
                  <div className="bg-amber-100/50 border-2 border-dashed border-amber-400 p-4 rounded-2xl flex items-center gap-3">
                     <Tag size={24} className="text-amber-600 shrink-0" />
                     <div>
                        <p className="text-xs font-black text-amber-900 uppercase">Settlement Required</p>
                        <p className="text-[10px] text-amber-800 font-medium">Ride completed but security deposit clearance is pending Admin reconciliation.</p>
                     </div>
                  </div>
               )}

               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><User size={20} /></div>
                    <div>
                      <h4 className="font-black text-gray-900 leading-tight">{cust?.name}</h4>
                      <p className="text-xs text-gray-500">{cust?.phone}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(selectedBooking.status, selectedBooking.isSettled)}>{selectedBooking.status}</Badge>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Truck size={10} /> Scooter</p>
                    <p className="text-xs font-black">{veh?.plateNumber}</p>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Zap size={10} /> Battery</p>
                    <p className="text-xs font-black">{state.batteries.find(b => b.id === selectedBooking.batteryId)?.serialNumber || 'N/A'}</p>
                  </div>
               </div>

               <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <History size={14} /> Journey Lifecycle
                  </h5>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <div className="flex justify-between text-xs">
                       <span className="text-gray-500 font-medium">Created On</span>
                       <span className="font-bold">{formatDate(selectedBooking.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-gray-500 font-medium">Release On</span>
                       <span className="font-bold">{formatDate(selectedBooking.startedAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-gray-500 font-medium">Return On</span>
                       <span className="font-bold">{formatDate(selectedBooking.completedAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                       <span className="text-[#0891b2] font-black uppercase tracking-tighter">Settlement Status</span>
                       <span className={selectedBooking.isSettled ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>{selectedBooking.isSettled ? "FULLY SETTLED" : "PENDING CLEARANCE"}</span>
                    </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleOpenEdit}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
                  >
                    <Edit3 size={18} /> Edit Record Properties
                  </button>
               </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default AdminBookings;