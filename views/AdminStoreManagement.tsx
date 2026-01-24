import React, { useState, useRef, useMemo } from 'react';
import { 
  Store as StoreIcon, 
  Plus, 
  MapPin, 
  Save, 
  Truck, 
  Zap, 
  Users, 
  ArrowRightLeft,
  ChevronRight,
  Upload,
  FileText,
  AlertCircle,
  AlertTriangle,
  Download,
  CheckCircle2,
  Hash,
  Edit,
  Search,
  Filter,
  X,
  Trash2,
  Percent,
  Target
} from 'lucide-react';
import { YanaState, Store, RentalRates, Vehicle, Battery, Customer, VehicleStatus, BatteryStatus } from '../types';
import { Card, Modal, Badge, StatusInput, TextArea } from '../components/Common';
import { parseCSV } from '../constants';

const AdminStoreManagement: React.FC<{ 
  state: YanaState, 
  onCreate: (s: Omit<Store, 'id'>) => void,
  onUpdateStore?: (id: string, updates: Partial<Store>) => void,
  onDeleteStore?: (id: string) => void,
  onUpdateRates: (rates: RentalRates) => void,
  onMigrate: (type: 'vehicle' | 'battery' | 'customer', id: string, targetStoreId: string) => void,
  onBulkStores: (s: Store[]) => void,
  onBulkVehicles: (v: Vehicle[]) => void,
  onBulkBatteries: (b: Battery[]) => void,
  onBulkCustomers: (c: Customer[]) => void,
  onUpdateVehicle?: (id: string, updates: Partial<Vehicle>, reason: string) => void,
  onUpdateBattery?: (id: string, updates: Partial<Battery>, reason: string) => void,
}> = ({ state, onCreate, onUpdateStore, onDeleteStore, onUpdateRates, onMigrate, onBulkStores, onBulkVehicles, onBulkBatteries, onBulkCustomers, onUpdateVehicle, onUpdateBattery }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  
  // Store Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [stateName, setStateName] = useState('Odisha');
  const [targetRentals, setTargetRentals] = useState(10);

  // Rates State
  const [tempRates, setTempRates] = useState<RentalRates>(state.rentalRates);

  // Migration State
  const [migrationType, setMigrationType] = useState<'vehicle' | 'battery' | 'customer'>('vehicle');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('');

  // Bulk Import State
  const [bulkType, setBulkType] = useState<'store' | 'vehicle' | 'battery' | 'customer'>('vehicle');
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fleet Edit State
  const [fleetTab, setFleetTab] = useState<'vehicle' | 'battery'>('vehicle');
  const [fleetSearch, setFleetSearch] = useState('');
  const [editingAsset, setEditingAsset] = useState<{ id: string, type: 'vehicle' | 'battery' } | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editReason, setEditReason] = useState('');

  const handleSaveRates = () => {
    onUpdateRates(tempRates);
    alert('Rental rates and GST updated successfully!');
  };

  const handleMigrate = () => {
    if (!selectedAssetId || !targetStoreId) return alert('Select both an asset and a target store.');
    onMigrate(migrationType, selectedAssetId, targetStoreId);
    setSelectedAssetId('');
    setTargetStoreId('');
    alert('Asset migration complete.');
  };

  const getAssetsForMigration = () => {
    switch (migrationType) {
      case 'vehicle': return state.vehicles;
      case 'battery': return state.batteries;
      case 'customer': return state.customers;
    }
  };

  const filteredFleet = useMemo(() => {
    const list = fleetTab === 'vehicle' ? state.vehicles : state.batteries;
    if (!fleetSearch) return list;
    const q = fleetSearch.toLowerCase();
    return list.filter(item => {
      const idStr = item.id.toLowerCase();
      const refStr = (item as any).plateNumber?.toLowerCase() || (item as any).serialNumber?.toLowerCase() || '';
      return idStr.includes(q) || refStr.includes(q);
    });
  }, [fleetTab, fleetSearch, state.vehicles, state.batteries]);

  const getCSVTemplate = () => {
    const storeId = state.stores[0]?.id || 's1';
    switch (bulkType) {
      case 'store':
        return `id,name,location,state,targetRentals\ns_north,ZAP POINT NORTH,"Janpath Rd, Unit 4",Odisha,20\ns_south,ZAP POINT SOUTH,"BTM Layout, 2nd Stage",Karnataka,25`;
      case 'vehicle':
        return `id,plateNumber,status,storeId\nv101,YEV101,Available,${storeId}\nv102,YEV102,Available,${storeId}`;
      case 'battery':
        return `id,serialNumber,status,storeId\nb201,BAT-S-001,Available,${storeId}\nb202,BAT-S-002,Available,${storeId}`;
      case 'customer':
        return `id,name,dob,phone,email,address,aadharNo,panNo,emergencyContact1,emergencyContact2,storeId,kycStatus,agreementAccepted\nc301,John Doe,1995-05-15,9876543210,john@yana.in,"Plot 12, Saheed Nagar, BBSR",123456789012,ABCDE1234F,Sam Doe (9876543211),Jane Smith (9988776655),${storeId},true,true`;
    }
  };

  const downloadTemplate = () => {
    const csv = getCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yana_${bulkType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('uploading');
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV<any>(text);
        if (!parsed || parsed.length === 0) throw new Error('Empty or invalid CSV file.');
        const headers = Object.keys(parsed[0]);
        const requiredMap: Record<string, string[]> = {
          store: ['name', 'location'],
          vehicle: ['plateNumber', 'status', 'storeId'],
          battery: ['serialNumber', 'status', 'storeId'],
          customer: ['name', 'dob', 'phone', 'address', 'aadharNo', 'emergencyContact1', 'storeId']
        };
        const missing = requiredMap[bulkType].filter(h => !headers.includes(h));
        if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`);
        
        if (bulkType === 'store') onBulkStores(parsed);
        else if (bulkType === 'vehicle') onBulkVehicles(parsed);
        else if (bulkType === 'battery') onBulkBatteries(parsed);
        else if (bulkType === 'customer') onBulkCustomers(parsed);
        
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (err: any) {
        setImportStatus('error');
        setImportError(err.message || 'Error processing file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditModal = (asset: Vehicle | Battery, type: 'vehicle' | 'battery') => {
    setEditingAsset({ id: asset.id, type });
    setEditFormData({ ...asset });
    setEditReason('');
  };

  const saveEdit = () => {
    if (!editReason) return alert('Edit reason is required for audit logs.');
    if (editingAsset?.type === 'vehicle' && onUpdateVehicle) {
      onUpdateVehicle(editingAsset.id, editFormData, editReason);
    } else if (editingAsset?.type === 'battery' && onUpdateBattery) {
      onUpdateBattery(editingAsset.id, editFormData, editReason);
    }
    setEditingAsset(null);
  };

  const startEditStore = (store: Store) => {
    setEditingStoreId(store.id);
    setName(store.name);
    setLocation(store.location);
    setStateName(store.state);
    setTargetRentals(store.targetRentals || 0);
  };

  const handleUpdateStore = () => {
    if (editingStoreId && onUpdateStore) {
      onUpdateStore(editingStoreId, { name, location, state: stateName, targetRentals });
      setEditingStoreId(null);
      setName('');
      setLocation('');
    }
  };

  const handleDeleteStore = (id: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${storeName}"? This action cannot be undone and requires the store to be empty.`)) {
      onDeleteStore?.(id);
    }
  };

  // Helper to calculate final rates
  const getFinalRate = (base: number) => {
    return Math.round(base * (1 + tempRates.gstPercentage / 100));
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Console</h2>
          <p className="text-gray-500 text-sm">Infrastructure and global logistics control.</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setName(''); setLocation(''); setStateName('Odisha'); setTargetRentals(10); }}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center space-x-2 shadow-lg"
        >
          <Plus size={18} />
          <span>Add New Store</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stores List */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.stores.map(store => {
            const vCount = state.vehicles.filter(v => v.storeId === store.id).length;
            const bCount = state.batteries.filter(b => b.storeId === store.id).length;
            const activeBookings = state.bookings.filter(b => b.storeId === store.id && b.status === 'Active').length;
            return (
              <Card key={store.id} className="relative group hover:border-[#00eaff] transition-all">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                   <div className="bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200">
                      <Hash size={10} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{store.id}</span>
                   </div>
                   <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditStore(store); }} 
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Store"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.id, store.name); }} 
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Store"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                </div>
                <div className="flex items-center space-x-3 mb-6">
                   <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-[#00eaff] group-hover:text-black transition-all">
                      <StoreIcon size={24} />
                   </div>
                   <div className="pr-20">
                      <h4 className="font-bold text-gray-900 leading-tight truncate">{store.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center mt-0.5 truncate">
                        <MapPin size={10} className="mr-1 text-slate-400 shrink-0" />
                        {store.location}, {store.state}
                      </p>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100">
                   <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Vehicles</p>
                      <p className="text-base font-black text-gray-900">{vCount}</p>
                   </div>
                   <div className="text-center border-x border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Batteries</p>
                      <p className="text-base font-black text-gray-900">{bCount}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">On Rent / Target</p>
                      <p className="text-sm font-black text-[#0891b2]">{activeBookings} / {store.targetRentals || '--'}</p>
                   </div>
                </div>
              </Card>
            );
          })}
          {state.stores.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <StoreIcon size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">No active Zap Points registered.</p>
             </div>
          )}
        </div>

        {/* Global Config Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Global Pricing & Tax" subtitle="Manage Base Rates and GST Application">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Base Weekly</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                    <input type="number" className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#00eaff]/20" value={tempRates.weeklyRate} onChange={(e) => setTempRates({...tempRates, weeklyRate: Number(e.target.value)})} />
                  </div>
                  <p className="text-[9px] text-[#0891b2] font-black mt-1 uppercase">Final: ₹{getFinalRate(tempRates.weeklyRate)}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Base Monthly</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                    <input type="number" className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#00eaff]/20" value={tempRates.monthlyRate} onChange={(e) => setTempRates({...tempRates, monthlyRate: Number(e.target.value)})} />
                  </div>
                  <p className="text-[9px] text-[#0891b2] font-black mt-1 uppercase">Final: ₹{getFinalRate(tempRates.monthlyRate)}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Percent size={12} className="text-[#0891b2]" /> GST Percentage
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                  <input type="number" className="w-full pr-8 pl-4 py-2 bg-blue-50/50 border border-blue-100 rounded-xl font-black text-[#0891b2] outline-none" value={tempRates.gstPercentage} onChange={(e) => setTempRates({...tempRates, gstPercentage: Number(e.target.value)})} />
                </div>
                <p className="text-[9px] text-gray-400 font-medium mt-1 italic leading-tight">Applied to rental plans only. Security deposits are tax-exempt.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Security Deposit (No GST)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                  <input type="number" className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#00eaff]/20" value={tempRates.securityDeposit} onChange={(e) => setTempRates({...tempRates, securityDeposit: Number(e.target.value)})} />
                </div>
              </div>

              <button onClick={handleSaveRates} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 transition-all">
                <Save size={18} />
                <span>Save Global Settings</span>
              </button>
            </div>
          </Card>

          <Card title="Migration" subtitle="Logistics Override">
             <div className="space-y-4">
                <select className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold" value={migrationType} onChange={e => setMigrationType(e.target.value as any)}>
                  <option value="vehicle">Vehicles</option>
                  <option value="battery">Batteries</option>
                  <option value="customer">Riders</option>
                </select>
                <select className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
                   <option value="">-- Choose Asset --</option>
                   {getAssetsForMigration().map((asset: any) => (
                      <option key={asset.id} value={asset.id}>{asset.plateNumber || asset.serialNumber || asset.name} ({state.stores.find(s => s.id === asset.storeId)?.name})</option>
                   ))}
                </select>
                <select className="w-full p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-900" value={targetStoreId} onChange={e => setTargetStoreId(e.target.value)}>
                   <option value="">-- Target Store --</option>
                   {state.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleMigrate} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all">
                  <ArrowRightLeft size={18} /><span>Transfer</span>
                </button>
             </div>
          </Card>
        </div>
      </div>

      {/* MASTER FLEET MANAGEMENT SECTION */}
      <div className="mt-8">
        <Card title="Master Fleet Registry" subtitle="Directly view and edit properties of all physical assets in the YANA ecosystem.">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setFleetTab('vehicle')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${fleetTab === 'vehicle' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Vehicles</button>
                 <button onClick={() => setFleetTab('battery')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${fleetTab === 'battery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Batteries</button>
              </div>
              <div className="relative w-full lg:w-64">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" placeholder="Search by ID or Reg..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00eaff]/20" value={fleetSearch} onChange={e => setFleetSearch(e.target.value)} />
              </div>
           </div>

           <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Identifier</th>
                       <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">System ID</th>
                       <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Location</th>
                       <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight">Status</th>
                       <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tight text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredFleet.map((asset: any) => (
                       <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-3 font-black text-slate-900">{asset.plateNumber || asset.serialNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{asset.id}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold">{state.stores.find(s => s.id === asset.storeId)?.name}</td>
                          <td className="px-4 py-3">
                             <Badge variant={asset.status === 'Available' ? 'success' : asset.status === 'In Use' ? 'info' : 'warning'}>
                                {asset.status}
                             </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <button onClick={() => openEditModal(asset, fleetTab)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                                <Edit size={14} />
                             </button>
                          </td>
                       </tr>
                    ))}
                    {filteredFleet.length === 0 && (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic font-medium">No assets found matching your criteria.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>

      {/* Bulk Data Entry Card */}
      <div className="mt-8">
        <Card title="System Seeding & Data Import" subtitle="Bulk ingest infrastructure and assets using formatted .csv files">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-4">
              {[
                { id: 'store', label: 'Stores', icon: StoreIcon },
                { id: 'vehicle', label: 'Vehicles', icon: Truck },
                { id: 'battery', label: 'Batteries', icon: Zap },
                { id: 'customer', label: 'Riders', icon: Users }
              ].map(type => (
                <button 
                  key={type.id}
                  onClick={() => { setBulkType(type.id as any); setImportStatus('idle'); }}
                  className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all ${bulkType === type.id ? 'border-[#00eaff] bg-[#00eaff]/5 text-[#0891b2]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <type.icon size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
           </div>
           <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload CSV for {bulkType}s</p>
                   {importStatus === 'idle' && (
                     <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                        <AlertTriangle size={10} /> IDs in CSV must match existing Stores
                     </div>
                   )}
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${
                    importStatus === 'idle' ? 'border-slate-200 bg-slate-50 hover:bg-white hover:border-[#00eaff]' : 
                    importStatus === 'success' ? 'border-emerald-400 bg-emerald-50' : 
                    importStatus === 'error' ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-100'
                  }`}
                >
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                   {importStatus === 'idle' && (
                     <>
                        <Upload size={40} className="text-slate-300 group-hover:text-[#00eaff] transition-all mb-4" />
                        <p className="text-sm font-black text-slate-800">Drop CSV file or Click to browse</p>
                     </>
                   )}
                   {importStatus === 'uploading' && <div className="text-center"><Upload size={40} className="text-[#0891b2] animate-bounce mb-4 mx-auto" /><p className="text-sm font-black text-[#0891b2]">Processing...</p></div>}
                   {importStatus === 'success' && <div className="text-center"><CheckCircle2 size={40} className="text-emerald-500 mb-4 mx-auto" /><p className="text-sm font-black text-emerald-800">Success!</p></div>}
                   {importStatus === 'error' && <div className="text-center"><AlertCircle size={40} className="text-rose-500 mb-4 mx-auto" /><p className="text-sm font-black text-rose-800">Error</p><p className="text-[10px] font-bold text-rose-600 uppercase mt-1 px-4">{importError}</p></div>}
                </div>
              </div>
              <div className="space-y-4">
                 <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                       <FileText size={20} className="text-[#00eaff]" />
                       <h4 className="text-xs font-black uppercase tracking-widest">Requirements</h4>
                    </div>
                    <ul className="space-y-2 mb-8">
                       <RequirementRow label="id" desc="Unique Key" />
                       <RequirementRow label="storeId" desc="Store Mapping" required />
                       {bulkType === 'vehicle' && <RequirementRow label="plateNumber" desc="Reg ID" required />}
                       {bulkType === 'battery' && <RequirementRow label="serialNumber" desc="Serial" required />}
                       {bulkType === 'customer' && (
                         <>
                           <RequirementRow label="name" desc="Full Name" required />
                           <RequirementRow label="dob" desc="Date of Birth" required />
                           <RequirementRow label="phone" desc="Mobile" required />
                           <RequirementRow label="address" desc="Permanent Address" required />
                           <RequirementRow label="aadharNo" desc="Aadhar" required />
                           <RequirementRow label="emergencyContact1" desc="Emergency 1" required />
                         </>
                       )}
                    </ul>
                    <button onClick={downloadTemplate} className="w-full py-3 bg-[#00eaff] text-black rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all shadow-lg">
                       <Download size={16} /> Generate Template
                    </button>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Asset Edit Modal */}
      <Modal isOpen={!!editingAsset} onClose={() => setEditingAsset(null)} title={`Edit ${editingAsset?.type === 'vehicle' ? 'Scooter' : 'Battery'}`} confirmLabel="Update Asset" onConfirm={saveEdit}>
         <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between mb-2">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Identifier</p>
                  <p className="text-sm font-black text-slate-900">{editingAsset?.id}</p>
               </div>
               <Badge variant="info">{editingAsset?.type}</Badge>
            </div>
            {editingAsset?.type === 'vehicle' ? (
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Plate Number</label>
                 <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={editFormData.plateNumber || ''} onChange={e => setEditFormData({...editFormData, plateNumber: e.target.value})} />
              </div>
            ) : (
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Serial Number</label>
                 <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={editFormData.serialNumber || ''} onChange={e => setEditFormData({...editFormData, serialNumber: e.target.value})} />
              </div>
            )}
            <StatusInput 
              label="Assigned Store" 
              value={editFormData.storeId || ''} 
              onChange={v => setEditFormData({...editFormData, storeId: v})} 
              options={state.stores.map(s => ({ value: s.id, label: s.name }))} 
            />
            <StatusInput 
              label="Status" 
              value={editFormData.status || ''} 
              onChange={v => setEditFormData({...editFormData, status: v})} 
              options={editingAsset?.type === 'vehicle' ? Object.values(VehicleStatus) : Object.values(BatteryStatus)} 
            />
            <TextArea label="Reason for Adjustment" value={editReason} onChange={setEditReason} placeholder="Explain why these master properties are being modified..." />
         </div>
      </Modal>

      {/* New Store Modal */}
      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Register Zap Point" onConfirm={() => {
        if (name && location) { onCreate({ name, location, state: stateName, targetRentals }); setName(''); setLocation(''); }
      }}>
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Store Name</label>
               <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="ZAP POINT..." />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Address</label>
               <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">State</label>
               <select className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={stateName} onChange={e => setStateName(e.target.value)}>
                  <option value="Odisha">Odisha</option><option value="West Bengal">West Bengal</option><option value="Karnataka">Karnataka</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1.5"><Target size={14} className="text-blue-500" /> Rental Goal (Units)</label>
               <input type="number" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={targetRentals} onChange={e => setTargetRentals(Number(e.target.value))} />
            </div>
         </div>
      </Modal>

      {/* Edit Store Modal */}
      <Modal 
        isOpen={!!editingStoreId} 
        onClose={() => setEditingStoreId(null)} 
        title="Modify Zap Point" 
        onConfirm={handleUpdateStore}
        confirmLabel="Update Store"
      >
         <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 mb-2">
               <Hash size={16} className="text-blue-500" />
               <span className="text-xs font-black text-blue-900 uppercase">Store ID: {editingStoreId}</span>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Name</label>
               <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
               <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
               <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold" value={stateName} onChange={e => setStateName(e.target.value)}>
                  <option value="Odisha">Odisha</option><option value="West Bengal">West Bengal</option><option value="Karnataka">Karnataka</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Target size={14} className="text-blue-500" /> Rental Goal (Units)</label>
               <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold" value={targetRentals} onChange={e => setTargetRentals(Number(e.target.value))} />
            </div>
         </div>
      </Modal>
    </div>
  );
};

const RequirementRow = ({ label, desc, required }: { label: string, desc: string, required?: boolean }) => (
  <li className="flex justify-between items-center text-[10px]">
    <div className="flex items-center gap-2">
      <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#00eaff] font-mono">{label}</code>
      <span className="text-gray-400 font-medium">{desc}</span>
    </div>
    {required && <span className="text-[8px] font-black uppercase text-rose-400 tracking-tighter">Required</span>}
  </li>
);

export default AdminStoreManagement;