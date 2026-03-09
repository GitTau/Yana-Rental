
import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  IndianRupee, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search, 
  Banknote, 
  CheckCircle,
  Clock,
  Globe,
  Filter,
  Info,
  ChevronRight,
  ClipboardList,
  History,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Tag,
  Receipt,
  Timer
} from 'lucide-react';
import { YanaState, Booking, BookingStatus, RentalPlan } from '../types';
import { Card, Badge, Modal } from '../components/Common';

const CHECKLIST_PRICES: Record<string, { label: string, fine: number }> = {
  'cp': { label: 'Control Panel', fine: 0 },
  'fan': { label: 'Fan', fine: 750 },
  'bs': { label: 'Break Shoe', fine: 0 },
  'sc': { label: 'Seat Cover', fine: 350 },
  'mh': { label: 'Motor Hub', fine: 500 },
  'ts': { label: 'Throttle/Switch', fine: 500 },
  'hl': { label: 'Horn/Light', fine: 0 },
  'bl': { label: 'Break Lever', fine: 0 },
  'wj': { label: 'Wheel jam', fine: 200 },
  'wp': { label: 'Wheel Puncture', fine: 200 },
  'wh': { label: 'Wheel Hub', fine: 200 },
  'key': { label: 'Key Missing/broken', fine: 1000 },
  'lock': { label: 'Lock', fine: 1000 },
  'chigory': { label: 'Chigory', fine: 500 },
  'np': { label: 'Number Plate', fine: 500 },
  'dead': { label: 'Dead', fine: 1000 },
};

const DAILY_EXTENSION_FINE = 300;

interface FinancialsProps {
  state: YanaState;
  onRecordPayment: (id: string, amount: number) => void;
  onMarkSettled: (id: string) => void;
}

