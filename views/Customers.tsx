
import React, { useState } from 'react';
import { UserPlus, UserCheck, Shield, CheckCircle, XCircle, AlertTriangle, Mail, Phone, Calendar, MapPin, CalendarDays, Smartphone, FileText, Landmark, CreditCard, QrCode } from 'lucide-react';
import { YanaState, Customer, BookingStatus } from '../types';
import { Card, Badge, Modal } from '../components/Common';
import CustomerOnboardingWizard from './CustomerOnboardingWizard';

const Customers: React.FC<{ state: YanaState, onCreate: (c: Omit<Customer, 'id' | 'storeId'>) => void }> = ({ state, onCreate }) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const storeCustomers = state.customers.filter(c => state.activeStoreId === 'all' || c.storeId === state.activeStoreId);

  const customerHasUncleared = (customerId: string) => {
    // A customer is "Unsettled" if they have ANY booking that is not explicitly settled
    return state.bookings.some(b => {
      if (b.customerId !== customerId) return false;
      return !b.isSettled;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rider CRM</h2>
          <p className="text-gray-500">Global rider database and compliance tracking.</p>
        </div>
        <button 
          onClick={() => setIsOnboarding(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"
        >
          <UserPlus size={18} />
          <span>Start Onboarding</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storeCustomers.map(customer => {
          const hasFlag = customerHasUncleared(customer.id);
          return (
            <Card 
              key={customer.id} 
              className={`hover:shadow-md transition-shadow relative cursor-pointer ${hasFlag ? 'border-rose-200' : ''}`}
              onClick={() => setSelectedCustomer(customer)}
            >
              {hasFlag && (
                <div className="absolute top-4 right-4 animate-pulse">
                   <div className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-200 text-[9px] font-black flex items-center gap-1">
                      <AlertTriangle size={10} /> <span>UNSETTLED</span>
                   </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold border-2 border-white shadow-sm text-xl uppercase ${hasFlag ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                  {(customer.name || '??').substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 leading-tight">{customer.name}</h4>
                  <p className="text-sm text-gray-500 font-medium">{customer.phone}</p>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Shield size={16} className={customer.kycStatus ? "text-emerald-500" : "text-gray-300"} />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">KYC Status</span>
                    </div>
                    {customer.kycStatus ? <Badge variant="success">Verified</Badge> : <Badge variant="error">Pending</Badge>}
                 </div>
                 <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <UserCheck size={16} className={customer.agreementAccepted ? "text-emerald-500" : "text-gray-300"} />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Agreement</span>
                    </div>
                    {customer.agreementAccepted ? <Badge variant="success">Accepted</Badge> : <Badge variant="error">Unsigned</Badge>}
                 </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {(customer.id || '').split('-')[1] || customer.id}</span>
                 <button className="py-2 px-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                   Profile Details
                 </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Rider Profile">
        {selectedCustomer && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-2xl font-black text-gray-700 shadow-sm">
                {(selectedCustomer.name || '?').charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedCustomer.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{selectedCustomer.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} /> Date of Birth</p>
                  <p className="text-sm font-bold text-gray-900">{selectedCustomer.dob || 'Not Provided'}</p>
               </div>
               <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Mail size={10} /> Email</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedCustomer.email || 'Not Provided'}</p>
               </div>
            </div>

            {/* NEW: Banking and Settlement Section */}
            <div className="p-5 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                     <Landmark size={14} className="text-[#00eaff]" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest">Settlement Banking</h4>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Bank Account</p>
                        <p className="text-sm font-black text-white">{selectedCustomer.accountNumber || 'NOT CONFIGURED'}</p>
                        <p className="text-[10px] text-slate-300">{selectedCustomer.bankName} - {selectedCustomer.ifscCode}</p>
                     </div>
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase">Holder Name</p>
                           <p className="text-[11px] font-bold text-[#00eaff]">{selectedCustomer.accountHolderName || '--'}</p>
                        </div>
                        {selectedCustomer.upiId && (
                           <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase">UPI ID</p>
                              <p className="text-[11px] font-bold text-white">{selectedCustomer.upiId}</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CreditCard size={80} />
               </div>
            </div>

            {(selectedCustomer.startDate || selectedCustomer.endDate) && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm space-y-2">
                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><CalendarDays size={10} /> Subscription Window</p>
                 <div className="flex justify-between text-xs font-bold text-blue-900">
                    <div><span className="text-[8px] text-blue-400 uppercase block font-black mb-0.5">Start</span> {selectedCustomer.startDate || 'N/A'}</div>
                    <div className="text-right"><span className="text-[8px] text-blue-400 uppercase block font-black mb-0.5">End</span> {selectedCustomer.endDate || 'N/A'}</div>
                 </div>
              </div>
            )}

            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={10} /> Address</p>
               <p className="text-xs font-bold text-gray-700 leading-relaxed">{selectedCustomer.address || 'No address on file'}</p>
            </div>

            <div className="space-y-3">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Statutory Documentation</h4>
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Aadhar UID</p>
                    <p className="text-xs font-bold text-gray-800">{selectedCustomer.aadharNo || 'Missing'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">PAN Card</p>
                    <p className="text-xs font-bold text-gray-800">{selectedCustomer.panNo || 'Missing'}</p>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
               <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Audit History</button>
               {!selectedCustomer.kycStatus && (
                 <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Verify Compliance</button>
               )}
            </div>
          </div>
        )}
      </Modal>

      <CustomerOnboardingWizard 
        isOpen={isOnboarding}
        onClose={() => setIsOnboarding(false)}
        onSubmit={onCreate}
      />
    </div>
  );
};

export default Customers;
