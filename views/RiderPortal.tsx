
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Smartphone, 
  Truck, 
  MapPin, 
  User, 
  History, 
  Settings as SettingsIcon, 
  Zap, 
  ArrowRight, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Smartphone as PhoneIcon,
  ChevronRight,
  Info,
  LogOut,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
  Search,
  UserCheck,
  CalendarDays,
  HeartPulse,
  FileText,
  CalendarCheck,
  Landmark,
  CreditCard
} from 'lucide-react';
import { 
  YanaState, 
  Customer, 
  Vehicle, 
  VehicleStatus, 
  BookingStatus, 
  RentalPlan 
} from '../types';
import { Card, Badge, Modal } from '../components/Common';
import CustomerOnboardingWizard from './CustomerOnboardingWizard';

interface RiderPortalProps {
  state: YanaState;
  onBook: (custId: string, vehId: string, plan: RentalPlan, startDateTs: number) => void;
  onOnboard: (customer: Omit<Customer, 'id' | 'storeId'>) => void;
}

const RiderPortal: React.FC<RiderPortalProps> = ({ state, onBook, onOnboard }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'rides' | 'profile' | 'settings'>('home');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [currentRiderId, setCurrentRiderId] = useState<string | null>(() => {
    const lastRider = localStorage.getItem('yana_last_rider_id');
    return state.customers.find(c => c.id === lastRider) ? lastRider : null;
  });
  
  const [isSwitchingRider, setIsSwitchingRider] = useState(false);
  const [isSelfOnboarding, setIsSelfOnboarding] = useState(false);
  const [selectedScooterId, setSelectedScooterId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RentalPlan>(RentalPlan.WEEKLY);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Real-time End Date Calculation
  const calculatedEndDate = useMemo(() => {
    if (!selectedStartDate) return null;
    const start = new Date(selectedStartDate).getTime();
    const durationDays = selectedPlan === RentalPlan.WEEKLY ? 7 : 30;
    return start + (durationDays * 24 * 60 * 60 * 1000);
  }, [selectedStartDate, selectedPlan]);

  useEffect(() => {
    if (currentRiderId) {
      localStorage.setItem('yana_last_rider_id', currentRiderId);
    }
  }, [currentRiderId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const rider = state.customers.find(c => c.phone === loginPhone);
    if (rider) {
      setCurrentRiderId(rider.id);
    } else {
      setLoginError("This phone number is not in our database.");
    }
  };

  const currentRider = useMemo(() => state.customers.find(c => c.id === currentRiderId), [currentRiderId, state.customers]);
  const activeStore = useMemo(() => state.stores.find(s => s.id === state.activeStoreId), [state.activeStoreId, state.stores]);
  
  const availableScooters = useMemo(() => 
    state.vehicles.filter(v => v.storeId === state.activeStoreId && v.status === VehicleStatus.AVAILABLE),
    [state.vehicles, state.activeStoreId]
  );

  const riderBookings = useMemo(() => 
    currentRiderId ? state.bookings.filter(b => b.customerId === currentRiderId) : [],
    [state.bookings, currentRiderId]
  );

  const activeBooking = useMemo(() => 
    riderBookings.find(b => [BookingStatus.ACTIVE, BookingStatus.PENDING, BookingStatus.PAUSED].includes(b.status)),
    [riderBookings]
  );

  const handleBookingRequest = () => {
    if (selectedScooterId && currentRiderId && selectedStartDate) {
      onBook(currentRiderId, selectedScooterId, selectedPlan, new Date(selectedStartDate).getTime());
      setSelectedScooterId(null);
      setActiveTab('rides');
    }
  };

  const getStatusIcon = (s: BookingStatus) => {
    switch (s) {
      case BookingStatus.ACTIVE: return <RefreshCcw size={14} className="text-emerald-500 animate-spin-slow" />;
      case BookingStatus.PAUSED: return <Clock size={14} className="text-amber-500" />;
      case BookingStatus.PENDING: return <Info size={14} className="text-blue-500" />;
      case BookingStatus.COMPLETED: return <CheckCircle2 size={14} className="text-gray-400" />;
      default: return null;
    }
  };

  const getFinalPrice = (base: number) => {
    return Math.round((base * (1 + state.rentalRates.gstPercentage / 100)) / 10) * 10;
  };

  if (!currentRider) {
    return (
      <div className="max-w-md mx-auto space-y-8 py-10 px-4 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-[#00eaff]/10 rounded-3xl mx-auto flex items-center justify-center">
              <Smartphone size={40} className="text-[#0891b2]" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">YANA Rider App</h2>
              <p className="text-gray-500 text-sm font-medium mt-1 px-4">Experience the future of urban mobility. Sign in or join our community.</p>
           </div>
        </div>

        <Card className="p-6 border-gray-200 shadow-xl">
           <form onSubmit={handleLogin} className="space-y-4">
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">Phone Number</label>
                 <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                       type="tel" 
                       placeholder="Enter registered mobile" 
                       className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl text-base font-bold outline-none transition-all ${loginError ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-100 focus:border-[#00eaff] focus:ring-4 focus:ring-[#00eaff]/10'}`}
                       value={loginPhone}
                       onChange={(e) => {
                          setLoginPhone(e.target.value);
                          if (loginError) setLoginError(null);
                       }}
                    />
                 </div>
              </div>

              {loginError ? (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-1 duration-200">
                    <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                    <div>
                       <p className="text-xs font-black text-rose-700 uppercase tracking-tight">Not Registered</p>
                       <p className="text-[11px] text-rose-600 font-medium mt-0.5">{loginError}</p>
                       <button 
                         type="button"
                         onClick={() => setIsSelfOnboarding(true)}
                         className="mt-3 flex items-center gap-1.5 bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-md shadow-rose-200"
                       >
                          <UserPlus size={14} /> Start Onboarding
                       </button>
                    </div>
                 </div>
              ) : (
                 <button 
                    type="submit" 
                    disabled={!loginPhone}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${loginPhone ? 'bg-slate-900 text-white shadow-xl hover:shadow-slate-200 active:scale-[0.98]' : 'bg-slate-100 text-slate-300'}`}
                 >
                    Sign In
                 </button>
              )}
           </form>
        </Card>

        <div className="relative py-4">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
           <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em] text-gray-400">
              <span className="bg-[#f8fafc] px-4">New to YANA?</span>
           </div>
        </div>

        <button 
          onClick={() => setIsSelfOnboarding(true)}
          className="w-full p-6 bg-white border border-gray-200 rounded-3xl text-gray-900 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
        >
           <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-[#00eaff]/10 rounded-2xl flex items-center justify-center text-[#0891b2]">
                 <UserPlus size={24} />
              </div>
              <div>
                 <p className="font-black text-lg leading-tight">Become a Rider</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Join the eco-fleet today</p>
              </div>
           </div>
           <ArrowRight className="text-gray-200 group-hover:text-[#00eaff] group-hover:translate-x-1 transition-all" />
        </button>

        <CustomerOnboardingWizard 
          isOpen={isSelfOnboarding}
          onClose={() => setIsSelfOnboarding(false)}
          onSubmit={(data) => {
            onOnboard(data);
            alert("Onboarding complete! You are now in our database. Please use your phone number to sign in.");
            setLoginPhone(data.phone);
            setIsSelfOnboarding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      {/* Mobile Top App Bar */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsSwitchingRider(true)}
              className="w-10 h-10 bg-[#00eaff] rounded-full border-2 border-white shadow-md flex items-center justify-center font-black text-black text-xs cursor-pointer active:scale-95 transition-all overflow-hidden"
            >
              {(currentRider.name || '?').charAt(0)}
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Welcome back,</p>
               <h3 className="font-black text-gray-900 leading-none truncate max-w-[120px]">{(currentRider.name || '').split(' ')[0]}</h3>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                <Smartphone size={14} className="text-[#00eaff]" />
                <span className="text-[10px] font-black text-gray-900">v1.0</span>
            </div>
            <button 
              onClick={() => { setCurrentRiderId(null); localStorage.removeItem('yana_last_rider_id'); setLoginPhone(''); }} 
              className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:text-rose-500 transition-all"
            >
                <LogOut size={16} />
            </button>
         </div>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'home' && (
          <div className="space-y-6">
             {/* Store Card */}
             <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-1">
                      <MapPin size={12} className="text-[#00eaff]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Current Zap Point</span>
                   </div>
                   <h4 className="text-2xl font-black">{activeStore?.name}</h4>
                   <p className="text-xs text-gray-400 mt-1 font-medium">{activeStore?.location}</p>
                   
                   <div className="mt-8 flex gap-4">
                      <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex-1 border border-white/5">
                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Scooters</p>
                         <p className="text-lg font-black text-[#00eaff]">{availableScooters.length}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex-1 border border-white/5">
                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Plan Starts</p>
                         <p className="text-lg font-black text-white">₹{getFinalPrice(state.rentalRates.weeklyRate)}*</p>
                      </div>
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00eaff] opacity-10 rounded-full blur-3xl" />
             </div>

             {/* Booking Section */}
             <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Ready for Dispatch</h4>
                <div className="space-y-3">
                   {availableScooters.length > 0 ? availableScooters.slice(0, 3).map(scooter => (
                     <div key={scooter.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all" onClick={() => setSelectedScooterId(scooter.id)}>
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-[#00eaff]/10 group-hover:text-[#0891b2] transition-colors">
                              <Truck size={20} />
                           </div>
                           <div>
                              <p className="font-black text-gray-900 leading-tight">{scooter.plateNumber}</p>
                              <p className="text-[9px] font-black text-emerald-500 uppercase mt-1 tracking-tight">Fully Inspected</p>
                           </div>
                        </div>
                        <ArrowRight size={18} className="text-gray-200 group-hover:text-[#00eaff] transition-all" />
                     </div>
                   )) : (
                     <div className="py-12 bg-gray-50 rounded-2xl border border-dashed text-center">
                        <AlertTriangle size={24} className="text-amber-400 mx-auto mb-2" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No scooters available here</p>
                     </div>
                   )}
                </div>
             </div>

             {activeBooking && (
                <div className="p-4 bg-[#00eaff]/10 border border-[#00eaff]/20 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                         <p className="text-[10px] font-black text-[#0891b2] uppercase tracking-widest leading-none mb-1">Active Session</p>
                         <p className="text-xs font-bold text-gray-900">Ongoing Ride #{activeBooking.id.split('-')[1]}</p>
                      </div>
                   </div>
                   <button onClick={() => setActiveTab('rides')} className="text-[10px] font-black uppercase text-[#0891b2] hover:underline">Track</button>
                </div>
             )}
          </div>
        )}

        {activeTab === 'rides' && (
          <div className="space-y-6">
             <div className="px-2">
                <h2 className="text-xl font-black text-gray-900">My Ride History</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking your past and present journeys</p>
             </div>

             <div className="space-y-4">
                {riderBookings.length > 0 ? [...riderBookings].reverse().map(b => (
                   <Card key={b.id} className="relative border-gray-100 hover:border-[#00eaff]/20">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-2">
                            <Truck size={16} className="text-slate-400" />
                            <span className="text-xs font-black text-gray-900">{state.vehicles.find(v => v.id === b.vehicleId)?.plateNumber}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            {getStatusIcon(b.status)}
                            <Badge variant={b.status === BookingStatus.ACTIVE ? 'success' : b.status === BookingStatus.PENDING ? 'info' : 'neutral'}>{b.status}</Badge>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 mb-4">
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dispatch</p>
                            <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={10} /> {new Date(b.createdAt).toLocaleDateString()}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Due (Inc. GST)</p>
                            <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5"><Zap size={10} className="text-[#00eaff]" /> ₹{(b.totalAmount || 0) + (b.depositAmount || 0)}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <span>ID: {b.id.split('-')[1]}</span>
                         <span className="text-[#0891b2] cursor-pointer hover:underline">View Receipt</span>
                      </div>
                   </Card>
                )) : (
                  <div className="py-20 text-center space-y-3">
                     <History size={48} className="text-gray-100 mx-auto" />
                     <p className="text-sm font-bold text-gray-400">You haven't taken any rides yet.</p>
                     <button onClick={() => setActiveTab('home')} className="text-xs font-black text-[#00eaff] uppercase">Explore Scooters</button>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="space-y-6">
              <div className="text-center py-8">
                 <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-gray-400 mb-4 uppercase">
                    {(currentRider.name || '??').substring(0, 2)}
                 </div>
                 <h2 className="text-2xl font-black text-gray-900">{currentRider.name}</h2>
                 <div className="flex items-center justify-center gap-2 mt-1">
                    {currentRider.kycStatus ? (
                       <Badge variant="success" className="rounded-lg">KYC VERIFIED</Badge>
                    ) : (
                       <Badge variant="error" className="rounded-lg">KYC PENDING</Badge>
                    )}
                 </div>
              </div>

              {/* Settlement Bank Card for Rider */}
              <div className="px-1">
                 <Card className="bg-slate-900 border-none shadow-xl overflow-hidden relative">
                    <div className="relative z-10 p-1">
                       <div className="flex items-center gap-2 mb-3">
                          <Landmark size={14} className="text-[#00eaff]" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Destination</h4>
                       </div>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[8px] font-black text-slate-500 uppercase">Account Number</p>
                             <p className="text-sm font-black text-white">{currentRider.accountNumber || 'NOT CONFIGURED'}</p>
                             <p className="text-[10px] text-[#00eaff] font-bold">{currentRider.bankName} • {currentRider.ifscCode}</p>
                          </div>
                       </div>
                    </div>
                    <CreditCard className="absolute -bottom-4 -right-4 text-white/5" size={100} />
                 </Card>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <ProfileDetail label="Mobile" value={currentRider.phone} icon={<PhoneIcon size={14} />} />
                 <ProfileDetail label="Permanent Address" value={currentRider.address || 'not provided'} icon={<MapPin size={14} />} />
                 <div className="grid grid-cols-2 gap-3">
                    <ProfileDetail label="Aadhar" value={currentRider.aadharNo || 'Missing'} icon={<ShieldCheck size={14} />} />
                    <ProfileDetail label="PAN" value={currentRider.panNo || 'Missing'} icon={<FileText size={14} />} />
                 </div>
                 <ProfileDetail label="Emergency Contacts" value={`${currentRider.emergencyContact1 || 'N/A'} / ${currentRider.emergencyContact2 || 'N/A'}`} icon={<HeartPulse size={14} className="text-rose-500" />} />
                 {(currentRider.startDate || currentRider.endDate) && (
                   <ProfileDetail 
                    label="Subscription Window" 
                    value={`${currentRider.startDate || 'N/A'} to ${currentRider.endDate || 'N/A'}`} 
                    icon={<CalendarDays size={14} className="text-[#0891b2]" />} 
                   />
                 )}
                 <ProfileDetail label="Compliance" value={currentRider.agreementAccepted ? "Section B&C Accepted" : "Not Signed"} icon={<ShieldCheck size={14} />} />
              </div>

              <div className="pt-6">
                 <button 
                  onClick={() => setIsSwitchingRider(true)}
                  className="w-full py-4 bg-gray-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 active:scale-95 transition-all mb-3"
                 >
                    <ArrowRightLeft size={16} /> Switch Account (Sim)
                 </button>
                 <button 
                  onClick={() => { setCurrentRiderId(null); setLoginPhone(''); }}
                  className="w-full py-4 bg-gray-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-100 active:scale-95 transition-all"
                 >
                    <LogOut size={16} /> Logout
                 </button>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-6">
              <div className="px-2">
                <h2 className="text-xl font-black text-gray-900">App Settings</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customize your journey</p>
             </div>
             
             <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                <SettingRow label="Real-time Notifications" description="Get alerts for battery swaps" active />
                <SettingRow label="Auto-renew Plan" description="Weekly/Monthly auto-billing" active={false} />
                <SettingRow label="Biometric Dispatch" description="Start rides with fingerprint" active />
                <SettingRow label="Data Usage" description="Optimize for 4G/5G" active={false} />
             </div>

             <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <Info size={18} className="text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 font-medium">For physical hardware issues, please contact the nearest ZAP POINT staff immediately.</p>
             </div>
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-4 z-[80] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
         <RiderTabItem icon={<Smartphone size={20} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
         <RiderTabItem icon={<History size={20} />} label="My Rides" active={activeTab === 'rides'} onClick={() => setActiveTab('rides')} />
         <RiderTabItem icon={<User size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
         <RiderTabItem icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>

      {/* MODALS */}
      <Modal isOpen={!!selectedScooterId} onClose={() => setSelectedScooterId(null)} title="Book Scooter" confirmLabel="Confirm Booking" onConfirm={handleBookingRequest}>
         <div className="space-y-6">
            <div className="p-6 bg-slate-900 rounded-3xl text-white text-center">
               <Truck size={32} className="text-[#00eaff] mx-auto mb-3" />
               <h4 className="text-xl font-black">{state.vehicles.find(v => v.id === selectedScooterId)?.plateNumber}</h4>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Available at {activeStore?.name}</p>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Your Plan (Inc. {state.rentalRates.gstPercentage}% GST)</label>
               <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setSelectedPlan(RentalPlan.WEEKLY)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === RentalPlan.WEEKLY ? 'border-[#00eaff] bg-[#00eaff]/5' : 'border-gray-50 bg-gray-50'}`}
                  >
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Weekly</p>
                     <p className="text-lg font-black text-gray-900">₹{getFinalPrice(state.rentalRates.weeklyRate)}</p>
                  </div>
                  <div 
                    onClick={() => setSelectedPlan(RentalPlan.MONTHLY)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === RentalPlan.MONTHLY ? 'border-[#00eaff] bg-[#00eaff]/5' : 'border-gray-50 bg-gray-50'}`}
                  >
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Monthly</p>
                     <p className="text-lg font-black text-gray-900">₹{getFinalPrice(state.rentalRates.monthlyRate)}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ride Start Date</label>
                  <input 
                     type="date" 
                     className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#00eaff]" 
                     value={selectedStartDate} 
                     onChange={e => setSelectedStartDate(e.target.value)} 
                  />
               </div>
               <div className="space-y-1.5 opacity-80">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ride Ends On</label>
                  <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2">
                     <CalendarCheck size={12} className="text-slate-400" />
                     {calculatedEndDate ? new Date(calculatedEndDate).toLocaleDateString('en-IN') : '--'}
                  </div>
               </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
               <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
               <p className="text-[10px] text-emerald-800 font-medium">Booking will be in DRAFT mode. Please visit the counter on your start date to pick up your battery and pay the deposit of ₹{state.rentalRates.securityDeposit}.</p>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isSwitchingRider} onClose={() => setIsSwitchingRider(false)} title="Select Rider Identity">
         <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
            {state.customers.map(cust => (
               <div 
                  key={cust.id} 
                  onClick={() => { setCurrentRiderId(cust.id); setIsSwitchingRider(false); }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${currentRiderId === cust.id ? 'border-[#00eaff] bg-[#00eaff]/5' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
               >
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-[10px] shadow-sm">{(cust.name || '?').charAt(0)}</div>
                     <div>
                        <p className="text-xs font-black text-gray-900 leading-none">{cust.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1">{cust.phone}</p>
                     </div>
                  </div>
                  {currentRiderId === cust.id && <CheckCircle2 size={16} className="text-[#0891b2]" />}
               </div>
            ))}
         </div>
      </Modal>

      <CustomerOnboardingWizard 
          isOpen={isSelfOnboarding}
          onClose={() => setIsSelfOnboarding(false)}
          onSubmit={(data) => {
            onOnboard(data);
            alert("Rider Account Created! You can now log in using your phone number.");
            setLoginPhone(data.phone);
            setIsSelfOnboarding(false);
          }}
      />
    </div>
  );
};

const ProfileDetail = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
   <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm group hover:border-[#00eaff]/20 transition-all">
      <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-[#00eaff]/10 group-hover:text-[#0891b2] transition-colors">
         {icon}
      </div>
      <div>
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
         <p className="text-xs font-bold text-gray-900">{value}</p>
      </div>
   </div>
);

const SettingRow = ({ label, description, active }: { label: string, description: string, active: boolean }) => (
   <div className="p-4 flex items-center justify-between group">
      <div>
         <p className="text-xs font-black text-gray-800 leading-none mb-1">{label}</p>
         <p className="text-[10px] text-gray-400 font-medium">{description}</p>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${active ? 'bg-[#00eaff]' : 'bg-gray-200'}`}>
         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${active ? 'right-1' : 'left-1 shadow-sm'}`} />
      </div>
   </div>
);

const RiderTabItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
   <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#0891b2]' : 'text-gray-400 hover:text-gray-600'}`}>
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#00eaff]/10 shadow-inner' : ''}`}>
         {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
   </button>
);

export default RiderPortal;
