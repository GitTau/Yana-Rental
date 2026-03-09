
import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Truck, 
  Users, 
  PlusCircle, 
  Play, 
  Pause, 
  CheckCircle, 
  Zap, 
  AlertTriangle,
  Search,
  UserPlus,
  Calendar,
  Clock,
  ArrowRight,
  IndianRupee,
  Wallet,
  ArrowRightLeft,
  MoreVertical,
  Banknote,
  Info,
  RefreshCcw,
  Wrench,
  ReceiptText,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Ban,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Smartphone,
  Eye,
  LayoutDashboard,
  Target,
  BarChart3,
  CalendarX,
  CalendarCheck,
  Receipt,
  History,
  Activity,
  ShieldCheck,
  UserCheck,
  TicketCheck,
  Timer
} from 'lucide-react';
import { 
  YanaState, 
  BookingStatus, 
  VehicleStatus, 
  BatteryStatus, 
  Customer,
  RentalPlan,
  Booking,
  UserRole
} from '../types';
import { Card, Badge, Modal, TextArea, StatusInput } from '../components/Common';
import CustomerOnboardingWizard from './CustomerOnboardingWizard';

const CHECKLIST_ITEMS = [
  { id: 'cp', label: 'Control Panel', fine: 0 },
  { id: 'fan', label: 'Fan', fine: 750 },
  { id: 'bs', label: 'Break Shoe', fine: 0 },
  { id: 'sc', label: 'Seat Cover', fine: 350 },
  { id: 'mh', label: 'Motor Hub', fine: 500 },
  { id: 'ts', label: 'Throttle/Switch', fine: 500 },
  { id: 'hl', label: 'Horn/Light', fine: 0 },
  { id: 'bl', label: 'Break Lever', fine: 0 },
  { id: 'wj', label: 'Wheel jam', fine: 200 },
  { id: 'wp', label: 'Wheel Puncture', fine: 200 },
  { id: 'wh', label: 'Wheel Hub', fine: 200 },
  { id: 'key', label: 'Key Missing/broken', fine: 1000 },
  { id: 'lock', label: 'Lock', fine: 1000 },
  { id: 'chigory', label: 'Chigory', fine: 500 },
  { id: 'np', label: 'Number Plate', fine: 500 },
  { id: 'dead', label: 'Dead', fine: 1000 },
];

const DAILY_EXTENSION_FINE = 300;

interface OperatorPortalProps {
  state: YanaState;
  userRole: UserRole;
  onStart: (id: string, newVehId?: string, newBatId?: string) => void;
  onPause: (id: string, reason: string, fines: number, checklist: string[]) => void;
  onComplete: (id: string, notes: string, fines: number, checklist: string[]) => void;
  onCreateBooking: (custId: string, vehId: string, batId: string, plan: RentalPlan, startDate: number) => void;
  onOnboardCustomer: (c: Omit<Customer, 'id' | 'storeId'>) => void;
  onRecordPayment: (id: string, amount: number) => void;
  onMarkSettled: (id: string) => void;
  onSwapVehicle: (bId: string, vId: string, reason: string, maintenance: boolean, fines: number, checklist: string[]) => void;
  onSwapBattery: (bId: string, batId: string, reason: string, maintenance: boolean) => void;
}

