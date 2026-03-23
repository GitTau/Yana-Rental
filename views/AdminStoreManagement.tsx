
import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Target,
  ArrowRight,
  User,
  Landmark,
  ShieldCheck,
  Smartphone,
  CalendarDays,
  CreditCard,
  Mail,
  RefreshCw,
  MoreVertical,
  Briefcase
} from 'lucide-react';
import { YanaState, Store, RentalRates, Vehicle, Battery, Customer, VehicleStatus, BatteryStatus } from '../types';
import { Card, Modal, Badge, StatusInput, TextArea } from '../components/Common';
import { parseCSV } from '../constants';

const AdminStoreManagement: React.FC<{ 
  state: YanaState, 
  onCreate: (s: Omit<Store, 'id'>) => Promise<void>,
  onUpdateStore?: (id: string, updates: Partial<Store>) => Promise<void>,
  onDeleteStore?: (id: string) => Promise<void>,
  onUpdateRates: (rates: RentalRates) => Promise<void>,
  onMigrate: (type: 'vehicle' | 'battery' | 'customer', id: string, targetStoreId: string) => Promise<void>,
  onBulkStores: (s: any[]) => Promise<void>,
  onBulkVehicles: (v: any[]) => Promise<void>,
  onBulkBatteries: (b: any[]) => Promise<void>,
  onBulkCustomers: (c: any[]) => Promise<void>,
  onUpdateVehicle?: (id: string, updates: Partial<Vehicle>) => Promise<void>,
  onUpdateBattery?: (id: string, updates: Partial<Battery>) => Promise<void>,
  onUpdateCustomer?: (id: string, updates: Partial<Customer>) => Promise<void>,
  onDeleteCustomer?: (id: string) => Promise<void>,
}> = ({ 
  state, onCreate, onUpdateStore, onDeleteStore, onUpdateRates, onMigrate, 
  onBulkStores, onBulkVehicles, onBulkBatteries, onBulkCustomers, 
  onUpdateVehicle, onUpdateBattery, onUpdateCustomer, onDeleteCustomer 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  
  // Store Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [stateName, setStateName] = useState('Odisha');
  const [targetRentals, setTargetRentals] = useState(10);

  // Rates State
  const [tempRates, setTempRates] = useState<RentalRates>(state.rentalRates);

  useEffect(() => {
    setTempRates(state.rentalRates);
  }, [state.rentalRates]);

  // Migration State
  const [migrationType, setMigrationType] = useState<'vehicle' | 'battery' | 'customer'>('vehicle');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('');

  // Bulk Import State
  const [bulkType, setBulkType] = useState<'store' | 'vehicle' | 'battery' | 'customer'>('vehicle');
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fleet & Rider Management State
  const [assetTab, setAssetTab] = useState<'vehicle' | 'battery'>('vehicle');
  const [assetSearch, setAssetSearch] = useState('');
  const [riderSearch, setRiderSearch] = useState('');
  const [riderFilter, setRiderFilter] = useState<'ALL' | 'KYC_PENDING' | 'KYC_VERIFIED'>('ALL');
  
  const [editingAsset, setEditingAsset] = useState<{ id: string, type: 'vehicle' | 'battery' | 'rider' } | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isDeletingRider, setIsDeletingRider] = useState<string | null>(null);

  const handleSaveRates = () => {
    onUpdateRates(tempRates);
  };

  const handleCreateStore = async () => {
    if (!name.trim()) return alert("Store Name is required.");
    setIsSubmitting(true);
    try {
      await onCreate({ name: name.trim(), location, state: stateName, targetRentals });
      setIsCreating(false);
      setName('');
      setLocation('');
    } catch (err: any) {
      console.error("Failed to create store:", err);
      alert(`Error: ${err.message || "Could not create Zap Point. Check console for details."}`);
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredAssets = useMemo(() => {
    const list = assetTab === 'vehicle' ? state.vehicles : state.batteries;
    if (!assetSearch) return list;
    const q = assetSearch.toLowerCase();
    return list.filter(item => {
      const idStr = item.id.toLowerCase();
      const refStr = (item as any).plateNumber?.toLowerCase() || 
                    (item as any).serialNumber?.toLowerCase() || '';
      return idStr.includes(q) || refStr.includes(q);
    });
  }, [assetTab, assetSearch, state.vehicles, state.batteries]);

  const filteredRiders = useMemo(() => {
    let list = [...state.customers];
    
    if (riderFilter === 'KYC_PENDING') list = list.filter(c => !c.kycStatus);
    if (riderFilter === 'KYC_VERIFIED') list = list.filter(c => c.kycStatus);
    
    if (!riderSearch) return list;
    const q = riderSearch.toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) || 
      c.id.toLowerCase().includes(q)
    );
  }, [state.customers, riderSearch, riderFilter]);

  const downloadTemplate = () => {
    const storeName = state.stores[0]?.name || 'ZAP POINT OD 01';
    let csv = '';
    switch (bulkType) {
      case 'store': csv = `name,location,state,targetRentals\nZAP POINT NORTH,"Janpath Rd, Unit 4",Odisha,20`; break;
      case 'vehicle': csv = `plateNumber,status,storeName\nYEV101,Available,"${storeName}"`; break;
      case 'battery': csv = `serialNumber,status,storeName\nBAT-S-001,Available,"${storeName}"`; break;
      case 'customer': csv = `name,dob,phone,email,address,aadharNo,panNo,storeName\nJohn Doe,1995-05-15,9876543210,john@yana.in,"Plot 12, BBSR",123456789012,ABCDE1234F,"${storeName}"`; break;
    }
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
    setImportSuccessCount(0);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV<any>(text);
        if (parsed.length === 0) throw new Error("CSV file is empty or invalid format.");
        
        if (bulkType === 'store') await onBulkStores(parsed);
        else if (bulkType === 'vehicle') await onBulkVehicles(parsed);
        else if (bulkType === 'battery') await onBulkBatteries(parsed);
        else if (bulkType === 'customer') await onBulkCustomers(parsed);
        
        setImportSuccessCount(parsed.length);
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 5000);
      } catch (err: any) {
        setImportStatus('error');
        setImportError(err.message || 'Check store names and CSV columns.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditModal = (asset: any, type: 'vehicle' | 'battery' | 'rider') => {
    setEditingAsset({ id: asset.id, type });
    setEditFormData({ ...asset });
  };

  const saveEdit = () => {
    if (editingAsset?.type === 'vehicle' && onUpdateVehicle) onUpdateVehicle(editingAsset.id, editFormData);
    else if (editingAsset?.type === 'battery' && onUpdateBattery) onUpdateBattery(editingAsset.id, editFormData);
    else if (editingAsset?.type === 'rider' && onUpdateCustomer) onUpdateCustomer(editingAsset.id, editFormData);
    setEditingAsset(null);
  };

  const confirmDeleteRider = () => {
    if (isDeletingRider && onDeleteCustomer) {
      onDeleteCustomer(isDeletingRider);
    }
    setIsDeletingRider(null);
  };

  return (
    <div className="space-y-10 pb-32">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Terminal Config</h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Infrastructure & Logistics Control</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center space-x-2 shadow-xl active:scale-95">
          <Plus size={18} /><span>New Zap Point</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <StoreIcon size={14} className="text-blue-500" /> Active Zap Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.stores.map(store => (
              <Card key={store.id} className="relative group hover:border-[#00eaff] transition-all">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                   <div className="bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200">
                      <Hash size={10} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{(store.id || '').substring(0,4)}</span>
                   </div>
                </div>
                <div className="flex items-center space-x-3 mb-6">
                   <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-[#00eaff] group-hover:text-black transition-all">
                      <StoreIcon size={24} />
                   </div>
                   <div className="pr-12">
                      <h4 className="font-black text-gray-900 leading-tight truncate">{store.name}</h4>
                      <p className="text-[10px] text-gray-500 flex items-center mt-1 truncate font-bold uppercase tracking-tighter">
                        <MapPin size={10} className="mr-1 text-slate-400 shrink-0" />
                        {store.location}, {store.state}
                      </p>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vehicles</p>
                      <p className="text-base font-black text-gray-900">{state.vehicles.filter(v => v.storeId === store.id).length}</p>
                   </div>
                   <div className="text-center border-x border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Batteries</p>
                      <p className="text-base font-black text-gray-900">{state.batteries.filter(b => b.storeId === store.id).length}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Target</p>
                      <p className="text-sm font-black text-[#0891b2]">{store.targetRentals || 0}</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-2">
                   <button onClick={() => { setEditingStoreId(store.id); setName(store.name); setLocation(store.location); setStateName(store.state); setTargetRentals(store.targetRentals || 0); }} className="flex-1 py-2 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-all">Edit</button>
                   <button onClick={() => onDeleteStore?.(store.id)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Percent size={14} className="text-indigo-500" /> Financial Settings
              </h3>
              <Card title="Rates & Tax" subtitle="Global Base Pricing Config">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Base Weekly (₹)" type="number" value={tempRates.weeklyRate} onChange={v => setTempRates({...tempRates, weeklyRate: Number(v)})} />
                    <InputField label="Base Monthly (₹)" type="number" value={tempRates.monthlyRate} onChange={v => setTempRates({...tempRates, monthlyRate: Number(v)})} />
                  </div>
                  <InputField label="Security Deposit (₹)" type="number" value={tempRates.securityDeposit} onChange={v => setTempRates({...tempRates, securityDeposit: Number(v)})} />
                  <InputField label="GST (%)" type="number" value={tempRates.gstPercentage} onChange={v => setTempRates({...tempRates, gstPercentage: Number(v)})} />
                  <button onClick={handleSaveRates} className="w-full py-3 bg-slate-900 text-[#00eaff] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={16} /> Save Rates</button>
                </div>
              </Card>
           </div>
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-amber-500" /> Migration Hub
              </h3>
              <Card title="Asset Relocation" subtitle="Move fleet between stations">
                 <div className="space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                       <button onClick={() => setMigrationType('vehicle')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${migrationType === 'vehicle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Scot</button>
                       <button onClick={() => setMigrationType('battery')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${migrationType === 'battery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Bat</button>
                       <button onClick={() => setMigrationType('customer')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${migrationType === 'customer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Rider</button>
                    </div>
                    <StatusInput label={`Select ${migrationType}`} value={selectedAssetId} onChange={setSelectedAssetId} options={[{ value: "", label: "-- Choose Asset --" }, ...getAssetsForMigration().map(a => ({ value: a.id, label: (a as any).plateNumber || (a as any).serialNumber || a.name }))]} />
                    <StatusInput label="Target Store" value={targetStoreId} onChange={setTargetStoreId} options={[{ value: "", label: "-- Target Zap Point --" }, ...state.stores.map(s => ({ value: s.id, label: s.name }))]} />
                    <button onClick={handleMigrate} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><ArrowRight size={16} /> Execute Transfer</button>
                 </div>
              </Card>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end px-1">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <Users size={14} className="text-indigo-600" /> Global Rider Registry
           </h3>
           <div className="flex gap-2">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search Master ID or Phone..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-400 w-48" value={riderSearch} onChange={e => setRiderSearch(e.target.value)} />
              </div>
              <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:border-indigo-400" value={riderFilter} onChange={e => setRiderFilter(e.target.value as any)}>
                 <option value="ALL">All Riders</option>
                 <option value="KYC_PENDING">KYC Pending</option>
                 <option value="KYC_VERIFIED">KYC Verified</option>
              </select>
           </div>
        </div>

        <Card className="p-0 overflow-hidden border border-slate-200 shadow-xl">
           <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-left text-[11px]">
                 <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                       <th className="px-6 py-4 font-black uppercase tracking-widest">Rider Identity</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest">Compliance</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest">Base Station</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest">Logistics</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredRiders.map(rider => (
                       <tr key={rider.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                   {rider.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-black text-slate-900">{rider.name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold">{rider.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-1">
                                <Badge variant={rider.kycStatus ? 'success' : 'error'} className="w-fit">
                                   {rider.kycStatus ? 'Verified' : 'Pending KYC'}
                                </Badge>
                                {rider.agreementAccepted ? (
                                   <span className="text-[8px] font-black text-emerald-600 uppercase flex items-center gap-1"><ShieldCheck size={8}/> SOP Signed</span>
                                ) : (
                                   <span className="text-[8px] font-black text-rose-400 uppercase flex items-center gap-1"><AlertTriangle size={8}/> SOP Missing</span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1.5 text-slate-600 font-bold uppercase">
                                <StoreIcon size={12} className="text-slate-400" />
                                {state.stores.find(s => s.id === rider.storeId)?.name.split(' ').slice(2).join(' ') || 'Global'}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Aadhar: {rider.aadharNo || 'N/A'}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase">PAN: {rider.panNo || 'N/A'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                {!rider.kycStatus && (
                                   <button 
                                     onClick={() => onUpdateCustomer?.(rider.id, { kycStatus: true })}
                                     className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                                     title="Approve KYC"
                                   >
                                      <CheckCircle2 size={16}/>
                                      <span className="text-[9px] font-black uppercase">Approve</span>
                                   </button>
                                )}
                                <button onClick={() => openEditModal(rider, 'rider')} className="p-2 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all"><Edit size={16}/></button>
                                <button onClick={() => setIsDeletingRider(rider.id)} className="p-2 bg-white border border-slate-200 rounded-xl text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-all"><Trash2 size={16}/></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <Upload size={14} className="text-emerald-500" /> Bulk Command Center
            </h3>
            <Card title="Mass Data Ingest" subtitle="CSV pipeline (Use Store Names)">
               <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {['store', 'vehicle', 'battery', 'customer'].map(type => (
                        <button key={type} onClick={() => { setBulkType(type as any); setImportStatus('idle'); setImportError(''); }} className={`py-2 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${bulkType === type ? 'border-[#00eaff] bg-cyan-50 text-[#0891b2]' : 'border-slate-100 text-slate-400'}`}>{type}s</button>
                     ))}
                  </div>
                  <div className={`p-6 border-2 border-dashed rounded-3xl text-center flex flex-col items-center transition-all ${importStatus === 'success' ? 'bg-emerald-50 border-emerald-200' : importStatus === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                     {importStatus === 'uploading' ? (
                        <div className="flex flex-col items-center">
                           <RefreshCw size={32} className="text-blue-500 animate-spin mb-3" />
                           <p className="text-xs font-black uppercase text-blue-600">Processing Stream...</p>
                        </div>
                     ) : importStatus === 'success' ? (
                        <div className="flex flex-col items-center">
                           <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
                           <p className="text-xs font-black uppercase text-emerald-600">Ingested {importSuccessCount} Records</p>
                           <p className="text-[10px] text-emerald-500 mt-1">Global fleet state synchronized.</p>
                        </div>
                     ) : importStatus === 'error' ? (
                        <div className="flex flex-col items-center">
                           <AlertTriangle size={32} className="text-rose-500 mb-3" />
                           <p className="text-xs font-black uppercase text-rose-600">Ingest Failed</p>
                           <p className="text-[10px] text-rose-400 mt-1 max-w-[200px]">{importError}</p>
                        </div>
                     ) : (
                        <>
                           <FileText size={32} className="text-slate-300 mb-3" />
                           <p className="text-xs text-slate-500 font-bold mb-4">Select or Drop CSV for {bulkType.toUpperCase()}S</p>
                        </>
                     )}
                     
                     {importStatus === 'idle' && (
                        <div className="flex gap-2">
                           <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">Choose File</button>
                           <button onClick={downloadTemplate} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95"><Download size={14} /> Template</button>
                        </div>
                     )}
                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                  </div>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <Truck size={14} className="text-blue-500" /> Fleet Asset Directory
            </h3>
            <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                     <button onClick={() => setAssetTab('vehicle')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${assetTab === 'vehicle' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Scot</button>
                     <button onClick={() => setAssetTab('battery')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${assetTab === 'battery' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Bat</button>
                  </div>
                  <div className="relative flex-1 max-w-[200px] w-full">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input type="text" placeholder="Search Master..." className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400" value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                  </div>
               </div>
               <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                  <table className="w-full text-left text-[10px]">
                     <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                           <th className="px-4 py-3 font-black text-slate-400 uppercase">Identity</th>
                           <th className="px-4 py-3 font-black text-slate-400 uppercase">Station</th>
                           <th className="px-4 py-3 font-black text-slate-400 uppercase text-right">Ops</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredAssets.map(asset => (
                           <tr key={asset.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3">
                                 <div className="flex flex-col">
                                    <span className="font-black text-slate-800">{(asset as any).plateNumber || (asset as any).serialNumber}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-bold uppercase">{state.stores.find(s => s.id === asset.storeId)?.name.split(' ')[0]}</td>
                              <td className="px-4 py-3 text-right">
                                 <div className="flex justify-end gap-1.5">
                                    <button onClick={() => openEditModal(asset, assetTab)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:border-blue-400"><Edit size={12}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      </div>

      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Register Zap Point" confirmLabel={isSubmitting ? "Registering..." : "Register Store"} onConfirm={handleCreateStore}>
         <div className="space-y-4">
            <InputField label="Store Name" value={name} onChange={setName} placeholder="ZAP POINT..." />
            <InputField label="Address" value={location} onChange={setLocation} />
            <StatusInput label="State" value={stateName} onChange={setStateName} options={['Odisha', 'West Bengal', 'Karnataka', 'Jharkhand']} />
            <InputField label="Rental Goal (Units)" type="number" value={targetRentals} onChange={v => setTargetRentals(Number(v))} />
         </div>
      </Modal>

      <Modal isOpen={!!editingStoreId} onClose={() => setEditingStoreId(null)} title="Update Zap Point" confirmLabel="Apply Changes" onConfirm={() => {
         if (editingStoreId) onUpdateStore?.(editingStoreId, { name, location, state: stateName, targetRentals });
         setEditingStoreId(null);
      }}>
         <div className="space-y-4">
            <InputField label="Store Name" value={name} onChange={setName} />
            <InputField label="Address" value={location} onChange={setLocation} />
            <StatusInput label="State" value={stateName} onChange={setStateName} options={['Odisha', 'West Bengal', 'Karnataka', 'Jharkhand']} />
            <InputField label="Rental Goal (Units)" type="number" value={targetRentals} onChange={v => setTargetRentals(Number(v))} />
         </div>
      </Modal>

      <Modal isOpen={!!editingAsset} onClose={() => setEditingAsset(null)} title={`Edit ${editingAsset?.type === 'rider' ? 'Rider Profile' : editingAsset?.type}`} confirmLabel="Save Master Update" onConfirm={saveEdit}>
         <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            {editingAsset?.type === 'rider' ? (
               <div className="space-y-6">
                  <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rider Master ID</p>
                        <p className="text-sm font-black text-[#00eaff] truncate">{editingAsset.id}</p>
                     </div>
                     <Users className="text-slate-700" size={24} />
                  </div>
                  
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1"><User size={12}/> Personal Identity</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <InputField label="Full Name" value={editFormData.name} onChange={v => setEditFormData({...editFormData, name: v})} />
                        <InputField label="Phone" value={editFormData.phone} onChange={v => setEditFormData({...editFormData, phone: v})} />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <InputField label="Email" value={editFormData.email} onChange={v => setEditFormData({...editFormData, email: v})} />
                        <InputField label="DOB" type="date" value={editFormData.dob} onChange={v => setEditFormData({...editFormData, dob: v})} />
                     </div>
                     <InputField label="Permanent Address" value={editFormData.address} onChange={v => setEditFormData({...editFormData, address: v})} />
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1"><Landmark size={12}/> Settlement Banking</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <InputField label="Bank Name" value={editFormData.bankName} onChange={v => setEditFormData({...editFormData, bankName: v})} />
                        <InputField label="IFSC Code" value={editFormData.ifscCode} onChange={v => setEditFormData({...editFormData, ifscCode: v.toUpperCase()})} />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <InputField label="Account No" value={editFormData.accountNumber} onChange={v => setEditFormData({...editFormData, accountNumber: v})} />
                        <InputField label="UPI ID" value={editFormData.upiId} onChange={v => setEditFormData({...editFormData, upiId: v})} />
                     </div>
                     <InputField label="Account Holder" value={editFormData.accountHolderName} onChange={v => setEditFormData({...editFormData, accountHolderName: v})} />
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1"><ShieldCheck size={12}/> Compliance & Logistics</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <InputField label="Aadhar UID" value={editFormData.aadharNo} onChange={v => setEditFormData({...editFormData, aadharNo: v})} />
                        <InputField label="PAN Card" value={editFormData.panNo} onChange={v => setEditFormData({...editFormData, panNo: v})} />
                     </div>
                     <StatusInput label="Assigned Station" value={editFormData.storeId} onChange={v => setEditFormData({...editFormData, storeId: v})} options={state.stores.map(s => ({ value: s.id, label: s.name }))} />
                     <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">KYC Registry</label>
                           <button onClick={() => setEditFormData({...editFormData, kycStatus: !editFormData.kycStatus})} className={`py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${editFormData.kycStatus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {editFormData.kycStatus ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                              {editFormData.kycStatus ? 'Verified' : 'Pending'}
                           </button>
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consent Policy</label>
                           <button onClick={() => setEditFormData({...editFormData, agreementAccepted: !editFormData.agreementAccepted})} className={`py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${editFormData.agreementAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {editFormData.agreementAccepted ? <ShieldCheck size={12}/> : <AlertTriangle size={12}/>}
                              {editFormData.agreementAccepted ? 'Accepted' : 'Unsigned'}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                     <div className={`p-3 rounded-xl ${editingAsset?.type === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {editingAsset?.type === 'vehicle' ? <Truck size={24}/> : <Zap size={24}/>}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Asset ID</p>
                        <p className="text-sm font-black text-slate-900">{editingAsset?.id}</p>
                     </div>
                  </div>
                  <InputField label={editingAsset?.type === 'vehicle' ? "Plate Number" : "Serial Number"} value={editingAsset?.type === 'vehicle' ? editFormData.plateNumber : editFormData.serialNumber} onChange={v => setEditFormData({...editFormData, [editingAsset?.type === 'vehicle' ? 'plateNumber' : 'serialNumber']: v})} />
                  <StatusInput label="Target Zap Point" value={editFormData.storeId} onChange={v => setEditFormData({...editFormData, storeId: v})} options={state.stores.map(s => ({ value: s.id, label: s.name }))} />
               </div>
            )}
         </div>
      </Modal>

      <Modal isOpen={!!isDeletingRider} onClose={() => setIsDeletingRider(null)} title="Confirm Destruction" confirmLabel="Execute Deletion" onConfirm={confirmDeleteRider}>
         <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">Erase Rider Record?</h4>
            <p className="text-sm text-slate-500 leading-relaxed px-4">This action will permanently delete this rider's identity, banking details, and statutory documents from the global registry. This cannot be undone.</p>
         </div>
      </Modal>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = 'text', placeholder }: { label: string, value: any, onChange: (v: string) => void, type?: string, placeholder?: string }) => (
  <div className="space-y-1.5 flex-1 w-full">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      className="w-full px-4 py-3 rounded-xl border outline-none text-xs bg-gray-50 transition-all border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default AdminStoreManagement;