const Financials: React.FC<FinancialsProps> = ({ state, onRecordPayment, onMarkSettled }) => {
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  
  const [paymentCash, setPaymentCash] = useState<string>('');
  const [paymentOnline, setPaymentOnline] = useState<string>('');

  const isGlobal = state.activeStoreId === 'all';
  const filteredBookings = state.bookings.filter(b => isGlobal || b.storeId === state.activeStoreId);

  const getPaymentStatus = (booking: Booking) => {
    const totalAmount = Number(booking.totalAmount || 0);
    const depositAmount = Number(booking.depositAmount || 0);
    const finesAmount = Number(booking.finesAmount || 0);
    
    // CALCULATE DYNAMIC OVERDUE FINES (₹300/day)
    const now = Date.now();
    let extensionFines = 0;
    let overdueDays = 0;
    if (booking.status !== BookingStatus.COMPLETED && booking.expectedEndDate && now > booking.expectedEndDate) {
      overdueDays = Math.ceil((now - booking.expectedEndDate) / (1000 * 60 * 60 * 24));
      // 1 day grace period
      extensionFines = overdueDays > 1 ? overdueDays * DAILY_EXTENSION_FINE : 0;
    } else if (booking.status === BookingStatus.COMPLETED && booking.completedAt && booking.expectedEndDate && booking.completedAt > booking.expectedEndDate) {
      // For completed rides, calculate based on actual return time
      overdueDays = Math.ceil((booking.completedAt - booking.expectedEndDate) / (1000 * 60 * 60 * 24));
      // 1 day grace period
      extensionFines = overdueDays > 1 ? overdueDays * DAILY_EXTENSION_FINE : 0;
    }
    
    const totalDue = totalAmount + depositAmount + finesAmount + extensionFines;
    const paid = Number(booking.amountPaid || 0);
    const balance = totalDue - paid;
    
    const isPendingCollection = balance > 0 && !booking.isSettled && booking.status !== BookingStatus.COMPLETED;
    const isClearanceTicket = booking.status === BookingStatus.COMPLETED && !booking.isSettled;
    
    return { totalDue, paid, balance, isPendingCollection, isClearanceTicket, depositAmount, finesAmount, extensionFines, overdueDays };
  };

  const collections = filteredBookings.filter(b => getPaymentStatus(b).isPendingCollection);
  const clearanceTickets = filteredBookings.filter(b => getPaymentStatus(b).isClearanceTicket);

  const totalReceivable = collections.reduce((sum, b) => sum + getPaymentStatus(b).balance, 0);

  const selectedBooking = useMemo(() => 
    state.bookings.find(b => b.id === detailBookingId), 
    [detailBookingId, state.bookings]
  );

  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleString() : 'N/A';

  const totalPaymentEntered = (parseFloat(paymentCash) || 0) + (parseFloat(paymentOnline) || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Wallet className="text-blue-600" />
            Settlement Center
          </h2>
          <p className="text-gray-500">Global treasury management and final rider clearance.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-amber-50 border border-amber-100 px-6 py-4 rounded-2xl flex flex-col items-end shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Revenue Outstanding</span>
              <span className="text-2xl font-black text-amber-900">₹{totalReceivable}</span>
           </div>
           <div className="bg-[#0891b2]/5 border border-[#0891b2]/20 px-6 py-4 rounded-2xl flex flex-col items-end shadow-sm">
              <span className="text-[10px] font-bold text-[#0891b2] uppercase tracking-widest">Active Tickets</span>
              <span className="text-2xl font-black text-[#0891b2]">{clearanceTickets.length} Pending</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Collections Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowDownCircle size={16} className="text-amber-500" />
              Collections Queue ({collections.length})
            </h3>
          </div>
          <div className="space-y-3">
            {collections.map(b => {
              const cust = state.customers.find(c => c.id === b.customerId);
              const store = state.stores.find(s => s.id === b.storeId);
              const status = getPaymentStatus(b);
              return (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-amber-400 transition-all cursor-pointer" onClick={() => setDetailBookingId(b.id)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                        {cust?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{cust?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                             <Globe size={10} /> {store?.name.split(' ')[2]}
                           </p>
                           {status.overdueDays > 0 && (
                             <span className={`text-[8px] font-black ${status.extensionFines > 0 ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'} uppercase flex items-center gap-0.5 px-1.5 rounded-full`}>
                               <Timer size={8}/> {status.extensionFines > 0 ? `${status.overdueDays}d Late` : 'Grace Period'}
                             </span>
                           )}
                        </div>
                      </div>
                   </div>
                   <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-lg font-black text-amber-600 leading-none">₹{status.balance}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Due Now</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-amber-500 transition-all" />
                   </div>
                </div>
              );
            })}
            {collections.length === 0 && (
              <div className="py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm italic">No revenue collection tasks</div>
            )}
          </div>
        </div>

        {/* Clearance Tickets Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={16} className="text-[#0891b2]" />
              Clearance Tickets ({clearanceTickets.length})
            </h3>
            <Badge variant="neutral">Action Required</Badge>
          </div>
          <div className="space-y-3">
            {clearanceTickets.map(b => {
              const cust = state.customers.find(c => c.id === b.customerId);
              const status = getPaymentStatus(b);
              const refundDue = status.depositAmount - status.finesAmount - status.extensionFines;
              
              return (
                <div key={b.id} className="bg-white p-5 rounded-2xl border-2 border-dashed border-[#0891b2]/30 flex items-center justify-between group hover:border-[#0891b2] hover:bg-[#0891b2]/5 transition-all cursor-pointer shadow-sm" onClick={() => setDetailBookingId(b.id)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0891b2] text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight">{cust?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[9px] text-[#0891b2] font-black uppercase flex items-center gap-1 bg-cyan-100/50 px-1.5 py-0.5 rounded w-fit">
                              <Clock size={10} /> Returned {formatDate(b.completedAt).split(',')[0]}
                           </p>
                           {status.extensionFines > 0 && <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-50 px-1.5 py-0.5 rounded">Ext. Penalized</span>}
                        </div>
                      </div>
                   </div>
                   <div className="text-right flex items-center gap-6">
                      <div>
                        <p className={`text-lg font-black leading-none ${refundDue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           ₹{Math.abs(refundDue)}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                           {refundDue >= 0 ? 'Refundable' : 'Payable'}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-[#0891b2] transition-all" />
                   </div>
                </div>
              );
            })}
            {clearanceTickets.length === 0 && (
              <div className="py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm italic">All rider accounts clear</div>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!detailBookingId} 
        onClose={() => setDetailBookingId(null)} 
        title="Account Reconciliation"
      >
        {selectedBooking && (() => {
          const cust = state.customers.find(c => c.id === selectedBooking.customerId);
          const stats = getPaymentStatus(selectedBooking);
          const logs = state.logs.filter(l => l.message.includes(selectedBooking.id));
          const refundDue = stats.depositAmount - stats.finesAmount - stats.extensionFines;

          return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="font-black text-gray-900">{cust?.name}</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Phone: {cust?.phone}</p>
                  </div>
                  <Badge variant={selectedBooking.status === BookingStatus.COMPLETED ? 'info' : 'success'}>
                    {selectedBooking.status}
                  </Badge>
               </div>

               <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Receipt size={14} /> Settlement Breakdown
                  </h5>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                     <div className="p-5 space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-medium">Initial Security Deposit</span>
                          <span className="font-black text-slate-900">₹{stats.depositAmount}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                           {stats.overdueDays === 1 && stats.extensionFines === 0 && (
                             <div className="flex justify-between text-[10px]">
                                <span className="text-amber-600 font-bold flex items-center gap-1 uppercase tracking-tighter"><Timer size={10}/> Grace Period (1d)</span>
                                <span className="text-amber-600 font-black">₹0</span>
                             </div>
                           )}
                           {stats.extensionFines > 0 && (
                             <div className="flex justify-between text-[10px]">
                                <span className="text-amber-600 font-bold flex items-center gap-1 uppercase tracking-tighter"><Timer size={10}/> Extension Penalty ({stats.overdueDays}d)</span>
                                <span className="text-amber-600 font-black">₹{stats.extensionFines}</span>
                             </div>
                           )}
                           {selectedBooking.checklist && selectedBooking.checklist.length > 0 && (
                              selectedBooking.checklist.map((label, idx) => (
                                <div key={idx} className="flex justify-between text-[10px]">
                                   <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={10}/> {label}</span>
                                   <span className="text-rose-600 font-black">₹{Object.values(CHECKLIST_PRICES).find(p => p.label === label)?.fine || 0}</span>
                                </div>
                              ))
                           )}
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
                           <span className="text-xs font-black text-[#0891b2] uppercase">Net Clear Balance</span>
                           <span className="text-xl font-black text-[#0891b2]">₹{refundDue}</span>
                        </div>
                     </div>
                     <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
                        <span className="text-xs font-bold uppercase tracking-widest">Final Ledger Action</span>
                        <div className="text-right">
                           <p className="text-lg font-black uppercase tracking-tight">
                              {refundDue >= 0 ? `Process Refund` : `Collect Balance`}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {!selectedBooking.isSettled && (
                 <div className="pt-6 border-t border-gray-100 flex gap-3">
                    <button 
                      onClick={() => { onMarkSettled(selectedBooking.id); setDetailBookingId(null); }}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <CheckCircle size={20} /> Close & Settle Ledger
                    </button>
                 </div>
               )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Financials;