const OperatorPortal: React.FC<OperatorPortalProps> = ({ 
  state, userRole, onStart, onPause, onComplete, onCreateBooking, onOnboardCustomer, onRecordPayment, onMarkSettled, onSwapVehicle, onSwapBattery
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'fleet' | 'payments' | 'customers'>('overview');
  const [rentalSubTab, setRentalSubTab] = useState<'live' | 'history'>('live');
  
  // Modals & Forms
  const [isCreating, setIsCreating] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isResumingId, setIsResumingId] = useState<string | null>(null);
  
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [paymentCash, setPaymentCash] = useState<string>('');
  const [paymentOnline, setPaymentOnline] = useState<string>('');
  
  const [expandedBilling, setExpandedBilling] = useState<Record<string, boolean>>({});
  const [fleetDetailView, setFleetDetailView] = useState<'vehicles' | 'batteries' | 'available' | 'inactive' | null>(null);

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistTarget, setChecklistTarget] = useState<{ id: string, type: 'return' | 'pause' } | null>(null);
  const [selectedChecklistIds, setSelectedChecklistIds] = useState<Set<string>>(new Set());

  const [settlementPromptBookingId, setSettlementPromptBookingId] = useState<string | null>(null);
  const [showOperatorReturnSuccess, setShowOperatorReturnSuccess] = useState(false);

  const [swapType, setSwapType] = useState<'vehicle' | 'battery' | null>(null);
  const [swapBookingId, setSwapBookingId] = useState<string | null>(null);
  const [swapStep, setSwapStep] = useState<'select' | 'checklist'>('select');
  const [newAssetId, setNewAssetId] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [moveToMaint, setMoveToMaint] = useState(false);

  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedVehId, setSelectedVehId] = useState('');
  const [selectedBatteryId, setSelectedBatteryId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RentalPlan>(RentalPlan.WEEKLY);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [rentalSearchQuery, setRentalSearchQuery] = useState('');

  const storeVehicles = state.vehicles.filter(v => v.storeId === state.activeStoreId);
  const storeBatteries = state.batteries.filter(b => b.storeId === state.activeStoreId);
  const storeBookings = state.bookings.filter(b => b.storeId === state.activeStoreId);
  const storeCustomers = state.customers.filter(c => c.storeId === state.activeStoreId);

  const availableVehicles = storeVehicles.filter(v => v.status === VehicleStatus.AVAILABLE);
  const availableBatteries = storeBatteries.filter(b => b.status === BatteryStatus.AVAILABLE);
  const inactiveVehicles = storeVehicles.filter(v => v.status === VehicleStatus.MAINTENANCE || v.status === VehicleStatus.INACTIVE);
  const inactiveBatteries = storeBatteries.filter(b => b.status === BatteryStatus.MAINTENANCE);

  const isAdmin = userRole === UserRole.ADMIN;

  const calculatedEndDate = useMemo(() => {
    if (!selectedStartDate) return null;
    const start = new Date(selectedStartDate);
    start.setHours(0, 0, 0, 0);
    const durationDays = selectedPlan === RentalPlan.WEEKLY ? 7 : 30;
    return start.getTime() + (durationDays * 24 * 60 * 60 * 1000);
  }, [selectedStartDate, selectedPlan]);

  const priceBreakup = useMemo(() => {
    const base = selectedPlan === RentalPlan.WEEKLY ? state.rentalRates.weeklyRate : state.rentalRates.monthlyRate;
    const gst = (base * state.rentalRates.gstPercentage) / 100;
    const deposit = state.rentalRates.securityDeposit;
    const subtotal = base + gst;
    const total = subtotal + deposit;
    return { base, gst, deposit, subtotal, total };
  }, [selectedPlan, state.rentalRates]);

  const isCustomerAlreadyBooked = (customerId: string) => {
    return state.bookings.some(b => 
      b.customerId === customerId && 
      [BookingStatus.DRAFT, BookingStatus.ACTIVE, BookingStatus.PAUSED].includes(b.status)
    );
  };

  const getBookingVariant = (s: BookingStatus, isSettled?: boolean) => {
    if (s === BookingStatus.COMPLETED && !isSettled) return 'warning';
    switch (s) {
      case BookingStatus.ACTIVE: return 'success';
      case BookingStatus.PAUSED: return 'warning';
      case BookingStatus.DRAFT: return 'neutral';
      case BookingStatus.COMPLETED: return 'info';
      default: return 'neutral';
    }
  };

  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

  const toggleBilling = (bookingId: string) => {
    setExpandedBilling(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

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
    }
    
    const baseDue = totalAmount + depositAmount;
    const totalDue = baseDue + finesAmount + extensionFines;
    const paid = Number(booking.amountPaid || 0);
    const balance = totalDue - paid;
    
    const isPendingCollection = balance > 0 && !booking.isSettled;
    const isPendingRefund = (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.ACTIVE) && balance < 0 && !booking.isSettled;
    
    const isWeekly = booking.rentalPlan === RentalPlan.WEEKLY;
    const thresholdRatio = isWeekly ? 1.0 : 0.5;
    const minToStart = totalDue * thresholdRatio;
    const canStart = paid >= minToStart;
    const coveragePct = totalDue > 0 ? (paid / totalDue) * 100 : 0;

    return { 
      totalDue, paid, balance, canStart, minToStart, 
      isPendingCollection, isPendingRefund, totalAmount, 
      depositAmount, finesAmount, extensionFines, overdueDays,
      coveragePct, thresholdRatio 
    };
  };

  const customerHasUncleared = (customerId: string) => {
    return state.bookings.some(b => {
      if (b.customerId !== customerId || b.isSettled) return false;
      return true;
    });
  };

  const filteredRentals = storeBookings.filter(b => {
    if (rentalSubTab === 'live') {
      if (![BookingStatus.ACTIVE, BookingStatus.DRAFT, BookingStatus.PAUSED].includes(b.status) && b.isSettled) return false;
    }
    
    if (!rentalSearchQuery) return true;
    const query = rentalSearchQuery.toLowerCase();
    const customer = state.customers.find(c => c.id === b.customerId);
    const vehicle = state.vehicles.find(v => v.id === b.vehicleId);
    const battery = state.batteries.find(bat => bat.id === b.batteryId);
    return (customer?.name || '').toLowerCase().includes(query) || (customer?.phone || '').includes(query) || (vehicle?.plateNumber || '').toLowerCase().includes(query) || (battery?.serialNumber || '').toLowerCase().includes(query);
  });

  const handleSwapConfirm = () => {
    if (!swapBookingId || !newAssetId || !swapReason) {
      alert("All fields are required for a swap.");
      return;
    }
    if (swapType === 'vehicle' && swapStep === 'select') {
      setSwapStep('checklist');
      setSelectedChecklistIds(new Set());
    } else if (swapType === 'battery') {
      onSwapBattery(swapBookingId, newAssetId, swapReason, moveToMaint);
      resetSwapState();
    }
  };

  const resetSwapState = () => {
    setSwapType(null);
    setSwapBookingId(null);
    setSwapStep('select');
    setNewAssetId('');
    setSwapReason('');
    setMoveToMaint(false);
  };

  const executeVehicleSwap = () => {
    if (!swapBookingId || !newAssetId) return;
    const totalFine = Array.from(selectedChecklistIds).reduce((sum: number, id: string) => {
      return sum + (CHECKLIST_ITEMS.find(item => item.id === id)?.fine || 0);
    }, 0);
    const checklistLog = Array.from(selectedChecklistIds).map(id => CHECKLIST_ITEMS.find(item => item.id === id)?.label || '');
    onSwapVehicle(swapBookingId, newAssetId, swapReason, moveToMaint, totalFine, checklistLog);
    resetSwapState();
  };

  const handleReturnChecklistSubmit = () => {
    if (!checklistTarget) return;
    const totalFine = Array.from(selectedChecklistIds).reduce((sum: number, id: string) => {
      return sum + (CHECKLIST_ITEMS.find(item => item.id === id)?.fine || 0);
    }, 0);
    const checklistLog = Array.from(selectedChecklistIds).map(id => CHECKLIST_ITEMS.find(item => item.id === id)?.label || '');
    const bookingId = checklistTarget.id;
    
    if (checklistTarget.type === 'pause') {
      onPause(bookingId, 'Operator Pause (Delink)', totalFine, checklistLog);
    } else {
      onComplete(bookingId, 'Inspection Complete', totalFine, checklistLog);
    }

    setIsChecklistOpen(false);
    setChecklistTarget(null);
    
    if (checklistTarget.type === 'return') {
      if (isAdmin) {
        setSettlementPromptBookingId(bookingId);
      } else {
        setShowOperatorReturnSuccess(true);
      }
    }
  };

  const handleResumeBooking = () => {
    if (isResumingId && selectedVehId && selectedBatteryId) {
      onStart(isResumingId, selectedVehId, selectedBatteryId);
      setIsResumingId(null);
      setSelectedVehId('');
      setSelectedBatteryId('');
    } else {
      alert("Please select both a scooter and a battery to resume the ride.");
    }
  };

  const toggleChecklistItem = (id: string) => {
    const next = new Set(selectedChecklistIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChecklistIds(next);
  };

  const checklistFineTotal = useMemo(() => {
    return Array.from(selectedChecklistIds).reduce((sum: number, id: string) => {
      return sum + (CHECKLIST_ITEMS.find(item => item.id === id)?.fine || 0);
    }, 0);
  }, [selectedChecklistIds]);

  const totalPaymentEntered = (parseFloat(paymentCash) || 0) + (parseFloat(paymentOnline) || 0);

  const getFleetStatusVariant = (s: string) => {
    if (s === VehicleStatus.AVAILABLE || s === BatteryStatus.AVAILABLE) return 'success';
    if (s === VehicleStatus.IN_USE || s === BatteryStatus.IN_USE) return 'info';
    if (s === VehicleStatus.MAINTENANCE || s === BatteryStatus.MAINTENANCE) return 'warning';
    return 'error';
  };

  const handleCreateBooking = () => {
    if (selectedCustId && selectedVehId && selectedBatteryId && selectedStartDate) { 
      const anchorDate = new Date(selectedStartDate);
      anchorDate.setHours(0, 0, 0, 0);
      
      onCreateBooking(selectedCustId, selectedVehId, selectedBatteryId, selectedPlan, anchorDate.getTime()); 
      setIsCreating(false); 
      setSelectedCustId('');
      setSelectedVehId('');
      setSelectedBatteryId('');
    } else {
      alert("All fields are required to create a booking.");
    }
  };

  const overviewStats = useMemo(() => {
    const totalBookings = storeBookings.length;
    const idleVehicles = storeVehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
    const vehiclesOnRent = storeBookings.filter(b => [BookingStatus.ACTIVE, BookingStatus.PAUSED].includes(b.status)).length;
    const activeStore = state.stores.find(s => s.id === state.activeStoreId);
    const target = activeStore?.targetRentals || 0;
    const pendingPaymentsCount = storeBookings.filter(b => getPaymentStatus(b).isPendingCollection).length;
    
    const now = Date.now();
    const overdueBookings = storeBookings.filter(b => 
      [BookingStatus.ACTIVE, BookingStatus.PAUSED].includes(b.status) && 
      b.expectedEndDate && b.expectedEndDate < now
    );
    const totalOverdueDaysForFine = overdueBookings.reduce((sum, b) => {
      const diff = now - (b.expectedEndDate || now);
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return sum + (days > 1 ? days : 0);
    }, 0);

    return { totalBookings, idleVehicles, vehiclesOnRent, target, pendingPaymentsCount, overdueCount: overdueBookings.length, totalOverdueDays: totalOverdueDaysForFine };
  }, [storeBookings, storeVehicles, state.activeStoreId, state.stores]);

  return (
    <div className="space-y-4 lg:space-y-6 pb-20">
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-full overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max gap-1">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-[#00eaff] text-black shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard size={16} /><span>Overview</span>
          </button>
          <button onClick={() => setActiveTab('rentals')} className={`flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${activeTab === 'rentals' ? 'bg-[#00eaff] text-black shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <BookOpen size={16} /><span>Rentals</span>
          </button>
          <button onClick={() => setActiveTab('fleet')} className={`flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${activeTab === 'fleet' ? 'bg-[#00eaff] text-black shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Truck size={16} /><span>Fleet</span>
          </button>
          <button onClick={() => setActiveTab('payments')} className={`flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-[#00eaff] text-black shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Wallet size={16} /><span>Payments</span>
          </button>
          <button onClick={() => setActiveTab('customers')} className={`flex items-center space-x-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${activeTab === 'customers' ? 'bg-[#00eaff] text-black shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users size={16} /><span>Riders</span>
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="px-1 flex justify-between items-center">
               <div>
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">Ops Center</h2>
                  <p className="text-gray-500 text-[10px] lg:text-sm font-bold uppercase tracking-widest mt-0.5">Zap Point Performance Overview</p>
               </div>
               <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Store Live</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
               <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  <KPIBox 
                    label="Total Bookings" 
                    value={overviewStats.totalBookings} 
                    icon={<BookOpen size={20} />} 
                    color="text-blue-600" 
                    bg="bg-blue-50" 
                    onClick={() => { setActiveTab('rentals'); setRentalSubTab('history'); }}
                  />
                  <KPIBox 
                    label="Vehicles IDLE" 
                    value={overviewStats.idleVehicles} 
                    icon={<Zap size={20} />} 
                    color="text-emerald-600" 
                    bg="bg-emerald-50" 
                    onClick={() => { setActiveTab('fleet'); setFleetDetailView('available'); }}
                  />
                  
                  <Card 
                    className="col-span-2 overflow-hidden border-slate-200 cursor-pointer active:scale-[0.99] transition-all"
                    onClick={() => { setActiveTab('rentals'); setRentalSubTab('live'); }}
                  >
                    <div className="flex justify-between items-center mb-6">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                             <Target size={14} className="text-blue-500" /> Rental Goal Progress
                          </p>
                          <h4 className="text-2xl font-black text-slate-900">{overviewStats.vehiclesOnRent} <span className="text-sm font-bold text-slate-400">/ {overviewStats.target} Active</span></h4>
                       </div>
                       <div className="bg-slate-900 text-[#00eaff] px-4 py-2 rounded-xl text-lg font-black italic">
                          {overviewStats.target > 0 ? Math.round((overviewStats.vehiclesOnRent / overviewStats.target) * 100) : 0}%
                       </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                       <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min(100, (overviewStats.vehiclesOnRent / overviewStats.target) * 100)}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-tighter italic">* Target defined by Admin Console</p>
                  </Card>
               </div>

               <div className="space-y-4">
                  <KPIBox 
                    label="Payments Pending" 
                    value={overviewStats.pendingPaymentsCount} 
                    icon={<IndianRupee size={20} />} 
                    color="text-amber-600" 
                    bg="bg-amber-50" 
                    footer="Follow-up Required" 
                    onClick={() => setActiveTab('payments')}
                  />
                  
                  <div 
                    className={`p-6 rounded-3xl border-2 flex flex-col justify-between h-[180px] transition-all cursor-pointer active:scale-[0.98] ${overviewStats.overdueCount > 0 ? 'border-rose-400 bg-rose-50' : 'border-slate-100 bg-white'}`}
                    onClick={() => { setActiveTab('rentals'); setRentalSubTab('live'); }}
                  >
                     <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl ${overviewStats.overdueCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                           <CalendarX size={24} />
                        </div>
                        <Badge variant={overviewStats.overdueCount > 0 ? 'error' : 'neutral'}>Overdue Status</Badge>
                     </div>
                     <div>
                        <p className={`text-4xl font-black ${overviewStats.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{overviewStats.overdueCount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Rentals Past Due</p>
                     </div>
                     {overviewStats.overdueCount > 0 && (
                       <div className="flex items-center gap-1.5 mt-2 bg-rose-600/10 px-2 py-1 rounded-lg w-fit">
                          <IndianRupee size={12} className="text-rose-600" />
                          <span className="text-[9px] font-black text-rose-700 uppercase">Impact: ₹{overviewStats.totalOverdueDays * 300} Penalties</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'rentals' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
               <div className="px-1">
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">Rental Center</h2>
                  <p className="text-gray-500 text-[10px] lg:text-sm font-bold uppercase tracking-widest mt-0.5">Fleet dispatcher & lifecycle tracker.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-2">
                 <div className="relative">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input type="text" placeholder="Search ID, Plate, Phone..." className="w-full lg:w-64 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#00eaff]" value={rentalSearchQuery} onChange={(e) => setRentalSearchQuery(e.target.value)} />
                 </div>
                 <button onClick={() => setIsCreating(true)} className="flex items-center justify-center space-x-2 bg-[#00eaff] text-black px-4 lg:px-6 py-2 rounded-xl text-xs font-black hover:brightness-105 shadow-md active:scale-95 transition-all">
                   <PlusCircle size={18} /><span>Book Ride</span>
                 </button>
               </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
               <button onClick={() => setRentalSubTab('live')} className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rentalSubTab === 'live' ? 'bg-white text-[#0891b2] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Activity size={12} /><span>Live Board</span>
               </button>
               <button onClick={() => setRentalSubTab('history')} className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rentalSubTab === 'history' ? 'bg-white text-[#0891b2] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <History size={12} /><span>Master History</span>
               </button>
            </div>

            {rentalSubTab === 'live' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 animate-in fade-in slide-in-from-left-2 duration-300">
                {filteredRentals.map(booking => {
                    const customer = state.customers.find(c => c.id === booking.customerId);
                    const vehicle = state.vehicles.find(v => v.id === booking.vehicleId);
                    const pay = getPaymentStatus(booking);
                    const isExpanded = expandedBilling[booking.id];
                    const hasFlag = customerHasUncleared(booking.customerId);
                    const isReturned = booking.status === BookingStatus.COMPLETED && !booking.isSettled;
                    const isWeekly = booking.rentalPlan === RentalPlan.WEEKLY;
                    
                    const isPastDue = pay.overdueDays > 0;
                    const now = Date.now();
                    const isNearDue = booking.expectedEndDate && (booking.expectedEndDate - now) < (24 * 60 * 60 * 1000) && !isPastDue && booking.status !== BookingStatus.COMPLETED;

                    const belowThreshold = !pay.canStart;

                    return (
                      <Card key={booking.id} className={`relative border flex flex-col h-full hover:border-[#00eaff]/30 transition-all ${isReturned ? 'border-[#0891b2]/40 bg-[#0891b2]/5 shadow-inner' : isPastDue ? 'border-rose-300 shadow-rose-100 shadow-lg' : belowThreshold ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'}`}>
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                          <Badge variant={getBookingVariant(booking.status, booking.isSettled)}>
                             {isReturned ? 'Pending Settlement' : booking.status}
                          </Badge>
                          {hasFlag && (
                            <div className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                              <AlertTriangle size={8} /> <span>NOT CLEAR</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-9 h-9 ${isReturned ? 'bg-[#0891b2] text-white' : 'bg-blue-100 text-blue-700'} rounded-full flex items-center justify-center font-bold text-xs shrink-0`}>{(customer?.name || '?').charAt(0)}</div>
                          <div className="overflow-hidden pr-12">
                            <p className="font-bold text-gray-900 text-sm truncate leading-tight">{customer?.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 tracking-tight">{customer?.phone}</p>
                          </div>
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-1.5">
                              <Truck size={10} />
                              <span>{vehicle?.plateNumber || <span className="text-rose-400 italic">Unassigned</span>}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[#0891b2]">
                              <Zap size={10} />
                              <span>{state.batteries.find(b => b.id === booking.batteryId)?.serialNumber || <span className="text-rose-400 italic">Unassigned</span>}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="neutral" className="text-[7px] py-0">{booking.rentalPlan}</Badge>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                              {isWeekly ? '100% Payment Gate' : '50% Payment Gate'}
                            </span>
                          </div>

                          {belowThreshold && (booking.status === BookingStatus.DRAFT || booking.status === BookingStatus.PAUSED || isPastDue) && (
                            <div className="p-2.5 rounded-xl border bg-amber-50 border-amber-200 flex flex-col gap-1 shadow-sm">
                               <div className="flex items-center gap-1.5 text-amber-700">
                                  <AlertTriangle size={14} className="animate-pulse" />
                                  <span className="text-[9px] font-black uppercase tracking-tight">Revenue Protection Gate</span>
                               </div>
                               <p className="text-[10px] text-amber-800 font-bold leading-tight">
                                 Paid: ₹{pay.paid} <br/> 
                                 <span className="text-[9px] opacity-70">Need ₹{Math.ceil(pay.minToStart - pay.paid)} more to reach threshold</span>
                               </p>
                            </div>
                          )}

                          {booking.pauseReason && booking.status === BookingStatus.PAUSED && (
                             <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Pause Log (Assets Delinked)</p>
                                <p className="text-[10px] text-slate-700 italic font-medium">"{booking.pauseReason}"</p>
                             </div>
                          )}

                          {!isReturned && (
                            <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${isPastDue ? 'bg-rose-50 border-rose-100' : isNearDue ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarCheck size={12} className={isPastDue ? 'text-rose-500' : 'text-slate-400'} />
                                    <span className={`text-[9px] font-black uppercase tracking-tight ${isPastDue ? 'text-rose-600' : 'text-slate-500'}`}>
                                        Return Due
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-black ${isPastDue ? 'text-rose-700' : 'text-slate-900'}`}>
                                    {formatDate(booking.expectedEndDate)}
                                  </span>
                              </div>
                              {isPastDue && (
                                  <div className="flex items-center justify-between mt-1">
                                    <div className={`${pay.extensionFines > 0 ? 'bg-rose-600' : 'bg-amber-500'} text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter`}>
                                      {pay.extensionFines > 0 ? `${pay.overdueDays} Days Late` : 'Grace Period (1d)'}
                                    </div>
                                    <span className={`text-[9px] font-black ${pay.extensionFines > 0 ? 'text-rose-600' : 'text-amber-600'} uppercase tracking-tight flex items-center gap-1`}>
                                      <Timer size={10}/> ₹{pay.extensionFines} Fine
                                    </span>
                                  </div>
                              )}
                            </div>
                          )}

                          {isReturned && (
                             <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-100 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                   <TicketCheck size={14} className="text-emerald-600" />
                                   <span className="text-[9px] font-black uppercase text-emerald-800">Clearance Ticket Open</span>
                                </div>
                                <p className="text-[10px] text-emerald-700 font-medium leading-tight">Scooter returned. Awaiting Admin clearance of ₹{Math.abs(pay.balance)} deposit.</p>
                             </div>
                          )}

                          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <button onClick={() => toggleBilling(booking.id)} className="w-full p-2.5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">
                                <div className="flex items-center gap-1.5"><ReceiptText size={10} className="text-slate-400" /><span>Financial Health</span></div>
                                <div className="flex items-center gap-1.5">
                                  <span className={pay.coveragePct < (pay.thresholdRatio * 100) ? "text-amber-600" : "text-emerald-600"}>Paid: {Math.round(pay.coveragePct)}%</span>
                                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </div>
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 space-y-1.5 border-t border-gray-50 pt-2 animate-in slide-in-from-top-1 duration-200">
                                  <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-bold">Rental Plan</span><span className="text-gray-900 font-black">₹{pay.totalAmount}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-bold">Security Deposit</span><span className="text-gray-900 font-black">₹{pay.depositAmount}</span></div>
                                  {pay.finesAmount > 0 && <div className="flex justify-between text-[10px]"><span className="text-rose-500 font-bold">Damage Fines</span><span className="text-rose-600 font-black">₹{pay.finesAmount}</span></div>}
                                  {pay.extensionFines > 0 && <div className="flex justify-between text-[10px]"><span className="text-amber-600 font-bold flex items-center gap-1"><Timer size={8}/> Late Extension</span><span className="text-amber-600 font-black">₹{pay.extensionFines}</span></div>}
                                  <div className="flex justify-between text-[10px] pt-1 border-t border-gray-100 font-black text-[#0891b2]"><span className="">Total Collected</span><span className="">₹{pay.paid}</span></div>
                                  <div className="flex justify-between text-[10px] pt-1 border-t border-gray-100 font-black text-rose-600"><span className="">Remaining Due</span><span className="">₹{pay.balance}</span></div>
                              </div>
                            )}
                            <div className="h-1.5 w-full bg-slate-100 relative">
                               <div className="absolute top-0 w-0.5 h-full bg-slate-400 z-10" style={{ left: `${pay.thresholdRatio * 100}%` }} title={`Dispatch Gate: ${pay.thresholdRatio * 100}%`} />
                               <div className={`h-full transition-all duration-700 ${pay.coveragePct < (pay.thresholdRatio * 100) ? 'bg-amber-400' : 'bg-[#00eaff]'}`} style={{ width: `${pay.coveragePct}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-gray-50">
                          {booking.status === BookingStatus.DRAFT && (
                            <div className="flex gap-1.5">
                                <button onClick={() => { setPaymentBookingId(booking.id); setPaymentCash(''); setPaymentOnline(''); }} className="flex-1 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all">Collect Cash</button>
                                <button onClick={() => onStart(booking.id)} className={`flex-[1.5] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pay.canStart ? 'bg-[#00eaff] text-black shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
                                  {pay.canStart ? 'Dispatch Ride' : `Locked (${Math.round(pay.thresholdRatio * 100)}%)`}
                                </button>
                            </div>
                          )}
                          {(booking.status === BookingStatus.ACTIVE || booking.status === BookingStatus.PAUSED) && (
                            <div className="space-y-1.5">
                              {booking.status === BookingStatus.ACTIVE && !isPastDue && (
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button onClick={() => { setSwapType('vehicle'); setSwapBookingId(booking.id); setSwapReason(''); setNewAssetId(''); setMoveToMaint(false); setSwapStep('select'); }} className="py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"><RefreshCcw size={10} /> <span>Scooter</span></button>
                                  <button onClick={() => { setSwapType('battery'); setSwapBookingId(booking.id); setSwapReason(''); setNewAssetId(''); setMoveToMaint(false); setSwapStep('select'); }} className="py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"><RefreshCcw size={10} /> <span>Battery</span></button>
                                </div>
                              )}
                              <div className="flex space-x-1.5">
                                  {booking.status === BookingStatus.PAUSED || isPastDue ? (
                                     <button onClick={() => { 
                                       if(pay.canStart) setIsResumingId(booking.id);
                                       else { setPaymentBookingId(booking.id); setPaymentCash(''); setPaymentOnline(''); }
                                     }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all ${pay.canStart ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                                        {pay.canStart ? 'Assign & Resume' : 'Clear Dues to Dispatch'}
                                     </button>
                                  ) : (
                                     <button onClick={() => { setChecklistTarget({ id: booking.id, type: 'pause' }); setSelectedChecklistIds(new Set()); setIsChecklistOpen(true); }} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Pause & Delink</button>
                                  )}
                                  <button onClick={() => { setChecklistTarget({ id: booking.id, type: 'return' }); setSelectedChecklistIds(new Set()); setIsChecklistOpen(true); }} className="flex-1 py-2.5 bg-[#00eaff] text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Return</button>
                              </div>
                            </div>
                          )}
                          {isReturned && isAdmin && (
                             <button onClick={() => setSettlementPromptBookingId(booking.id)} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                                <ShieldCheck size={14} /> Clear Settlement Ticket
                             </button>
                          )}
                          {isReturned && !isAdmin && (
                             <div className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 italic">
                                <Clock size={14} /> Awaiting Admin Action
                             </div>
                          )}
                        </div>
                      </Card>
                    );
                })}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <Card className="p-0 overflow-hidden border border-slate-200">
                  <div className="table-container">
                    <table className="w-full text-left text-xs">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Rider</th>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Asset</th>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Plan</th>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Status</th>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Started</th>
                             <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Ended</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {[...filteredRentals].reverse().map(b => {
                            const cust = state.customers.find(c => c.id === b.customerId);
                            const veh = state.vehicles.find(v => v.id === b.vehicleId);
                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                       <span className="font-bold text-slate-900">{cust?.name}</span>
                                       <span className="text-[10px] text-slate-400">{cust?.phone}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 font-mono font-bold text-slate-700">{veh?.plateNumber || '--'}</td>
                                 <td className="px-4 py-3"><Badge variant="neutral">{b.rentalPlan}</Badge></td>
                                 <td className="px-4 py-3"><Badge variant={getBookingVariant(b.status, b.isSettled)}>{b.status}</Badge></td>
                                 <td className="px-4 py-3 text-slate-500">{formatDate(b.startedAt || b.createdAt)}</td>
                                 <td className="px-4 py-3 text-slate-500">{b.completedAt ? formatDate(b.completedAt) : '--'}</td>
                              </tr>
                            );
                          })}
                       </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 px-1">
               <button onClick={() => setFleetDetailView(fleetDetailView === 'vehicles' ? null : 'vehicles')} className="text-left w-full focus:outline-none">
                 <FleetStat label="Fleet Size" count={storeVehicles.length} color="text-slate-900" bg={fleetDetailView === 'vehicles' ? 'bg-slate-100 ring-2 ring-[#00eaff]' : 'bg-white'} />
               </button>
               <button onClick={() => setFleetDetailView(fleetDetailView === 'available' ? null : 'available')} className="text-left w-full focus:outline-none">
                 <FleetStat 
                    label="Available" 
                    count={`Scot - ${availableVehicles.length}, Bat - ${availableBatteries.length}`} 
                    color="text-emerald-600" 
                    bg={fleetDetailView === 'available' ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-emerald-50'} 
                 />
               </button>
               <button onClick={() => setFleetDetailView(fleetDetailView === 'batteries' ? null : 'batteries')} className="text-left w-full focus:outline-none">
                 <FleetStat label="Batteries" count={storeBatteries.length} color="text-[#0891b2]" bg={fleetDetailView === 'batteries' ? 'bg-cyan-100 ring-2 ring-[#00eaff]' : 'bg-white'} />
               </button>
               <button onClick={() => setFleetDetailView(fleetDetailView === 'inactive' ? null : 'inactive')} className="text-left w-full focus:outline-none">
                 <FleetStat 
                    label="Inactive" 
                    count={`Scot - ${inactiveVehicles.length}, Bat - ${inactiveBatteries.length}`} 
                    color="text-rose-600" 
                    bg={fleetDetailView === 'inactive' ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-rose-50'} 
                 />
               </button>
            </div>

            {fleetDetailView && (
              <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                <Card className="p-0 border border-slate-200 overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {fleetDetailView === 'vehicles' && <Truck size={20} className="text-[#00eaff]" />}
                      {fleetDetailView === 'batteries' && <Zap size={20} className="text-[#00eaff]" />}
                      {(fleetDetailView === 'available' || fleetDetailView === 'inactive') && <Info size={20} className="text-[#00eaff]" />}
                      <h3 className="font-black uppercase tracking-widest text-xs">
                        {fleetDetailView === 'vehicles' && 'Store Vehicle Roster'}
                        {fleetDetailView === 'batteries' && 'Store Battery Inventory'}
                        {fleetDetailView === 'available' && 'Ready Assets'}
                        {fleetDetailView === 'inactive' && 'Maintenance & Grounded Assets'}
                      </h3>
                    </div>
                    <button onClick={() => setFleetDetailView(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-white">Close Detail</button>
                  </div>
                  
                  <div className="max-h-[50vh] overflow-y-auto overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Identifier</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Type</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Status</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Linkage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(fleetDetailView === 'vehicles' || fleetDetailView === 'available' || fleetDetailView === 'inactive') && 
                          storeVehicles
                            .filter(v => {
                              if (fleetDetailView === 'available') return v.status === VehicleStatus.AVAILABLE;
                              if (fleetDetailView === 'inactive') return v.status === VehicleStatus.MAINTENANCE || v.status === VehicleStatus.INACTIVE;
                              return true;
                            })
                            .map(v => (
                              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900">{v.plateNumber}</td>
                                <td className="px-4 py-3"><Badge variant="neutral">Scooter</Badge></td>
                                <td className="px-4 py-3"><Badge variant={getFleetStatusVariant(v.status)}>{v.status}</Badge></td>
                                <td className="px-4 py-3 text-slate-400 font-medium">
                                  {v.assignedBatteryId ? 
                                    <span className="flex items-center gap-1 text-[#0891b2] font-black"><Zap size={10}/> {state.batteries.find(bat => bat.id === v.assignedBatteryId)?.serialNumber}</span> : 
                                    '--'}
                                </td>
                              </tr>
                            ))
                        }
                        {(fleetDetailView === 'batteries' || fleetDetailView === 'available' || fleetDetailView === 'inactive') && 
                          storeBatteries
                            .filter(b => {
                              if (fleetDetailView === 'available') return b.status === BatteryStatus.AVAILABLE;
                              if (fleetDetailView === 'inactive') return b.status === BatteryStatus.MAINTENANCE;
                              return true;
                            })
                            .map(b => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-[#0891b2]">{b.serialNumber}</td>
                                <td className="px-4 py-3"><Badge variant="info">Battery</Badge></td>
                                <td className="px-4 py-3"><Badge variant={getFleetStatusVariant(b.status)}>{b.status}</Badge></td>
                                <td className="px-4 py-3 text-slate-400 font-medium">
                                  {b.assignedVehicleId ? 
                                    <span className="flex items-center gap-1 text-slate-900 font-black"><Truck size={10}/> {state.vehicles.find(v => v.id === b.assignedVehicleId)?.plateNumber}</span> : 
                                    '--'}
                                </td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="px-1">
                <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">Payments Desk</h2>
                <p className="text-gray-500 text-[10px] lg:text-sm font-bold uppercase tracking-widest mt-0.5">Settlements & account clearing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <ArrowDownCircle size={14} className="text-amber-500" />
                    Due Collection
                  </h3>
                  <div className="space-y-3">
                     {storeBookings.filter(b => getPaymentStatus(b).isPendingCollection).map(b => {
                        const cust = state.customers.find(c => c.id === b.customerId);
                        const pay = getPaymentStatus(b);
                        const isWeekly = b.rentalPlan === RentalPlan.WEEKLY;
                        return (
                          <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><IndianRupee size={16} /></div>
                                <div>
                                   <div className="flex items-center gap-1.5">
                                      <p className="font-black text-gray-900 leading-none text-xs lg:text-sm">{cust?.name}</p>
                                      <Badge variant="neutral" className="text-[7px] py-0">{b.rentalPlan}</Badge>
                                   </div>
                                   <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Node: {(b.id || '').split('-')[1]}</p>
                                      {pay.overdueDays > 0 && <span className="text-[8px] font-black text-rose-600 flex items-center gap-0.5 bg-rose-50 px-1 rounded"><Timer size={8}/> {pay.overdueDays}d Late</span>}
                                   </div>
                                </div>
                             </div>
                             <div className="text-right flex items-center gap-3">
                                <div>
                                   <p className="text-sm lg:text-base font-black text-amber-600 leading-none">₹{pay.balance}</p>
                                   {isWeekly && <p className="text-[7px] font-black text-rose-500 uppercase">100% Adv. Reqd</p>}
                                </div>
                                <button onClick={() => { setPaymentBookingId(b.id); setPaymentCash(''); setPaymentOnline(''); }} className="p-2 bg-amber-500 text-white rounded-lg active:scale-95 transition-all"><Banknote size={14} /></button>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Security Deposit Clearance
                  </h3>
                  <div className="space-y-3">
                     {storeBookings.filter(b => getPaymentStatus(b).isPendingRefund).map(b => {
                        const cust = state.customers.find(c => c.id === b.customerId);
                        const pay = getPaymentStatus(b);
                        return (
                          <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><RefreshCcw size={16} /></div>
                                <div>
                                   <p className="font-black text-gray-900 leading-none text-xs lg:text-sm">{cust?.name}</p>
                                   <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{b.status === BookingStatus.COMPLETED ? `Returned ${formatDate(b.completedAt)}` : 'Active'}</p>
                                </div>
                             </div>
                             <div className="text-right flex items-center gap-3">
                                <div>
                                   <p className="text-sm lg:text-base font-black text-emerald-600 leading-none">₹{Math.abs(pay.balance)}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Refund Due</p>
                                </div>
                                {isAdmin ? (
                                  <button onClick={() => onMarkSettled(b.id)} className="p-2 bg-emerald-600 text-white rounded-lg active:scale-95 transition-all" title="Refund and Mark Settled"><CheckCircle size={14} /></button>
                                ) : (
                                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed opacity-60" title="Admin only action">
                                     <ShieldCheck size={14} />
                                  </div>
                                )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
               <div className="relative w-full lg:max-w-xs">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#00eaff]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
               <button onClick={() => setIsOnboarding(true)} className="w-full lg:w-auto flex items-center justify-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all shadow-md"><UserPlus size={18} /><span>Onboard Rider</span></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
               {storeCustomers.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery)).map(cust => {
                 const hasFlag = customerHasUncleared(cust.id);
                 const isBooked = isCustomerAlreadyBooked(cust.id);
                 return (
                    <Card 
                      key={cust.id} 
                      className={`hover:border-[#00eaff]/30 cursor-pointer active:scale-[0.98] transition-all ${hasFlag ? 'border-rose-100 bg-rose-50/10' : ''} ${isBooked ? 'opacity-70 bg-slate-50 border-slate-200' : ''}`} 
                      onClick={() => { 
                        if (isBooked) {
                          alert("⚠️ This rider already has an active booking.");
                          return;
                        }
                        setSelectedCustId(cust.id); 
                        setIsCreating(true); 
                      }}
                    >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${hasFlag ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                            {(cust.name || '??').substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 pr-2">
                              <p className="font-bold text-gray-900 text-sm truncate leading-tight">{cust.name}</p>
                              {hasFlag && <AlertTriangle size={12} className="text-rose-500 shrink-0" />}
                              {isBooked && <Badge variant="info">In Ride</Badge>}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-tight">{cust.phone}</p>
                          </div>
                        </div>
                    </Card>
                 );
               })}
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={showOperatorReturnSuccess} 
        onClose={() => setShowOperatorReturnSuccess(false)} 
        title="Return Recorded"
        confirmLabel="Understood"
        onConfirm={() => setShowOperatorReturnSuccess(false)}
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <UserCheck size={32} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900">Ride Completed</h4>
            <p className="text-sm text-slate-500 mt-2">The inspection details have been recorded successfully. Please ask the rider to wait or inform them that the **Security Deposit Refund** will be processed by the Store Admin shortly.</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-left">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-medium">Security deposit clearance is restricted to Admin roles for statutory compliance and safety. This ride is now pending Admin settlement.</p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!settlementPromptBookingId} 
        onClose={() => setSettlementPromptBookingId(null)} 
        title="Security Deposit Clearance"
        confirmLabel="Refund & Settle"
        onConfirm={() => {
          if (settlementPromptBookingId) {
            onMarkSettled(settlementPromptBookingId);
            setSettlementPromptBookingId(null);
          }
        }}
      >
        {settlementPromptBookingId && (() => {
          const booking = state.bookings.find(b => b.id === settlementPromptBookingId);
          const cust = state.customers.find(c => c.id === booking?.customerId);
          const pay = booking ? getPaymentStatus(booking) : null;
          
          return (
            <div className="space-y-6">
              <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl text-center">
                 <ShieldCheck size={48} className="text-emerald-600 mx-auto mb-3" />
                 <h4 className="text-xl font-black text-emerald-900">Return Successful</h4>
                 <p className="text-xs text-emerald-700 mt-1 font-medium">Clear the security deposit for <strong>{cust?.name}</strong></p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 divide-y divide-slate-200">
                 <div className="flex justify-between py-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initial Deposit</span>
                    <span className="font-black text-slate-900">₹{pay?.depositAmount}</span>
                 </div>
                 <div className="flex justify-between py-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspection Fines</span>
                    <span className="font-black text-rose-600">₹{pay?.finesAmount || 0}</span>
                 </div>
                 {pay?.extensionFines > 0 && (
                   <div className="flex justify-between py-3">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1"><Timer size={10}/> Extension ({pay.overdueDays}d)</span>
                      <span className="font-black text-amber-600">₹{pay.extensionFines}</span>
                   </div>
                 )}
                 <div className="flex justify-between py-4 items-center">
                    <span className="text-sm font-black text-[#0891b2] uppercase tracking-widest">Refund Amount</span>
                    <div className="text-right">
                       <p className="text-2xl font-black text-[#0891b2]">₹{Math.abs(pay?.balance || 0)}</p>
                    </div>
                 </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                 <p className="text-[10px] text-amber-800 font-medium italic">Clearing this will refund the remaining deposit and mark the lifecycle as SETTLED. Ensure cash/online refund is physically processed.</p>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={isChecklistOpen} onClose={() => { setIsChecklistOpen(false); setChecklistTarget(null); }} title={checklistTarget?.type === 'pause' ? 'Pause Requisition (Inspection)' : 'Return Protocol'} confirmLabel={checklistTarget?.type === 'pause' ? 'Confirm Pause & Delink' : 'Confirm Return'} onConfirm={handleReturnChecklistSubmit}>
         <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-2xl text-white">
               <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inspection Fine</p>
                    <p className="text-2xl font-black text-[#00eaff]">₹{checklistFineTotal}</p>
                  </div>
                  <ClipboardCheck size={28} className="text-slate-700" />
               </div>
               {checklistTarget && (() => {
                 const booking = state.bookings.find(b => b.id === checklistTarget.id);
                 const pay = booking ? getPaymentStatus(booking) : null;
                 const deposit = Number(booking?.depositAmount || 0);
                 const balance = deposit - checklistFineTotal - (pay?.extensionFines || 0);
                 return (
                   <div className="space-y-1.5 pt-3 border-t border-slate-800 text-[10px]">
                      <div className="flex justify-between"><span>Deposit Balance</span><span>₹{deposit}</span></div>
                      {pay?.extensionFines > 0 && <div className="flex justify-between text-amber-400"><span>Extension Fine</span><span>₹{pay.extensionFines}</span></div>}
                      <div className="flex justify-between font-black pt-2 mt-1 border-t border-slate-700">
                        <span>{balance >= 0 ? 'Refundable' : 'Payable'}</span>
                        <span className={balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>₹{Math.abs(balance)}</span>
                      </div>
                   </div>
                 );
               })()}
            </div>
            {checklistTarget?.type === 'pause' && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                 <AlertTriangle size={18} className="text-amber-600" />
                 <p className="text-[10px] text-amber-800 font-medium leading-tight italic">Warning: Assets will be delinked and returned to IDLE inventory. Rider must re-dispatch for resume.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto scrollbar-hide pr-1">
               {CHECKLIST_ITEMS.map(item => (
                 <button key={item.id} onClick={() => toggleChecklistItem(item.id)} className={`p-2.5 rounded-xl border-2 text-left transition-all relative ${selectedChecklistIds.has(item.id) ? 'border-rose-400 bg-rose-50' : 'border-slate-50 bg-slate-50'}`}>
                    <p className={`text-[8px] font-black uppercase tracking-tight truncate ${selectedChecklistIds.has(item.id) ? 'text-rose-700' : 'text-gray-400'}`}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-800">₹{item.fine}</p>
                 </button>
               ))}
            </div>
         </div>
      </Modal>

      {/* Resume/Re-assign Modal */}
      <Modal 
        isOpen={!!isResumingId} 
        onClose={() => { setIsResumingId(null); setSelectedVehId(''); setSelectedBatteryId(''); }} 
        title="Resume Ride: Assign Assets" 
        confirmLabel="Resume Ride" 
        onConfirm={handleResumeBooking}
      >
        <div className="space-y-6">
           <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <RefreshCcw size={20} className="text-emerald-600 animate-spin-slow" />
              <div>
                 <p className="text-xs font-black text-emerald-900 uppercase">Resuming Lifecycle</p>
                 <p className="text-[10px] text-emerald-700 font-medium">Please assign a new scooter and battery to release the rider.</p>
              </div>
           </div>

           <div className="space-y-4">
              <StatusInput 
                label="Assign New Scooter" 
                value={selectedVehId} 
                onChange={setSelectedVehId} 
                options={[
                  { value: "", label: "-- Select Available Scooter --" },
                  ...availableVehicles.map(v => ({ value: v.id, label: v.plateNumber }))
                ]} 
              />
              <StatusInput 
                label="Assign New Battery" 
                value={selectedBatteryId} 
                onChange={setSelectedBatteryId} 
                options={[
                  { value: "", label: "-- Select Available Battery --" },
                  ...availableBatteries.map(b => ({ value: b.id, label: b.serialNumber }))
                ]} 
              />
           </div>

           <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                 <ShieldCheck size={16} className="text-[#00eaff]" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest">System Check</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Resuming will mark the assets as IN USE and restore the ride to ACTIVE status. Ensure physical handover is completed.</p>
           </div>
        </div>
      </Modal>

      <Modal isOpen={!!swapType} onClose={resetSwapState} title="Asset Swap">
        <div className="space-y-4">
           {swapStep === 'select' ? (
             <>
               {swapBookingId && (() => {
                  const b = state.bookings.find(x => x.id === swapBookingId);
                  const oldAsset = swapType === 'vehicle' ? state.vehicles.find(v => v.id === b?.vehicleId)?.plateNumber : state.batteries.find(bat => bat.id === b?.batteryId)?.serialNumber;
                  return <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl"><p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Replacing Asset</p><p className="text-base font-black text-amber-900">{oldAsset || 'None'}</p></div>;
               })()}
               <StatusInput 
                 label={`Available ${swapType}`} 
                 value={newAssetId} 
                 onChange={setNewAssetId} 
                 options={[
                   { value: "", label: "-- Choose Asset --" }, 
                   ...(swapType === 'vehicle' ? availableVehicles.map(v => ({ value: v.id, label: v.plateNumber })) : availableBatteries.map(b => ({ value: b.id, label: b.serialNumber })))
                 ]} 
               />
               <span className="text-xs text-slate-400 italic">Only available assets in current store are listed.</span>
               <TextArea label="Reason" value={swapReason} onChange={setSwapReason} placeholder="Maintenance, puncture, etc." />
               <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button onClick={handleSwapConfirm} className="px-6 py-2 bg-[#00eaff] text-black text-xs font-black rounded-xl active:scale-95 transition-all">Next</button>
               </div>
             </>
           ) : (
             <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="p-4 bg-slate-900 rounded-2xl text-white mb-4">
                   <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inspection Fine</p>
                        <p className="text-xl font-black text-[#00eaff]">₹{checklistFineTotal}</p>
                      </div>
                      <Wrench size={24} className="text-slate-600" />
                   </div>
                   {swapBookingId && (() => {
                     const b = state.bookings.find(x => x.id === swapBookingId);
                     const s = b ? getPaymentStatus(b) : null;
                     const threshold = s?.thresholdRatio || 0.5;
                     
                     // Include checklist fine in current evaluation
                     const totalCostWithSwap = (s?.totalDue || 0) + checklistFineTotal;
                     const minNeeded = totalCostWithSwap * threshold;
                     const currentPaid = s?.paid || 0;
                     const below = currentPaid < minNeeded;
                     
                     return (
                        <div className={`mt-3 p-3 rounded-xl border text-[10px] font-medium flex items-center justify-between ${below ? 'bg-rose-500/20 border-rose-500' : 'bg-white/10 border-white/10'}`}>
                           <div className="flex items-center gap-2">
                              {below ? <Ban size={12} /> : <CheckCircle size={12} />}
                              <span>{below ? 'Threshold Breach (Will Pause)' : 'Threshold Safe (Stay Active)'}</span>
                           </div>
                           <span className="font-black">Limit ({Math.round(threshold * 100)}%): ₹{Math.ceil(minNeeded)}</span>
                        </div>
                     );
                   })()}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto scrollbar-hide">
                   {CHECKLIST_ITEMS.map(item => (
                     <button key={item.id} onClick={() => toggleChecklistItem(item.id)} className={`p-2 rounded-xl border-2 text-left relative ${selectedChecklistIds.has(item.id) ? 'border-rose-400 bg-rose-50' : 'border-slate-50 bg-slate-50'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-tight ${selectedChecklistIds.has(item.id) ? 'text-rose-700' : 'text-gray-400'}`}>{item.label}</p>
                        <p className="text-[10px] font-bold text-slate-800">₹{item.fine}</p>
                     </button>
                   ))}
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                  <button onClick={() => setSwapStep('select')} className="text-xs font-bold text-slate-400 active:scale-95 transition-all">Back</button>
                  <button onClick={executeVehicleSwap} className="px-6 py-2 bg-[#00eaff] text-black text-xs font-black rounded-xl active:scale-95 transition-all">Confirm Swap</button>
                </div>
             </div>
           )}
        </div>
      </Modal>

      <Modal 
        isOpen={!!paymentBookingId} 
        onClose={() => setPaymentBookingId(null)} 
        title="Collection Entry" 
        confirmLabel="Confirm Payment" 
        onConfirm={() => { 
          if (paymentBookingId && (parseFloat(paymentCash) || parseFloat(paymentOnline))) { 
            onRecordPayment(paymentBookingId, totalPaymentEntered); 
            setPaymentBookingId(null); 
          } 
        }}
      >
        <div className="space-y-4">
           {paymentBookingId && (() => {
             const b = state.bookings.find(x => x.id === paymentBookingId);
             const s = b ? getPaymentStatus(b) : null;
             const isWeekly = b?.rentalPlan === RentalPlan.WEEKLY;
             return (
               <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                 <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Coverage Status ({b?.rentalPlan})</p>
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xl font-black text-blue-900">₹{s?.balance} Outstanding</p>
                      <p className="text-[9px] text-blue-600 font-bold uppercase mt-0.5">Required for dispatch: ₹{Math.max(0, Math.ceil((s?.minToStart || 0) - (s?.paid || 0)))}</p>
                    </div>
                    <Badge variant={s?.canStart ? 'success' : 'warning'}>{Math.round(s?.coveragePct || 0)}% Paid</Badge>
                 </div>
                 {isWeekly && (
                    <div className="mt-2 text-[8px] font-black text-blue-500 uppercase flex items-center gap-1">
                       <Info size={10} /> Note: Weekly plans require full 100% payment for ride release.
                    </div>
                 )}
                 {s && s.extensionFines > 0 && (
                   <div className="mt-2 p-2 bg-amber-100/50 rounded-lg flex items-center justify-between border border-amber-200">
                      <span className="text-[9px] font-black text-amber-700 uppercase flex items-center gap-1"><Timer size={10}/> Extension Dues</span>
                      <span className="text-[10px] font-black text-amber-900">₹{s.extensionFines}</span>
                   </div>
                 )}
               </div>
             );
           })()}
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Banknote size={10} /> Cash (₹)
                </label>
                <input 
                  type="number" 
                  autoFocus 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black outline-none focus:border-[#00eaff]" 
                  value={paymentCash} 
                  onChange={e => setPaymentCash(e.target.value)} 
                  placeholder="0" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Smartphone size={10} /> Online (₹)
                </label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black outline-none focus:border-[#00eaff]" 
                  value={paymentOnline} 
                  onChange={e => setPaymentOnline(e.target.value)} 
                  placeholder="0" 
                />
              </div>
           </div>
           <div className="pt-2 flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collection</span>
              <span className="text-xl font-black text-emerald-600">₹{totalPaymentEntered}</span>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isCreating} 
        onClose={() => { setIsCreating(false); setSelectedCustId(''); }} 
        title="Book Ride" 
        confirmLabel="Register Booking" 
        onConfirm={handleCreateBooking}
      >
         <div className="space-y-5">
            <StatusInput 
              label="Select Rider" 
              value={selectedCustId} 
              onChange={setSelectedCustId} 
              options={[
                { value: "", label: "-- Select Existing Rider --" },
                ...storeCustomers.filter(c => !isCustomerAlreadyBooked(c.id)).map(c => ({ value: c.id, label: c.name }))
              ]} 
            />
            <div className="grid grid-cols-2 gap-2">
               <StatusInput 
                label="Scooter" 
                value={selectedVehId} 
                onChange={setSelectedVehId} 
                options={[
                  { value: "", label: "-- Scooter --" },
                  ...availableVehicles.map(v => ({ value: v.id, label: v.plateNumber }))
                ]} 
              />
               <StatusInput 
                label="Battery" 
                value={selectedBatteryId} 
                onChange={setSelectedBatteryId} 
                options={[
                  { value: "", label: "-- Battery --" },
                  ...availableBatteries.map(b => ({ value: b.id, label: b.serialNumber }))
                ]} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#00eaff]" 
                    value={selectedStartDate} 
                    onChange={e => setSelectedStartDate(e.target.value)} 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Expected End Date</label>
                  <div className="w-full p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-blue-900 flex items-center gap-2">
                     <CalendarCheck size={14} className="text-blue-500" />
                     {calculatedEndDate ? new Date(calculatedEndDate).toLocaleDateString('en-IN') : '--'}
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Subscription Plan</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSelectedPlan(RentalPlan.WEEKLY)} className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${selectedPlan === RentalPlan.WEEKLY ? 'bg-[#00eaff]/10 border-[#00eaff] text-[#0891b2]' : 'bg-white border-slate-100 text-slate-400'}`}>Weekly</button>
                <button type="button" onClick={() => setSelectedPlan(RentalPlan.MONTHLY)} className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${selectedPlan === RentalPlan.MONTHLY ? 'bg-[#00eaff]/10 border-[#00eaff] text-[#0891b2]' : 'bg-white border-slate-100 text-slate-400'}`}>Monthly</button>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
               <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <Receipt size={16} className="text-[#00eaff]" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Revenue Protection</h4>
               </div>
               <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Rent ({selectedPlan})</span>
                    <span className="font-bold text-white">₹{priceBreakup.base}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST ({state.rentalRates.gstPercentage}%)</span>
                    <span className="font-bold text-white">₹{priceBreakup.gst}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#00eaff]">₹{priceBreakup.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Security Deposit</span>
                    <span className="font-bold text-white">₹{priceBreakup.deposit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/20">
                    <span className="text-xs font-black uppercase tracking-widest text-[#00eaff]">
                      Dispatch Limit ({selectedPlan === RentalPlan.WEEKLY ? '100%' : '50%'})
                    </span>
                    <span className="text-lg font-black">
                      ₹{Math.ceil(priceBreakup.total * (selectedPlan === RentalPlan.WEEKLY ? 1.0 : 0.5))}
                    </span>
                  </div>
               </div>
            </div>
         </div>
      </Modal>

      <CustomerOnboardingWizard 
        isOpen={isOnboarding}
        onClose={() => setIsOnboarding(false)}
        onSubmit={onOnboardCustomer}
      />
    </div>
  );
};

const KPIBox = ({ label, value, icon, color, bg, footer, onClick }: { label: string, value: number | string, icon: React.ReactNode, color: string, bg: string, footer?: string, onClick?: () => void }) => (
   <div 
    onClick={onClick}
    className={`p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[180px] bg-white group hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.98] hover:border-[#00eaff]/40' : ''}`}
   >
      <div className="flex justify-between items-start">
         <div className={`p-3 rounded-2xl ${bg} ${color}`}>
            {icon}
         </div>
      </div>
      <div>
         <p className={`text-4xl font-black ${color}`}>{value}</p>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{label}</p>
      </div>
      {footer && (
         <div className="mt-2 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{footer}</span>
         </div>
      )}
   </div>
);

const FleetStat = ({ label, count, color, bg }: { label: string, count: number | string, color: string, bg: string }) => (
  <div className={`p-4 lg:p-6 ${bg} rounded-2xl lg:rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden group min-h-[120px]`}>
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
      <Eye size={12} className={color} />
    </div>
    <p className={`font-black ${color} ${typeof count === 'string' && count.length > 10 ? 'text-sm lg:text-lg' : 'text-xl lg:text-3xl'} leading-tight`}>
      {count}
    </p>
    <p className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">{label}</p>
  </div>
);

export default OperatorPortal;
