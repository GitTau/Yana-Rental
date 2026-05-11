
import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Battery as BatteryIcon, 
  BookOpen, 
  Wrench, 
  AlertCircle, 
  Globe, 
  TrendingUp, 
  Clock, 
  IndianRupee, 
  PauseCircle, 
  PlayCircle,
  CalendarDays,
  BarChart3,
  ChevronRight,
  ArrowRight,
  User,
  Zap,
  Receipt,
  History,
  Activity,
  ShieldCheck,
  RefreshCcw,
  Users
} from 'lucide-react';
import { YanaState, VehicleStatus, BatteryStatus, BookingStatus } from '../types';
import { Card, Badge, Modal } from '../components/Common';

const Dashboard: React.FC<{ state: YanaState }> = ({ state }) => {
  const [daysLookback, setDaysLookback] = useState(30);
  const [drillDownCategory, setDrillDownCategory] = useState<'live' | 'paused' | 'revenue' | 'security' | null>(null);
  const [logTimeframe, setLogTimeframe] = useState<'today' | 'week'>('today');
  const isGlobal = state.activeStoreId === 'all';
  
  const filteredVehicles = isGlobal ? state.vehicles : state.vehicles.filter(v => v.storeId === state.activeStoreId);
  const filteredBatteries = isGlobal ? state.batteries : state.batteries.filter(b => b.storeId === state.activeStoreId);
  const globalBookings = isGlobal ? state.bookings : state.bookings.filter(b => b.storeId === state.activeStoreId);
  
  const now = Date.now();
  const lookbackMs = daysLookback * 24 * 60 * 60 * 1000;
  const cutOffTime = now - lookbackMs;

  // 1. Static Overview Metrics
  const availableVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
  const inUseVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.IN_USE).length;
  const maintenanceVehicles = filteredVehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const availableBatteries = filteredBatteries.filter(b => b.status === BatteryStatus.AVAILABLE).length;

  // 2. Dynamic Performance Analyzer Logic
  const analyzerMetrics = useMemo(() => {
    // Filter bookings created within the lookback window
    const windowBookings = globalBookings.filter(b => b.createdAt >= cutOffTime);

    const liveBookings = windowBookings.filter(b => b.status === BookingStatus.ACTIVE).length;
    const pausedBookings = windowBookings.filter(b => b.status === BookingStatus.PAUSED).length;
    const totalRevenue = windowBookings.reduce((sum, b) => {
      const paid = Number(b.amountPaid || 0);
      const deposit = Number(b.depositAmount || 0);
      const depositCollected = Math.min(paid, deposit);
      const rentalCollected = paid - depositCollected;
      return sum + rentalCollected;
    }, 0);

    const totalSecurityDeposits = globalBookings.filter(b => [BookingStatus.ACTIVE, BookingStatus.PAUSED, BookingStatus.PENDING].includes(b.status)).reduce((sum, b) => {
      const paid = Number(b.amountPaid || 0);
      const deposit = Number(b.depositAmount || 0);
      const depositCollected = Math.min(paid, deposit);
      return sum + depositCollected;
    }, 0);

    const depositingRidersCount = new Set(globalBookings.filter(b => Math.min(Number(b.amountPaid || 0), Number(b.depositAmount || 0)) > 0).map(b => b.customerId)).size;
    const refundedRidersCount = new Set(globalBookings.filter(b => b.status === BookingStatus.COMPLETED && b.isSettled && Math.min(Number(b.amountPaid || 0), Number(b.depositAmount || 0)) > 0).map(b => b.customerId)).size;
    const riderChurnPercentage = depositingRidersCount === 0 ? 0 : (refundedRidersCount / depositingRidersCount) * 100;

    const activeRidersInWindowCount = new Set(globalBookings.filter(b => {
      const inWindow = b.createdAt >= cutOffTime || (b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED) || (b.completedAt && b.completedAt >= cutOffTime);
      const paid = Number(b.amountPaid || 0);
      const deposit = Number(b.depositAmount || 0);
      const rentalCollected = paid - Math.min(paid, deposit);
      return inWindow && rentalCollected > 0;
    }).map(b => b.customerId)).size;

    return { 
      liveBookings, 
      pausedBookings, 
      totalRevenue, 
      totalSecurityDeposits, 
      totalInWindow: windowBookings.length, 
      windowBookings,
      riderChurnPercentage,
      activeRidersInWindowCount
    };
  }, [globalBookings, daysLookback, cutOffTime]);

  // 3. Drill Down Data
  const drillDownList = useMemo(() => {
    if (!drillDownCategory) return [];
    
    const baseList = analyzerMetrics.windowBookings;
    
    switch (drillDownCategory) {
      case 'live':
        return baseList.filter(b => b.status === BookingStatus.ACTIVE);
      case 'paused':
        return baseList.filter(b => b.status === BookingStatus.PAUSED);
      case 'revenue':
        return baseList.filter(b => {
          const paid = Number(b.amountPaid || 0);
          const deposit = Number(b.depositAmount || 0);
          const depositCollected = Math.min(paid, deposit);
          const rentalCollected = paid - depositCollected;
          return rentalCollected > 0;
        });
      case 'security':
        return globalBookings.filter(b => {
          if (![BookingStatus.ACTIVE, BookingStatus.PAUSED, BookingStatus.PENDING].includes(b.status)) return false;
          const paid = Number(b.amountPaid || 0);
          const deposit = Number(b.depositAmount || 0);
          const depositCollected = Math.min(paid, deposit);
          return depositCollected > 0;
        });
      default:
        return [];
    }
  }, [drillDownCategory, analyzerMetrics]);

  // 4. Overdue Logic with Extension Fine (₹300/day)
  const overdueStats = useMemo(() => {
    const overdueBookings = globalBookings.filter(b => 
      [BookingStatus.ACTIVE, BookingStatus.PAUSED].includes(b.status) && 
      b.expectedEndDate && b.expectedEndDate < now
    );
    
    const totalDaysForFine = overdueBookings.reduce((sum, b) => {
      const diff = now - (b.expectedEndDate || now);
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      // 1 day grace period: if days late is 1, fine is 0. If 2 or more, fine is days * 300.
      return sum + (days > 1 ? days : 0);
    }, 0);

    return {
      count: overdueBookings.length,
      days: totalDaysForFine,
      projectedFine: totalDaysForFine * 300
    };
  }, [globalBookings, now]);

  const alerts = [];
  if (availableVehicles === 0) alerts.push(isGlobal ? "System-wide inventory depletion!" : "No vehicles available for booking.");
  if (availableBatteries < (isGlobal ? 10 : 3)) alerts.push(isGlobal ? "Global spare battery stock critically low." : "Low available battery stock.");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            {isGlobal && <Globe className="text-[#00eaff]" />}
            {isGlobal ? 'Enterprise Dashboard' : 'Store Intelligence'}
          </h2>
          <p className="text-gray-500 font-medium">
            {isGlobal ? 'Real-time telemetry from the global YANA network.' : 'Operational performance for the current Zap Point.'}
          </p>
        </div>
        {isGlobal && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Network Live</span>
          </div>
        )}
      </div>

      {/* --- PERFORMANCE ANALYZER --- */}
      <section className="bg-slate-900 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-[#00eaff]" />
                    <h3 className="text-[#00eaff] text-[10px] font-black uppercase tracking-[0.3em]">Performance Analyzer</h3>
                 </div>
                 <h4 className="text-white text-2xl font-black tracking-tight">Financial & Dispatch Velocity</h4>
              </div>

              <div className="flex-1 max-w-md bg-white/5 border border-white/10 p-4 lg:p-6 rounded-3xl backdrop-blur-md">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <CalendarDays size={14} /> Time Horizon
                    </span>
                    <Badge variant="info" className="bg-[#00eaff]/20 text-[#00eaff] border-[#00eaff]/30">
                       Last {daysLookback} Days
                    </Badge>
                 </div>
                 <input 
                   type="range" 
                   min="1" 
                   max="365" 
                   value={daysLookback} 
                   onChange={(e) => setDaysLookback(parseInt(e.target.value))}
                   className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00eaff]"
                 />
                 <div className="flex justify-between mt-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                    <span>24 Hours</span>
                    <span>180 Days</span>
                    <span>1 Year</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyzerStat 
                label="Live Dispatch" 
                value={analyzerMetrics.liveBookings} 
                icon={<PlayCircle size={24} />} 
                color="text-[#00eaff]" 
                desc="Active on-ride sessions"
                onClick={() => setDrillDownCategory('live')}
              />
              <AnalyzerStat 
                label="Paused Requisitions" 
                value={analyzerMetrics.pausedBookings} 
                icon={<PauseCircle size={24} />} 
                color="text-amber-400" 
                desc="Assets currently standby"
                onClick={() => setDrillDownCategory('paused')}
              />
              <AnalyzerStat 
                label="Revenue Realized" 
                value={`₹${analyzerMetrics.totalRevenue.toLocaleString()}`} 
                icon={<IndianRupee size={24} />} 
                color="text-emerald-400" 
                desc="Cash collected in window"
                onClick={() => setDrillDownCategory('revenue')}
              />
              <AnalyzerStat 
                label="Security Deposits Held" 
                value={`₹${analyzerMetrics.totalSecurityDeposits.toLocaleString()}`} 
                icon={<ShieldCheck size={24} />} 
                color="text-blue-400" 
                desc="Deposits currently held"
                onClick={() => setDrillDownCategory('security')}
              />
           </div>

           {/* Efficiency & Utilization Metrics */}
           {(() => {
              const vehicleUtilization = filteredVehicles.length === 0 ? 0 : (filteredVehicles.filter(v => v.status === VehicleStatus.IN_USE).length / filteredVehicles.length) * 100;
              const activeRidersUtilization = filteredVehicles.length === 0 ? 0 : (analyzerMetrics.activeRidersInWindowCount / filteredVehicles.length) * 100;
              
              const vehiclesOutOnRoad = filteredVehicles.filter(v => v.status === VehicleStatus.IN_USE).length;
              const dailyAvgRevenue = analyzerMetrics.totalRevenue / daysLookback;
              const avgDailyRevPerVehicle = filteredVehicles.length === 0 ? 0 : dailyAvgRevenue / filteredVehicles.length;
              const vehicleUtilizationRatio = filteredVehicles.length === 0 ? 0 : vehiclesOutOnRoad / filteredVehicles.length;
              const revenueCollectionEfficiency = vehicleUtilizationRatio === 0 ? 0 : (avgDailyRevPerVehicle / (vehicleUtilizationRatio * 200)) * 100;

              return (
                 <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalyzerStat 
                       label="Vehicle Utilization" 
                       value={`${isFinite(vehicleUtilization) ? vehicleUtilization.toFixed(1) : 0}%`} 
                       icon={<Activity size={24} />} 
                       color={vehicleUtilization >= 100 ? "text-emerald-400" : vehicleUtilization >= 70 ? "text-[#00eaff]" : "text-amber-400"} 
                       desc="Deployed vs Total Fleet"
                    />
                    <AnalyzerStat 
                       label="Rev. Collection Efficiency" 
                       value={`${isFinite(revenueCollectionEfficiency) ? revenueCollectionEfficiency.toFixed(1) : 0}%`} 
                       icon={<Receipt size={24} />} 
                       color={revenueCollectionEfficiency >= 100 ? "text-emerald-400" : "text-amber-400"} 
                       desc="vs. target ₹200/day per active"
                    />
                    <AnalyzerStat 
                       label={`${daysLookback <= 7 ? 'Weekly' : daysLookback <= 30 ? 'Monthly' : 'Period'} Active Riders`} 
                       value={`${isFinite(activeRidersUtilization) ? activeRidersUtilization.toFixed(1) : 0}%`} 
                       icon={<Users size={24} />} 
                       color={activeRidersUtilization >= 100 ? "text-emerald-400" : "text-amber-400"} 
                       desc="Paying distinct users / Fleet"
                    />
                    <AnalyzerStat 
                       label="Rider Churn Rate" 
                       value={`${isFinite(analyzerMetrics.riderChurnPercentage) ? analyzerMetrics.riderChurnPercentage.toFixed(1) : 0}%`} 
                       icon={<RefreshCcw size={24} />} 
                       color={analyzerMetrics.riderChurnPercentage > 20 ? "text-rose-400" : "text-emerald-400"} 
                       desc="Refunded / Total Deposited"
                    />
                 </div>
              );
           })()}
        </div>

        {/* Background Visuals */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <BarChart3 size={200} className="text-white" />
        </div>
      </section>

      {/* Drill Down Modal */}
      <Modal 
        isOpen={!!drillDownCategory} 
        onClose={() => setDrillDownCategory(null)} 
        title={
          drillDownCategory === 'live' ? 'Live Dispatch Registry' :
          drillDownCategory === 'paused' ? 'Paused Requisitions Log' :
          drillDownCategory === 'security' ? 'Security Deposits Ledger' :
          'Revenue Collection Ledger'
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
           <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 Horizon: Last {daysLookback} Days
              </p>
              <Badge variant="neutral">{drillDownList.length} Records</Badge>
           </div>
           
           {drillDownList.length > 0 ? (
             drillDownList.map(b => {
                const customer = state.customers.find(c => c.id === b.customerId);
                const vehicle = state.vehicles.find(v => v.id === b.vehicleId);
                const store = state.stores.find(s => s.id === b.storeId);
                
                return (
                  <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-white transition-all group">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          drillDownCategory === 'revenue' ? 'bg-emerald-50 text-emerald-600' :
                          drillDownCategory === 'paused' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                           {customer?.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{customer?.name}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                              {isGlobal && <span>{store?.name.split(' ')[2]} •</span>}
                              {drillDownCategory === 'revenue' ? `Ref: ${b.id.split('-')[1]}` : (vehicle?.plateNumber || 'No Asset')}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        {drillDownCategory === 'revenue' ? (() => {
                          const paid = Number(b.amountPaid || 0);
                          const deposit = Number(b.depositAmount || 0);
                          const depositCollected = Math.min(paid, deposit);
                          const rentalCollected = paid - depositCollected;
                          return (
                            <div className="flex flex-col items-end">
                               <p className="text-sm font-black text-emerald-600">₹{rentalCollected}</p>
                               <p className="text-[8px] text-slate-400 font-bold">{new Date(b.createdAt).toLocaleDateString()}</p>
                            </div>
                          );
                        })() : drillDownCategory === 'security' ? (() => {
                          const paid = Number(b.amountPaid || 0);
                          const deposit = Number(b.depositAmount || 0);
                          const depositCollected = Math.min(paid, deposit);
                          return (
                            <div className="flex flex-col items-end">
                               <p className="text-sm font-black text-blue-600">₹{depositCollected}</p>
                               <p className="text-[8px] text-slate-400 font-bold">{new Date(b.createdAt).toLocaleDateString()}</p>
                            </div>
                          );
                        })() : (
                          <div className="flex items-center gap-1.5">
                             <Clock size={10} className="text-slate-300" />
                             <span className="text-[9px] font-black text-slate-500 uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                     </div>
                  </div>
                );
             })
           ) : (
             <div className="py-12 text-center">
                <AlertCircle size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No records found for this period.</p>
             </div>
           )}
        </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
           <Card title="Revenue Recovery Status" className="border-slate-200 overflow-hidden">
             <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between h-[200px] ${overdueStats.count > 0 ? 'border-rose-400 bg-rose-50' : 'border-slate-100 bg-white'}`}>
                <div className="flex justify-between items-start">
                   <div className={`p-3 rounded-2xl ${overdueStats.count > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                      <History size={24} />
                   </div>
                   <Badge variant={overdueStats.count > 0 ? 'error' : 'neutral'}>Extension Penalties</Badge>
                </div>
                <div>
                   <p className={`text-4xl font-black ${overdueStats.count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>₹{overdueStats.projectedFine.toLocaleString()}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Fine Receivable ({overdueStats.days} Days)</p>
                </div>
                {overdueStats.count > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 bg-rose-600/10 px-2 py-1 rounded-lg w-fit">
                     <AlertCircle size={12} className="text-rose-600" />
                     <span className="text-[9px] font-black text-rose-700 uppercase">Impact: {overdueStats.count} Rides Delayed</span>
                  </div>
                )}
             </div>
           </Card>

           <Card title="Operational Alerts" className="border-slate-200">
             {alerts.length > 0 ? (
               <div className="space-y-4">
                 {alerts.map((alert, idx) => (
                   <div key={idx} className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                     <AlertCircle size={20} className="text-rose-600 shrink-0" />
                     <p className="text-sm font-bold text-rose-800 leading-tight">{alert}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">Network Nominal</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">All Zap Points operating within specs</p>
               </div>
             )}
           </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard icon={<Truck className="text-blue-600" />} label="Fleet Ready" value={availableVehicles} color="blue" />
              <StatCard icon={<BatteryIcon className="text-emerald-600" />} label="Power Inventory" value={availableBatteries} color="emerald" />
              <StatCard icon={<BookOpen className="text-indigo-600" />} label="Master Records" value={globalBookings.length} color="indigo" />
              <StatCard icon={<Wrench className="text-amber-600" />} label="Service Queue" value={maintenanceVehicles} color="amber" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Fleet Status Mix" subtitle="Inventory health distribution" className="border-slate-200">
                <div className="space-y-6 py-2">
                   <UsageRow label="Ready to Rent" count={availableVehicles} total={filteredVehicles.length} color="bg-emerald-500" />
                   <UsageRow label="Generating Revenue" count={inUseVehicles} total={filteredVehicles.length} color="bg-[#00eaff]" />
                   <UsageRow label="Grounded / Maintenance" count={maintenanceVehicles} total={filteredVehicles.length} color="bg-amber-500" />
                   <UsageRow label="System Offline" count={filteredVehicles.length - availableVehicles - inUseVehicles - maintenanceVehicles} total={filteredVehicles.length} color="bg-slate-300" />
                </div>
              </Card>

              <Card title="Live Network Activity" className="border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setLogTimeframe('today')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${logTimeframe === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setLogTimeframe('week')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${logTimeframe === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      This Week
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const startOfToday = new Date(new Date().setHours(0,0,0,0)).getTime();
                    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
                    
                    const filteredLogs = state.logs
                      .filter(l => isGlobal || l.storeId === state.activeStoreId)
                      .filter(l => {
                        if (logTimeframe === 'today') return l.timestamp >= startOfToday;
                        if (logTimeframe === 'week') return l.timestamp >= startOfWeek;
                        return true;
                      })
                      .sort((a, b) => b.timestamp - a.timestamp);

                    if (filteredLogs.length === 0) {
                      return <div className="text-center py-8 text-slate-400 text-xs font-bold">No activity recorded for this timeframe.</div>;
                    }

                    return filteredLogs.map((log, index) => {
                      const logStore = state.stores.find(s => s.id === log.storeId);
                      const logDate = new Date(log.timestamp);
                      const isRecent = index === 0 && logTimeframe === 'today';
                      
                      return (
                        <div key={log.id} className={`p-3 rounded-2xl border flex gap-3 items-start transition-all group ${isRecent ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isRecent ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                            <Activity size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-xs font-bold truncate pr-2 ${isRecent ? 'text-blue-900' : 'text-slate-900'}`}>{log.message}</p>
                              <div className="text-right shrink-0">
                                <p className={`text-[9px] font-black uppercase tracking-tighter ${isRecent ? 'text-blue-500' : 'text-slate-400'}`}>{logDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                {logTimeframe === 'week' && <p className={`text-[9px] font-black uppercase tracking-tighter ${isRecent ? 'text-blue-400' : 'text-slate-400'}`}>{logDate.toLocaleDateString([], {month: 'short', day: 'numeric'})}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {logStore && (
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter truncate max-w-[100px] ${isRecent ? 'bg-blue-200 text-blue-800' : 'bg-slate-900 text-[#00eaff]'}`}>
                                  {logStore.name.replace('YANA Zap Point - ', '')}
                                </span>
                              )}
                              <span className={`text-[9px] italic truncate ${isRecent ? 'text-blue-600/70' : 'text-slate-500'}`}>"{log.reason}"</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

const AnalyzerStat = ({ label, value, icon, color, desc, onClick }: { label: string, value: string | number, icon: React.ReactNode, color: string, desc: string, onClick?: () => void }) => (
   <div 
    onClick={onClick}
    className={`bg-white/5 border border-white/10 p-6 rounded-[2rem] group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${onClick ? 'hover:border-[#00eaff]/30' : ''}`}
   >
      <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 ${color}`}>
         {icon}
      </div>
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
         <div className="flex items-center justify-between">
            <p className={`text-3xl font-black tracking-tighter ${color}`}>{value}</p>
            <ChevronRight size={18} className="text-white/20 group-hover:text-[#00eaff] transition-colors" />
         </div>
         <p className="text-[10px] text-slate-500 mt-2 font-medium">{desc}</p>
      </div>
   </div>
);

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:shadow-lg transition-all group">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">{value}</p>
    </div>
  </div>
);

const UsageRow = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-900">{count} <span className="text-slate-300">/ {total}</span></span>
      </div>
      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default Dashboard;
