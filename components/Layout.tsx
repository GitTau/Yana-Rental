
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Battery as BatteryIcon, 
  Users, 
  BookOpen, 
  Wrench, 
  History, 
  Settings,
  Store as StoreIcon,
  ChevronDown,
  RefreshCcw,
  UserCircle,
  ShieldCheck,
  Globe,
  Wallet,
  Smartphone,
  LogOut
} from 'lucide-react';
import { Store, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  stores: Store[];
  activeStoreId: string;
  onStoreSwitch: (id: string) => void;
  onReset: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  user?: { name: string; email: string; role: string } | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  stores, 
  activeStoreId, 
  onStoreSwitch, 
  onReset,
  currentView,
  setCurrentView,
  currentRole,
  setCurrentRole,
  user,
  onLogout
}) => {
  const activeStore = activeStoreId === 'all' ? { name: 'Global Fleet', location: 'System Wide', state: 'Multiple' } : stores.find(s => s.id === activeStoreId);
  const isAdmin = currentRole === UserRole.ADMIN;

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'booking-history', label: 'Bookings', icon: BookOpen },
    { id: 'fleet', label: 'Fleet Ops', icon: Truck },
    { id: 'batteries', label: 'Batteries', icon: BatteryIcon },
    { id: 'financials', label: 'Settlements', icon: Wallet },
    { id: 'customers', label: 'Rider Registry', icon: Users },
    { id: 'maintenance', label: 'Service', icon: Wrench },
    { id: 'logs', label: 'Audit Trail', icon: History },
    { id: 'admin', label: 'Terminal Config', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar - Desktop Only (Admin) */}
      {isAdmin && (
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
          <div className="p-8">
            <h1 className="text-3xl font-black tracking-tighter text-[#00eaff] italic drop-shadow-sm">YANA</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">
              Enterprise Hub
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-standard ${
                  currentView === item.id 
                    ? 'bg-[#00eaff]/10 text-[#0891b2] border border-[#00eaff]/20 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} />
                <span className="text-xs uppercase tracking-widest font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-100">
             <button 
               onClick={onReset}
               className="w-full flex items-center justify-center space-x-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-standard"
             >
               <RefreshCcw size={12} />
               <span>Reset System</span>
             </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - Mobile Responsive */}
        <header className="h-14 lg:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-[60]">
          <div className="flex items-center space-x-2 lg:space-x-6">
            {!isAdmin && (
               <div className="mr-1 lg:mr-4">
                  <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-[#00eaff] italic">YANA</h1>
               </div>
            )}
            
            <div className="relative group">
              <button className="flex items-center space-x-1 lg:space-x-3 bg-slate-50 hover:bg-slate-100 px-2 lg:px-5 py-1.5 lg:py-2 rounded-full border border-slate-200 transition-standard">
                {activeStoreId === 'all' ? <Globe size={14} className="text-[#00eaff]" /> : <StoreIcon size={14} className="text-[#00eaff]" />}
                <div className="text-left leading-none max-w-[80px] lg:max-w-none truncate">
                  <p className="hidden lg:block text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">Zap Point</p>
                  <p className="text-[10px] lg:text-xs font-black text-slate-900 truncate">{activeStore?.name || 'Loading...'}</p>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 hidden group-focus-within:block z-50 animate-in fade-in zoom-in duration-200">
                {isAdmin && (
                  <button
                    onClick={() => onStoreSwitch('all')}
                    className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-slate-50 flex items-center space-x-3 ${
                      activeStoreId === 'all' ? 'text-[#0891b2] bg-[#00eaff]/5' : 'text-slate-700'
                    }`}
                  >
                    <Globe size={14} />
                    <span>All Stores (Global)</span>
                  </button>
                )}
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => onStoreSwitch(store.id)}
                    className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-slate-50 flex flex-col ${
                      activeStoreId === store.id ? 'text-[#0891b2] bg-[#00eaff]/5' : 'text-slate-700'
                    }`}
                  >
                    <span>{store.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex bg-slate-100 p-0.5 lg:p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => {
                  setCurrentRole(UserRole.OPERATOR);
                  if (activeStoreId === 'all' && stores.length > 0) onStoreSwitch(stores[0].id);
                }}
                className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-5 py-1 lg:py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-standard ${
                  currentRole === UserRole.OPERATOR ? 'bg-white text-[#0891b2] shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCircle size={12} className="lg:size-14" />
                <span>Ops</span>
              </button>
              <button 
                onClick={() => setCurrentRole(UserRole.ADMIN)}
                className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-5 py-1 lg:py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-standard ${
                  currentRole === UserRole.ADMIN ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck size={12} className="lg:size-14" />
                <span>Adm</span>
              </button>
              <button 
                onClick={() => {
                  setCurrentRole(UserRole.RIDER);
                  if (activeStoreId === 'all' && stores.length > 0) onStoreSwitch(stores[0].id);
                }}
                className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-5 py-1 lg:py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-standard ${
                  currentRole === UserRole.RIDER ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone size={12} className="lg:size-14" />
                <span>Rider</span>
              </button>
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 lg:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav Bar - Admin Only */}
        {isAdmin && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 z-[70]">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
              { id: 'booking-history', icon: BookOpen, label: 'Books' },
              { id: 'fleet', icon: Truck, label: 'Fleet' },
              { id: 'financials', icon: Wallet, label: 'Settls' },
              { id: 'admin', icon: Settings, label: 'Cfg' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center space-y-0.5 w-full h-full transition-standard ${
                  currentView === item.id ? 'text-[#0891b2]' : 'text-slate-400'
                }`}
              >
                <item.icon size={18} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                {currentView === item.id && <div className="w-1 h-1 rounded-full bg-[#00eaff]" />}
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
};

export default Layout;
