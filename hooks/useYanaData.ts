
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  YanaState, Store, Vehicle, Battery, Customer, Booking, MaintenanceJob, AuditLog,
  VehicleStatus, BatteryStatus, BookingStatus, RentalPlan, RentalRates
} from '../types';
import { MOCK_OPERATOR_ID, DEFAULT_RATES } from '../constants';

const SUPABASE_URL = 'https://kaoelfcaiegjjhyrrlak.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-EPMKGBa0QxO2JN9t3LXXg_Pm-NNn93';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILITIES ---

const clean = (val: any) => {
  if (typeof val === 'string') val = val.trim();
  return (val === "" || val === undefined || val === "undefined") ? null : val;
};

const isUUID = (str: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{8}-[0-9a-f]{12}$/i;
  // A bit more flexible regex for Supabase format
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || regex.test(str);
};

const normalizeVehicleStatus = (status: string | null): VehicleStatus => {
  if (!status) return VehicleStatus.AVAILABLE;
  const s = status.toLowerCase().trim();
  if (['available', 'ready', 'active', 'ok'].includes(s)) return VehicleStatus.AVAILABLE;
  if (['in use', 'rented', 'running', 'on ride'].includes(s)) return VehicleStatus.IN_USE;
  if (['maintenance', 'dead', 'broken', 'repair', 'service', 'damaged'].includes(s)) return VehicleStatus.MAINTENANCE;
  if (['inactive', 'retired', 'sold', 'lost'].includes(s)) return VehicleStatus.INACTIVE;
  return VehicleStatus.AVAILABLE;
};

const normalizeBatteryStatus = (status: string | null): BatteryStatus => {
  if (!status) return BatteryStatus.AVAILABLE;
  const s = status.toLowerCase().trim();
  if (['available', 'ready', 'charged', 'shelf', 'ok'].includes(s)) return BatteryStatus.AVAILABLE;
  if (['in use', 'rented', 'discharged', 'running'].includes(s)) return BatteryStatus.IN_USE;
  if (['maintenance', 'dead', 'broken', 'repair', 'service', 'faulty', 'deep discharge'].includes(s)) return BatteryStatus.MAINTENANCE;
  return BatteryStatus.AVAILABLE;
};

