
import React, { useState } from 'react';
import { 
  BookOpen, 
  UserPlus, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  Truck, 
  Zap, 
  Search,
  User,
  PlusCircle
} from 'lucide-react';
import { YanaState, BookingStatus, VehicleStatus, BatteryStatus, Customer } from '../types';
import { Card, Badge, Modal, TextArea } from '../components/Common';

interface BookingsProps {
  state: YanaState;
  onStart: (id: string) => void;
  onPause: (id: string, reason: string) => void;
  onComplete: (id: string, notes: string) => void;
  onCreateBooking: (custId: string, vehId: string, batId: string) => void;
  onOnboardCustomer: (c: Omit<Customer, 'id' | 'storeId'>) => void;
}

const Bookings: React.FC<BookingsProps> = ({ 
  state, onStart, onPause, onComplete, onCreateBooking, onOnboardCustomer 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // Form State
  const [searchRider, setSearchRider] = useState('');
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedVehId, setSelectedVehId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [pausingBookingId, setPausingBookingId] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Scoped Data
  const storeBookings = state.bookings.filter(b => b.storeId === state.activeStoreId);
  const availableVehicles = state.vehicles.filter(v => 
    v.storeId === state.activeStoreId && 
    v.status === VehicleStatus.AVAILABLE && 
    v.assignedBatteryId
  );
  const availableBatteries = state.batteries.filter(b => 
    b.storeId === state.activeStoreId && 
    b.status === BatteryStatus.AVAILABLE
  );
  const storeCustomers = state.customers.filter(c => c.storeId === state.activeStoreId);
  const filteredCustomers = storeCustomers.filter(c => 
    c.name.toLowerCase().includes(searchRider.toLowerCase()) || 
    c.phone.includes(searchRider)
  );

  const getStatusVariant = (s: BookingStatus) => {
    switch (s) {
      case BookingStatus.ACTIVE: return 'success';
      case BookingStatus.PAUSED: return 'warning';
      case BookingStatus.PENDING: return 'neutral';
      case BookingStatus.COMPLETED: return 'info';
      case BookingStatus.CANCELLED: return 'error';
    }
  };

  const handleOnboardAndBook = () => {
    if (!newCustName || !newCustPhone) return alert('Name and phone required');
    
    // In a real app, this would return the new ID. For this mock, we use a predictable ID or search
    const tempId = `cust-${Date.now()}`;
    onOnboardCustomer({ name: newCustName, phone: newCustPhone, kycStatus: false, agreementAccepted: false });
    
    // We wait for the state to update or just alert user
    alert('Customer Onboarded! Please select them from the list to continue booking.');
    setIsOnboarding(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  return (
    <div className="space-y-8">
      {/* 1. Store Inventory Stats (Operator Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Available Scooters</p>
            <p className="text-xl font-black text-gray-900">{availableVehicles.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Available Batteries</p>
            <p className="text-xl font-black text-gray-900">{availableBatteries.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Rides</p>
            <p className="text-xl font-black text-gray-900">{storeBookings.filter(b => b.status === BookingStatus.ACTIVE).length}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Operations</h2>
          <p className="text-sm text-gray-500">Dispatch riders and manage returns.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsOnboarding(true)}
            className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <PlusCircle size={18} />
            <span>Onboard New Rider</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
          >
            <UserPlus size={18} />
            <span>Create Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Active/Draft Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storeBookings.length > 0 ? (
          storeBookings.filter(b => [BookingStatus.ACTIVE, BookingStatus.PENDING, BookingStatus.PAUSED].includes(b.status)).map(booking => {
            const customer = state.customers.find(c => c.id === booking.customerId);
            const vehicle = state.vehicles.find(v => v.id === booking.vehicleId);
            return (
              <Card key={booking.id} className="relative">
                <div className="absolute top-4 right-4">
                  <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                </div>
                
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                    {customer?.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{customer?.name}</h4>
                    <p className="text-xs text-gray-500 font-medium">{customer?.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
                    <p className="text-sm font-bold text-gray-800">{vehicle?.plateNumber}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Battery</p>
                    <p className="text-sm font-bold text-gray-800">{booking.batteryId}</p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  {booking.status === BookingStatus.PENDING && (
                    <button 
                      onClick={() => onStart(booking.id)}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md"
                    >
                      <Play size={16} />
                      <span>Dispatch Ride</span>
                    </button>
                  )}
                  {booking.status === BookingStatus.ACTIVE && (
                    <>
                      <button 
                        onClick={() => { setPausingBookingId(booking.id); setPauseReason(''); }}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                      >
                        <Pause size={16} />
                        <span>Pause</span>
                      </button>
                      <button 
                        onClick={() => { setCompletingBookingId(booking.id); setCompletionNotes(''); }}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                      >
                        <CheckCircle size={16} />
                        <span>Return</span>
                      </button>
                    </>
                  )}
                  {booking.status === BookingStatus.PAUSED && (
                    <button 
                      onClick={() => onStart(booking.id)}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                    >
                      <Play size={16} />
                      <span>Resume</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No active bookings for this Zap Point.</p>
            <p className="text-sm">Dispatch a rider to get started.</p>
          </div>
        )}
      </div>

      {/* 3. Past Customers Quick View */}
      <Card title="Recent Riders" subtitle="Quickly start a booking for returning customers">
        <div className="mb-4 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search riders by name or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchRider}
            onChange={(e) => setSearchRider(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCustomers.map(cust => (
            <div key={cust.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between group hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer" onClick={() => { setSelectedCustId(cust.id); setIsCreating(true); }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <User size={14} className="text-gray-500 group-hover:text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{cust.name}</p>
                  <p className="text-[10px] text-gray-500">{cust.phone}</p>
                </div>
              </div>
              <PlusCircle size={16} className="text-gray-300 group-hover:text-blue-500" />
            </div>
          ))}
        </div>
      </Card>

      {/* Modals */}
      <Modal isOpen={isCreating} onClose={() => { setIsCreating(false); setSelectedCustId(''); }} title="New Dispatch" confirmLabel="Create Booking" onConfirm={() => {
        const v = state.vehicles.find(v => v.id === selectedVehId);
        if (selectedCustId && selectedVehId && v?.assignedBatteryId) {
          onCreateBooking(selectedCustId, selectedVehId, v.assignedBatteryId);
        } else {
          alert('Select a rider and an available scooter.');
        }
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Rider</label>
            <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white" value={selectedCustId} onChange={e => setSelectedCustId(e.target.value)}>
              <option value="">Select Existing Rider</option>
              {storeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Scooter (With Battery)</label>
            <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white" value={selectedVehId} onChange={e => setSelectedVehId(e.target.value)}>
              <option value="">Select Available Vehicle</option>
              {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} (Bat: {v.assignedBatteryId})</option>)}
            </select>
            {availableVehicles.length === 0 && (
              <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-tighter italic">Warning: No scoooters available in store</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOnboarding} onClose={() => setIsOnboarding(false)} title="Rider Onboarding" confirmLabel="Complete Onboarding" onConfirm={handleOnboardAndBook}>
         <div className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
               <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="e.g., Arjun Verma" />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</label>
               <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
               Note: KYC must be verified by admin after onboarding.
            </div>
         </div>
      </Modal>

      <Modal isOpen={!!pausingBookingId} onClose={() => setPausingBookingId(null)} title="Pause Booking" onConfirm={() => {
        if (pausingBookingId && pauseReason) {
           onPause(pausingBookingId, pauseReason);
        } else {
          alert('Reason is required for pause.');
        }
      }}>
         <TextArea label="Pause Reason" value={pauseReason} onChange={setPauseReason} placeholder="e.g., Lunch break, Short maintenance stop..." />
      </Modal>

      <Modal isOpen={!!completingBookingId} onClose={() => setCompletingBookingId(null)} title="Return & Inspection" onConfirm={() => {
        if (completingBookingId) {
           onComplete(completingBookingId, completionNotes);
        }
      }}>
         <TextArea label="Inspection Notes" value={completionNotes} onChange={setCompletionNotes} placeholder="Any damage? Battery health? Fines?" />
      </Modal>
    </div>
  );
};

export default Bookings;