export const useYanaData = () => {
  const [state, setState] = useState<YanaState>({
    stores: [],
    vehicles: [],
    batteries: [],
    customers: [],
    bookings: [],
    maintenanceJobs: [],
    logs: [],
    activeStoreId: 'all', 
    rentalRates: DEFAULT_RATES
  });

  const [isLoading, setIsLoading] = useState(true);

  // Robustly resolve a store ID from either a UUID or a Name string
  const resolveStoreId = useCallback((ref: any): string | null => {
    if (ref === null || ref === undefined) return null;
    const trimmedRef = String(ref).trim();
    if (!trimmedRef) return null;
    
    // Check if it's a direct ID match first
    if (state.stores.some(s => s.id === trimmedRef)) return trimmedRef;
    
    // Check for name match (case-insensitive)
    const byName = state.stores.find(s => s.name.toLowerCase() === trimmedRef.toLowerCase());
    if (byName) return byName.id;
    
    return null;
  }, [state.stores]);

  // --- CUSTOMER MAPPING ---

  const mapCustomerFromDB = (c: any): Customer => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    dob: c.dob,
    address: c.address,
    aadharNo: c.aadhar_no,
    panNo: c.pan_no,
    emergencyContact1: c.emergency_contact_1,
    emergencyContact2: c.emergency_contact_2,
    kycStatus: !!c.kyc_status,
    agreementAccepted: !!c.agreement_accepted,
    storeId: c.store_id,
    startDate: c.start_date,
    endDate: c.end_date,
    bankName: c.bank_name,
    accountHolderName: c.account_holder_name,
    accountNumber: c.account_number,
    ifscCode: c.ifsc_code,
    upiId: c.upi_id,
  });

  const mapCustomerToDB = (u: Partial<Customer>) => {
    const mapped: any = {};
    if (u.name !== undefined) mapped.name = u.name;
    if (u.phone !== undefined) mapped.phone = u.phone;
    if (u.email !== undefined) mapped.email = u.email;
    if (u.dob !== undefined) mapped.dob = u.dob;
    if (u.address !== undefined) mapped.address = u.address;
    if (u.aadharNo !== undefined) mapped.aadhar_no = u.aadharNo;
    if (u.panNo !== undefined) mapped.pan_no = u.panNo;
    if (u.emergencyContact1 !== undefined) mapped.emergency_contact_1 = u.emergencyContact1;
    if (u.emergencyContact2 !== undefined) mapped.emergency_contact_2 = u.emergencyContact2;
    if (u.kycStatus !== undefined) mapped.kyc_status = u.kycStatus;
    if (u.agreementAccepted !== undefined) mapped.agreement_accepted = u.agreementAccepted;
    if (u.startDate !== undefined) mapped.start_date = u.startDate;
    if (u.endDate !== undefined) mapped.end_date = u.endDate;
    if (u.bankName !== undefined) mapped.bank_name = u.bankName;
    if (u.accountHolderName !== undefined) mapped.account_holder_name = u.accountHolderName;
    if (u.accountNumber !== undefined) mapped.account_number = u.accountNumber;
    if (u.ifscCode !== undefined) mapped.ifsc_code = u.ifscCode;
    if (u.upiId !== undefined) mapped.upi_id = u.upiId;
    return mapped;
  };

  // --- BOOKING MAPPING ---

  const mapBookingFromDB = (b: any): Booking => {
    const createdAt = b.created_at ? new Date(b.created_at).getTime() : Date.now();
    const startedAt = b.started_at ? new Date(b.started_at).getTime() : undefined;
    const rentalPlan = b.rental_plan as RentalPlan;
    const duration = rentalPlan === RentalPlan.WEEKLY ? 7 : 30;
    
    let pauseOffset = 0;
    let displayNotes = b.notes || '';
    try {
      if (b.notes && b.notes.startsWith('{')) {
        const metadata = JSON.parse(b.notes);
        pauseOffset = metadata.pause_offset_ms || 0;
        displayNotes = metadata.display_notes || '';
      }
    } catch (e) {}

    const anchorDate = startedAt || createdAt;
    const virtualExpectedEndDate = anchorDate + (duration * 86400000) + pauseOffset;

    return {
      id: b.id,
      customerId: b.customer_id,
      vehicleId: b.vehicle_id,
      batteryId: b.battery_id,
      storeId: b.store_id,
      status: b.status as BookingStatus,
      createdAt,
      startedAt,
      pausedAt: b.paused_at ? new Date(b.paused_at).getTime() : undefined,
      completedAt: b.completed_at ? new Date(b.completed_at).getTime() : undefined,
      pauseReason: b.pause_reason,
      notes: displayNotes,
      rentalPlan,
      expectedEndDate: virtualExpectedEndDate,
      totalAmount: Number(b.total_amount || 0),
      depositAmount: Number(b.deposit_amount || 0),
      amountPaid: Number(b.amount_paid || 0),
      finesAmount: Number(b.fines_amount || 0),
      checklist: b.checklist || [],
      isSettled: b.is_settled
    };
  };

    const mapBookingToDB = (u: Partial<Booking>) => {
      const mapped: any = {};
      if (u.status !== undefined) mapped.status = u.status;
      if (u.notes !== undefined) {
        // If we are updating notes from the UI, we should preserve the metadata if it exists
        // This is tricky because mapBookingToDB doesn't have access to the current state easily
        // But in most cases, we'll handle metadata updates specifically in the functions
        mapped.notes = u.notes;
      }
      if (u.vehicleId !== undefined) mapped.vehicle_id = u.vehicleId;
      if (u.batteryId !== undefined) mapped.battery_id = u.batteryId;
      if (u.customerId !== undefined) mapped.customer_id = u.customerId;
      if (u.amountPaid !== undefined) mapped.amount_paid = u.amountPaid;
      if (u.isSettled !== undefined) mapped.is_settled = u.isSettled;
      if (u.finesAmount !== undefined) mapped.fines_amount = u.finesAmount;
      if (u.checklist !== undefined) mapped.checklist = u.checklist;
      return mapped;
    };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: stores },
        { data: vehicles },
        { data: batteries },
        { data: customers },
        { data: bookings },
        { data: jobs },
        { data: logs },
        { data: config }
      ] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('batteries').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('maintenance_jobs').select('*'),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
        supabase.from('global_config').select('*').limit(1).maybeSingle()
      ]);

      setState(prev => ({
        ...prev,
        stores: (stores || []).map(s => ({ id: s.store_id, name: s.name, location: s.location, state: s.state_name, targetRentals: s.target_rentals })),
        vehicles: (vehicles || []).map(v => ({ id: v.id, storeId: v.store_id, plateNumber: v.plate_number, status: v.status as VehicleStatus, assignedBatteryId: v.assigned_battery_id })),
        batteries: (batteries || []).map(b => ({ id: b.id, storeId: b.store_id, serialNumber: b.serial_number, status: b.status as BatteryStatus, assignedVehicleId: b.assigned_vehicle_id })),
        customers: (customers || []).map(mapCustomerFromDB),
        bookings: (bookings || []).map(mapBookingFromDB),
        maintenanceJobs: (jobs || []).map(j => ({ id: j.id, vehicleId: j.vehicle_id, storeId: j.store_id, status: j.status, description: j.description, createdAt: new Date(j.created_at).getTime(), closedAt: j.closed_at ? new Date(j.closed_at).getTime() : undefined })),
        logs: (logs || []).map(l => ({ id: l.id, storeId: l.store_id, timestamp: new Date(l.timestamp).getTime(), type: l.type, message: l.message, reason: l.reason, operatorId: l.operator_id })),
        rentalRates: config ? { 
          weeklyRate: Number(config.weekly_rate), 
          monthlyRate: Number(config.monthly_rate), 
          securityDeposit: Number(config.security_deposit), 
          gstPercentage: Number(config.gst_percentage) 
        } : DEFAULT_RATES
      }));
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-refresh').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const addLog = useCallback(async (type: AuditLog['type'], message: string, reason: string) => {
    try {
      const logStoreId = state.activeStoreId === 'all' ? null : state.activeStoreId;
      await supabase.from('audit_logs').insert([{ store_id: logStoreId, type, message, reason, operator_id: MOCK_OPERATOR_ID }]);
    } catch (e) { console.error(e); }
  }, [state.activeStoreId]);

  return {
    state, isLoading,
    switchStore: (id: string) => setState(prev => ({ ...prev, activeStoreId: id })),
    updateRentalRates: async (rates: RentalRates) => {
      await supabase.from('global_config').upsert({ id: 1, weekly_rate: rates.weeklyRate, monthly_rate: rates.monthlyRate, security_deposit: rates.securityDeposit, gst_percentage: rates.gstPercentage }, { onConflict: 'id' });
      fetchData();
    },
    updateCustomer: async (id: string, updates: Partial<Customer>) => {
      const dbUpdate = mapCustomerToDB(updates);
      await supabase.from('customers').update(dbUpdate).eq('id', id);
      await addLog('SYSTEM', `Updated rider profile ${id}`, 'Admin manual adjustment');
      fetchData();
    },
    deleteCustomer: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) alert(error.message);
      else {
        await addLog('SYSTEM', `Deleted rider profile ${id}`, 'Admin removal');
        fetchData();
      }
    },
    createCustomer: async (customer: Omit<Customer, 'id' | 'storeId'>) => {
      const activeStore = state.stores.find(s => s.id === state.activeStoreId);
      const { error } = await supabase.from('customers').insert([{
        store_id: activeStore ? activeStore.id : state.stores[0].id,
        name: customer.name,
        phone: customer.phone,
        email: clean(customer.email),
        dob: clean(customer.dob),
        address: clean(customer.address),
        aadhar_no: clean(customer.aadharNo),
        pan_no: clean(customer.panNo),
        emergency_contact_1: clean(customer.emergencyContact1),
        emergency_contact_2: clean(customer.emergencyContact2),
        kyc_status: false,
        agreement_accepted: customer.agreementAccepted,
        bank_name: clean(customer.bankName),
        account_holder_name: clean(customer.accountHolderName),
        account_number: clean(customer.accountNumber),
        ifsc_code: clean(customer.ifscCode),
        upi_id: clean(customer.upiId),
        start_date: clean(customer.startDate),
        end_date: clean(customer.endDate)
      }]);
      if (error) throw error;
      await addLog('SYSTEM', `Onboarded rider: ${customer.name}`, 'Registration complete');
      fetchData();
    },
    createStore: async (store: Omit<Store, 'id'>) => {
      await supabase.from('stores').insert([{ name: store.name, location: store.location, state_name: store.state, target_rentals: store.targetRentals }]);
      fetchData();
    },
    updateVehicleStatus: async (vId: string, s: VehicleStatus, r: string) => { 
      await supabase.from('vehicles').update({ status: s }).eq('id', vId); 
      await addLog('VEHICLE', `Status updated to ${s}`, r); 
      fetchData(); 
    },
    assignBattery: async (vId: string, bId: string) => {
      await Promise.all([
        supabase.from('vehicles').update({ assigned_battery_id: bId }).eq('id', vId),
        supabase.from('batteries').update({ assigned_vehicle_id: vId }).eq('id', bId)
      ]);
      fetchData();
    },
    createBooking: async (customerId: string, vehicleId: string, batteryId: string, plan: RentalPlan, startDateTs: number) => {
      const activeStore = state.stores.find(s => s.id === state.activeStoreId);
      const base = plan === RentalPlan.WEEKLY ? state.rentalRates.weeklyRate : state.rentalRates.monthlyRate;
      const gst = (base * state.rentalRates.gstPercentage) / 100;
      
      const isoStartDate = new Date(startDateTs).toISOString();
      
      await supabase.from('bookings').insert([{
        customer_id: customerId,
        vehicle_id: vehicleId,
        battery_id: batteryId,
        store_id: activeStore ? activeStore.id : state.stores[0].id,
        rental_plan: plan,
        total_amount: base + gst,
        deposit_amount: state.rentalRates.securityDeposit,
        created_at: isoStartDate
      }]);
      fetchData();
    },
    recordPayment: async (id: string, amount: number) => {
      const b = state.bookings.find(x => x.id === id);
      await supabase.from('bookings').update({ amount_paid: (b?.amountPaid || 0) + amount }).eq('id', id);
      fetchData();
    },
    markBookingAsSettled: async (id: string) => {
      await supabase.from('bookings').update({ is_settled: true }).eq('id', id);
      fetchData();
    },
    startBooking: async (id: string, newVehId?: string, newBatId?: string) => {
      const b = state.bookings.find(x => x.id === id);
      if (!b) return;

      const now = Date.now();
      
      const updateData: any = { 
        status: BookingStatus.ACTIVE,
      };

      // Handle Resumption Logic: Calculate Pause Duration
      if (b.status === BookingStatus.PAUSED && b.pausedAt) {
        const pauseDuration = now - b.pausedAt;
        let metadata: any = {};
        try {
          if (b.notes && b.notes.startsWith('{')) {
            metadata = JSON.parse(b.notes);
          } else {
            metadata.display_notes = b.notes || '';
          }
        } catch (e) {
          metadata.display_notes = b.notes || '';
        }
        
        metadata.pause_offset_ms = (metadata.pause_offset_ms || 0) + pauseDuration;
        updateData.notes = JSON.stringify(metadata);
        updateData.paused_at = null; // Clear paused_at on resume
      } else {
        // Initial start
        const isBackDated = (now - b.createdAt) > (1000 * 60 * 60 * 4);
        const startTime = isBackDated ? new Date(b.createdAt).toISOString() : new Date().toISOString();
        updateData.started_at = startTime;
      }
      
      if (newVehId) updateData.vehicle_id = newVehId;
      if (newBatId) updateData.battery_id = newBatId;

      const promises = [
        supabase.from('bookings').update(updateData).eq('id', id)
      ];

      const vId = newVehId || b.vehicleId;
      const batId = newBatId || b.batteryId;

      if (vId) promises.push(supabase.from('vehicles').update({ status: VehicleStatus.IN_USE }).eq('id', vId));
      if (batId) promises.push(supabase.from('batteries').update({ status: BatteryStatus.IN_USE }).eq('id', batId));

      await Promise.all(promises);
      fetchData();
    },
    pauseBooking: async (id: string, r: string, f: number, c: string[]) => {
      const b = state.bookings.find(x => x.id === id);
      if (!b) return;
      const oldVehId = b.vehicleId;
      const oldBatId = b.batteryId;

      // If there's a fine or checklist items, we might consider it damaged
      const hasDamage = f > 0 || c.length > 0;

      await Promise.all([
        supabase.from('bookings').update({ 
          status: BookingStatus.PAUSED, 
          pause_reason: r, 
          paused_at: new Date().toISOString(),
          fines_amount: (b.finesAmount || 0) + f,
          checklist: [...(b.checklist || []), ...c],
          vehicle_id: null,
          battery_id: null
        }).eq('id', id),
        oldVehId ? supabase.from('vehicles').update({ status: hasDamage ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE }).eq('id', oldVehId) : Promise.resolve(),
        oldBatId ? supabase.from('batteries').update({ status: hasDamage ? BatteryStatus.MAINTENANCE : BatteryStatus.AVAILABLE }).eq('id', oldBatId) : Promise.resolve()
      ]);
      fetchData();
    },
    completeBooking: async (id: string, n: string, f: number, c: string[]) => {
      const b = state.bookings.find(x => x.id === id);
      
      let finalNotes = n;
      try {
        const { data: raw } = await supabase.from('bookings').select('notes').eq('id', id).single();
        if (raw && raw.notes && raw.notes.startsWith('{')) {
          const metadata = JSON.parse(raw.notes);
          metadata.display_notes = n;
          finalNotes = JSON.stringify(metadata);
        }
      } catch (e) {}

      const promises: any[] = [
        supabase.from('bookings').update({ 
          status: BookingStatus.COMPLETED, 
          completed_at: new Date().toISOString(), 
          notes: finalNotes, 
          fines_amount: (b?.finesAmount || 0) + f, 
          checklist: [...(b?.checklist || []), ...c] 
        }).eq('id', id)
      ];
      if (b?.vehicleId) promises.push(supabase.from('vehicles').update({ status: VehicleStatus.AVAILABLE }).eq('id', b.vehicleId));
      if (b?.batteryId) promises.push(supabase.from('batteries').update({ status: BatteryStatus.AVAILABLE }).eq('id', b.batteryId));
      
      await Promise.all(promises);
      fetchData();
    },
    swapVehicle: async (bId: string, vId: string, r: string, m: boolean, f: number, c: string[]) => {
      const b = state.bookings.find(x => x.id === bId);
      await Promise.all([
        supabase.from('bookings').update({ vehicle_id: vId, fines_amount: (b?.finesAmount || 0) + f, checklist: [...(b?.checklist || []), ...c] }).eq('id', bId),
        b?.vehicleId ? supabase.from('vehicles').update({ status: m ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE }).eq('id', b.vehicleId) : Promise.resolve(),
        supabase.from('vehicles').update({ status: VehicleStatus.IN_USE }).eq('id', vId)
      ]);
      fetchData();
    },
    swapBattery: async (bId: string, batId: string, r: string, m: boolean) => {
      const b = state.bookings.find(x => x.id === bId);
      await Promise.all([
        supabase.from('bookings').update({ battery_id: batId }).eq('id', bId),
        b?.batteryId ? supabase.from('batteries').update({ status: m ? BatteryStatus.MAINTENANCE : BatteryStatus.AVAILABLE }).eq('id', b.batteryId) : Promise.resolve(),
        supabase.from('batteries').update({ status: BatteryStatus.IN_USE }).eq('id', batId)
      ]);
      fetchData();
    },
    createMaintenanceJob: async (vId: string, d: string) => {
      await Promise.all([
        supabase.from('maintenance_jobs').insert([{ vehicle_id: vId, store_id: state.activeStoreId === 'all' ? state.stores[0].id : state.activeStoreId, description: d }]),
        supabase.from('vehicles').update({ status: VehicleStatus.MAINTENANCE }).eq('id', vId)
      ]);
      fetchData();
    },
    closeMaintenanceJob: async (jId: string, ns: VehicleStatus) => {
      const j = state.maintenanceJobs.find(x => x.id === jId);
      await Promise.all([
        supabase.from('maintenance_jobs').update({ status: 'Closed', closed_at: new Date().toISOString() }).eq('id', jId),
        supabase.from('vehicles').update({ status: ns }).eq('id', j?.vehicleId)
      ]);
      fetchData();
    },
    migrateAsset: async (t: string, id: string, sid: string) => {
      const tbl = t === 'vehicle' ? 'vehicles' : t === 'battery' ? 'batteries' : 'customers';
      await supabase.from(tbl).update({ store_id: sid }).eq('id', id);
      fetchData();
    },
    bulkCreateStores: async (s: any[]) => { 
      const mapped = s.map(x => ({ 
        name: clean(x.name), 
        location: clean(x.location), 
        state_name: clean(x.state), 
        target_rentals: Number(x.targetRentals || 0) 
      })).filter(x => x.name);
      
      const { error } = await supabase.from('stores').upsert(mapped, { onConflict: 'name' }); 
      if (error) { console.error('Bulk Stores Error:', error); throw error; }
      fetchData(); 
    },
    bulkCreateVehicles: async (v: any[]) => { 
      const mapped = v.map(x => {
        const sid = resolveStoreId(x.storeName || x.storeId);
        return sid ? { 
          plate_number: clean(x.plateNumber), 
          store_id: sid, 
          status: normalizeVehicleStatus(clean(x.status)) 
        } : null;
      }).filter(x => x);
      
      if (mapped.length === 0) throw new Error("No valid store names found in CSV. Use actual Zap Point names.");
      
      const { error } = await supabase.from('vehicles').upsert(mapped, { onConflict: 'plate_number' }); 
      if (error) { console.error('Bulk Vehicles Error:', error); throw error; }
      fetchData(); 
    },
    bulkCreateBatteries: async (b: any[]) => { 
      const mapped = b.map(x => {
        const sid = resolveStoreId(x.storeName || x.storeId);
        return sid ? { 
          serial_number: clean(x.serialNumber), 
          store_id: sid, 
          status: normalizeBatteryStatus(clean(x.status)) 
        } : null;
      }).filter(x => x);
      
      if (mapped.length === 0) throw new Error("No valid store names found in CSV. Use actual Zap Point names.");
      
      const { error } = await supabase.from('batteries').upsert(mapped, { onConflict: 'serial_number' }); 
      if (error) { console.error('Bulk Batteries Error:', error); throw error; }
      fetchData(); 
    },
    bulkCreateCustomers: async (c: any[]) => { 
      const mapped = c.map(x => {
        const sid = resolveStoreId(x.storeName || x.storeId);
        return sid ? { 
          name: clean(x.name), 
          phone: String(clean(x.phone)), 
          email: clean(x.email), 
          dob: clean(x.dob), 
          address: clean(x.address), 
          aadhar_no: String(clean(x.aadharNo)), 
          pan_no: clean(x.panNo), 
          store_id: sid 
        } : null;
      }).filter(x => x);
      
      if (mapped.length === 0) throw new Error("No valid store names found in CSV. Use actual Zap Point names.");
      
      const { error } = await supabase.from('customers').upsert(mapped, { onConflict: 'phone' }); 
      if (error) { console.error('Bulk Riders Error:', error); throw error; }
      fetchData(); 
    },
    updateBooking: async (id: string, u: Partial<Booking>, r: string) => { 
      const b = state.bookings.find(x => x.id === id);
      const dbUpdate = mapBookingToDB(u);
      
      if (u.notes !== undefined && b) {
        // Try to preserve metadata
        let metadata: any = {};
        try {
          // We need the raw notes from the DB or the state
          // But 'state.bookings' already has 'displayNotes' in the 'notes' field
          // This is a bit circular. Let's look at how we can get the raw notes.
          // Actually, I'll just fetch the raw booking for a second to be safe or 
          // assume the state's notes are display notes and we need to wrap them.
          
          // Let's fetch the raw record to be absolutely sure about metadata preservation
          const { data: raw } = await supabase.from('bookings').select('notes').eq('id', id).single();
          if (raw && raw.notes && raw.notes.startsWith('{')) {
            metadata = JSON.parse(raw.notes);
          }
        } catch (e) {}
        
        metadata.display_notes = u.notes;
        dbUpdate.notes = JSON.stringify(metadata);
      }

      await supabase.from('bookings').update(dbUpdate).eq('id', id); 
      await addLog('SYSTEM', `Record override ${id}`, r); 
      fetchData(); 
    },
    updateVehicle: async (id: string, u: any) => { await supabase.from('vehicles').update({ plate_number: u.plateNumber, store_id: u.storeId }).eq('id', id); fetchData(); },
    updateBattery: async (id: string, u: any) => { await supabase.from('batteries').update({ serial_number: u.serialNumber, store_id: u.storeId }).eq('id', id); fetchData(); },
    updateStore: async (id: string, u: any) => { await supabase.from('stores').update({ name: u.name, location: u.location, state_name: u.state, target_rentals: u.targetRentals }).eq('store_id', id); fetchData(); },
    deleteStore: async (id: string) => { await supabase.from('stores').delete().eq('store_id', id); fetchData(); },
    resetData: () => fetchData()
  };
};
