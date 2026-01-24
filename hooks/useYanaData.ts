import { useState, useEffect, useCallback } from 'react';
import { 
  YanaState, Store, Vehicle, Battery, Customer, Booking, MaintenanceJob, AuditLog,
  VehicleStatus, BatteryStatus, BookingStatus, RentalPlan, RentalRates
} from '../types';
import { getSeedDataFromCSV, MOCK_OPERATOR_ID, DEFAULT_RATES } from '../constants';

const STORAGE_KEY = 'yana_ops_v1_state';

export const useYanaData = () => {
  const [state, setState] = useState<YanaState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
    const { stores, vehicles, batteries, customers } = getSeedDataFromCSV();
    return {
      stores,
      vehicles,
      batteries,
      customers,
      bookings: [],
      maintenanceJobs: [],
      logs: [],
      activeStoreId: 'all', 
      rentalRates: DEFAULT_RATES
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addLog = useCallback((type: AuditLog['type'], message: string, reason: string) => {
    const logStoreId = state.activeStoreId === 'all' ? 'SYSTEM' : state.activeStoreId;
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      storeId: logStoreId,
      timestamp: Date.now(),
      type,
      message,
      reason,
      operatorId: MOCK_OPERATOR_ID
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs] }));
  }, [state.activeStoreId]);

  const resolveStoreId = (input: string, stores: Store[]): string => {
    if (!input) return stores[0]?.id || 's1';
    const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, '');
    const byId = stores.find(s => s.id.toLowerCase() === input.trim().toLowerCase());
    if (byId) return byId.id;
    const byName = stores.find(s => s.name.toLowerCase().replace(/\s+/g, '') === normalizedInput);
    if (byName) return byName.id;
    return stores[0]?.id || 's1';
  };

  const switchStore = (storeId: string) => {
    setState(prev => ({ ...prev, activeStoreId: storeId }));
  };

  const updateRentalRates = (rates: RentalRates) => {
    setState(prev => ({ ...prev, rentalRates: rates }));
    addLog('SYSTEM', 'Updated global rental rates and GST', 'Admin manual update');
  };

  const createStore = (store: Omit<Store, 'id'>) => {
    const newStore = { ...store, id: `s-${Date.now()}` };
    setState(prev => ({ ...prev, stores: [...prev.stores, newStore] }));
    addLog('SYSTEM', `Created new store: ${store.name}`, 'Initial setup');
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setState(prev => ({
      ...prev,
      stores: prev.stores.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
    addLog('SYSTEM', `Updated store properties for ${id}`, 'Admin manual update');
  };

  const deleteStore = (id: string) => {
    setState(prev => {
      // Check if store has assets
      const hasAssets = prev.vehicles.some(v => v.storeId === id) || prev.batteries.some(b => b.storeId === id);
      if (hasAssets) {
        alert("Cannot delete store. Migrate all vehicles and batteries first.");
        return prev;
      }
      return {
        ...prev,
        stores: prev.stores.filter(s => s.id !== id),
        activeStoreId: prev.activeStoreId === id ? 'all' : prev.activeStoreId
      };
    });
    addLog('SYSTEM', `Deleted store ${id}`, 'Admin manual deletion');
  };

  const bulkCreateStores = (newStores: Store[]) => {
    setState(prev => {
      const storesWithIds = newStores.map((s, i) => ({
        ...s,
        id: s.id || `s-bulk-${Date.now()}-${i}`
      }));
      const existingIds = new Set(prev.stores.map(ps => ps.id));
      const uniqueNewStores = storesWithIds.filter(ns => !existingIds.has(ns.id));
      return { ...prev, stores: [...prev.stores, ...uniqueNewStores] };
    });
    addLog('SYSTEM', `Bulk imported ${newStores.length} stores`, 'Admin bulk action');
  };

  const bulkCreateVehicles = (newVehicles: any[]) => {
    setState(prev => {
      const vehiclesWithIds = newVehicles.map((v, i) => ({
        ...v,
        id: v.id || `v-bulk-${Date.now()}-${i}`,
        storeId: resolveStoreId(v.storeId, prev.stores)
      }));
      const existingIds = new Set(prev.vehicles.map(pv => pv.id));
      const uniqueNewVehicles = vehiclesWithIds.filter(nv => !existingIds.has(nv.id));
      return { ...prev, vehicles: [...prev.vehicles, ...uniqueNewVehicles] };
    });
    addLog('SYSTEM', `Bulk imported ${newVehicles.length} vehicles`, 'Admin bulk action');
  };

  const bulkCreateBatteries = (newBatteries: any[]) => {
    setState(prev => {
      const batteriesWithIds = newBatteries.map((b, i) => ({
        ...b,
        id: b.id || `b-bulk-${Date.now()}-${i}`,
        storeId: resolveStoreId(b.storeId, prev.stores)
      }));
      const existingIds = new Set(prev.batteries.map(pb => pb.id));
      const uniqueNewBatteries = batteriesWithIds.filter(nb => !existingIds.has(nb.id));
      return { ...prev, batteries: [...prev.batteries, ...uniqueNewBatteries] };
    });
    addLog('SYSTEM', `Bulk imported ${newBatteries.length} batteries`, 'Admin bulk action');
  };

  const bulkCreateCustomers = (newCustomers: any[]) => {
    setState(prev => {
      const customersWithIds = newCustomers.map((c, i) => ({
        ...c,
        id: c.id || `c-bulk-${Date.now()}-${i}`,
        storeId: resolveStoreId(c.storeId, prev.stores)
      }));
      const existingIds = new Set(prev.customers.map(pc => pc.id));
      const uniqueNewCustomers = customersWithIds.filter(nc => !existingIds.has(nc.id));
      return { ...prev, customers: [...prev.customers, ...uniqueNewCustomers] };
    });
    addLog('SYSTEM', `Bulk imported ${newCustomers.length} riders`, 'Admin bulk action');
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>, reason: string) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
    addLog('VEHICLE', `Admin updated vehicle ${id} properties`, reason);
  };

  const updateBattery = (id: string, updates: Partial<Battery>, reason: string) => {
    setState(prev => ({
      ...prev,
      batteries: prev.batteries.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
    addLog('BATTERY', `Admin updated battery ${id} properties`, reason);
  };

  const updateVehicleStatus = (vehicleId: string, status: VehicleStatus, reason: string) => {
    setState(prev => {
      const vehicles = prev.vehicles.map(v => {
        if (v.id === vehicleId) return { ...v, status };
        return v;
      });
      return { ...prev, vehicles };
    });
    addLog('VEHICLE', `Updated vehicle ${vehicleId} status to ${status}`, reason);
  };

  const assignBattery = (vehicleId: string, batteryId: string, reason: string) => {
    setState(prev => {
      const vehicles = prev.vehicles.map(v => {
        if (v.id === vehicleId) return { ...v, assignedBatteryId: batteryId };
        return v;
      });
      const batteries = prev.batteries.map(b => {
        if (b.id === batteryId) return { ...b, assignedVehicleId: vehicleId };
        return b;
      });
      return { ...prev, vehicles, batteries };
    });
    addLog('SYSTEM', `Manually attached battery ${batteryId} to vehicle ${vehicleId}`, reason);
  };

  const migrateAsset = (assetType: 'vehicle' | 'battery' | 'customer', assetId: string, targetStoreId: string) => {
    setState(prev => {
      const targetStore = prev.stores.find(s => s.id === targetStoreId);
      if (!targetStore) return prev;
      let newState = { ...prev };
      if (assetType === 'vehicle') {
        newState.vehicles = prev.vehicles.map(v => v.id === assetId ? { ...v, storeId: targetStoreId } : v);
      } else if (assetType === 'battery') {
        newState.batteries = prev.batteries.map(b => b.id === assetId ? { ...b, storeId: targetStoreId } : b);
      } else if (assetType === 'customer') {
        newState.customers = prev.customers.map(c => c.id === assetId ? { ...c, storeId: targetStoreId } : c);
      }
      return newState;
    });
    addLog('SYSTEM', `Migrated ${assetType} ${assetId} to ${targetStoreId}`, 'Admin logistics move');
  };

  const createCustomer = (customer: Omit<Customer, 'id' | 'storeId'>) => {
    const customerStoreId = state.activeStoreId === 'all' ? state.stores[0].id : state.activeStoreId;
    const newCustomer: Customer = { 
      ...customer, 
      id: `cust-${Date.now()}`, 
      storeId: customerStoreId 
    };
    setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    addLog('SYSTEM', `Onboarded new rider: ${customer.name}`, 'Registration form complete');
  };

  const createBooking = (customerId: string, vehicleId: string, batteryId: string, plan: RentalPlan, startDateTs: number) => {
    const hasActiveBooking = state.bookings.some(b => 
      b.customerId === customerId && 
      [BookingStatus.DRAFT, BookingStatus.ACTIVE, BookingStatus.PAUSED].includes(b.status)
    );
    if (hasActiveBooking) {
      alert("⚠️ Rule Violation: This rider already has an active or draft booking.");
      return;
    }
    const bookingStoreId = state.activeStoreId === 'all' ? state.stores[0].id : state.activeStoreId;
    const durationDays = plan === RentalPlan.WEEKLY ? 7 : 30;
    const expectedEndDate = startDateTs + (durationDays * 24 * 60 * 60 * 1000);
    
    // GST CALCULATION
    const baseRentAmount = plan === RentalPlan.WEEKLY ? state.rentalRates.weeklyRate : state.rentalRates.monthlyRate;
    const gstAmount = (baseRentAmount * state.rentalRates.gstPercentage) / 100;
    const totalAmountIncludingGst = baseRentAmount + gstAmount;
    
    const depositAmount = state.rentalRates.securityDeposit;
    
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      customerId,
      vehicleId,
      batteryId,
      storeId: bookingStoreId,
      status: BookingStatus.DRAFT,
      createdAt: Date.now(),
      startedAt: startDateTs,
      expectedEndDate,
      notes: '',
      rentalPlan: plan,
      totalAmount: totalAmountIncludingGst,
      depositAmount: depositAmount,
      amountPaid: 0,
      finesAmount: 0,
      isSettled: false
    };
    setState(prev => ({ ...prev, bookings: [...prev.bookings, newBooking] }));
    addLog('BOOKING', `Created draft booking for customer ${customerId}`, `Plan: ${plan} (Inc. GST)`);
  };

  const updateBooking = (bookingId: string, updates: Partial<Booking>, reason: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, ...updates } : b)
    }));
    addLog('BOOKING', `Admin updated booking ${bookingId}`, reason);
  };

  const recordPayment = (bookingId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => {
        if (b.id === bookingId) return { ...b, amountPaid: (b.amountPaid || 0) + amount };
        return b;
      })
    }));
    addLog('BOOKING', `Collected payment of ₹${amount} for booking ${bookingId}`, 'Manual entry');
  };

  const markBookingAsSettled = (bookingId: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, isSettled: true } : b)
    }));
    addLog('BOOKING', `Marked booking ${bookingId} as fully settled`, 'Settlement');
  };

  const startBooking = (bookingId: string) => {
    setState(prev => {
      const booking = prev.bookings.find(b => b.id === bookingId);
      if (!booking) return prev;
      return {
        ...prev,
        bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, status: BookingStatus.ACTIVE, startedAt: Date.now() } : b),
        vehicles: prev.vehicles.map(v => v.id === booking.vehicleId ? { ...v, status: VehicleStatus.IN_USE } : v),
        batteries: prev.batteries.map(bat => bat.id === booking.batteryId ? { ...bat, status: BatteryStatus.IN_USE } : bat)
      };
    });
    addLog('BOOKING', `Rider dispatched for booking ${bookingId}`, 'Vehicle released');
  };

  const pauseBooking = (bookingId: string, reason: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, status: BookingStatus.PAUSED, pausedAt: Date.now(), pauseReason: reason } : b)
    }));
    addLog('BOOKING', `Booking ${bookingId} paused`, reason);
  };

  const completeBooking = (bookingId: string, notes: string, fines: number = 0, checklist: string[] = []) => {
    setState(prev => {
      const booking = prev.bookings.find(b => b.id === bookingId);
      if (!booking) return prev;
      return {
        ...prev,
        bookings: prev.bookings.map(b => b.id === bookingId ? { 
          ...b, status: BookingStatus.COMPLETED, completedAt: Date.now(), notes, finesAmount: (b.finesAmount || 0) + fines, checklist: [...(b.checklist || []), ...checklist]
        } : b),
        vehicles: prev.vehicles.map(v => v.id === booking.vehicleId ? { ...v, status: VehicleStatus.AVAILABLE } : v),
        batteries: prev.batteries.map(bat => bat.id === booking.batteryId ? { ...bat, status: BatteryStatus.AVAILABLE } : bat)
      };
    });
    addLog('BOOKING', `Booking ${bookingId} completed`, notes);
  };

  const swapVehicle = (bookingId: string, newVehicleId: string, reason: string, maintenance: boolean, fines: number = 0, checklist: string[] = []) => {
    setState(prev => {
      const booking = prev.bookings.find(b => b.id === bookingId);
      if (!booking) return prev;
      const oldVehicleId = booking.vehicleId;
      return {
        ...prev,
        bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, vehicleId: newVehicleId, finesAmount: (b.finesAmount || 0) + fines, checklist: [...(b.checklist || []), ...checklist] } : b),
        vehicles: prev.vehicles.map(v => {
          if (v.id === oldVehicleId) return { ...v, status: maintenance ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE, assignedBatteryId: undefined };
          if (v.id === newVehicleId) return { ...v, status: VehicleStatus.IN_USE, assignedBatteryId: booking.batteryId };
          return v;
        }),
        batteries: prev.batteries.map(bat => bat.id === booking.batteryId ? { ...bat, assignedVehicleId: newVehicleId } : bat)
      };
    });
    addLog('VEHICLE', `Swapped vehicle for booking ${bookingId}`, reason);
  };

  const swapBattery = (bookingId: string, newBatteryId: string, reason: string, maintenance: boolean) => {
    setState(prev => {
      const booking = prev.bookings.find(b => b.id === bookingId);
      if (!booking) return prev;
      const oldBatteryId = booking.batteryId;
      return {
        ...prev,
        bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, batteryId: newBatteryId } : b),
        batteries: prev.batteries.map(bat => {
          if (bat.id === oldBatteryId) return { ...bat, status: maintenance ? BatteryStatus.MAINTENANCE : BatteryStatus.AVAILABLE, assignedVehicleId: undefined };
          if (bat.id === newBatteryId) return { ...bat, status: BatteryStatus.IN_USE, assignedVehicleId: booking.vehicleId };
          return bat;
        }),
        vehicles: prev.vehicles.map(v => v.id === booking.vehicleId ? { ...v, assignedBatteryId: newBatteryId } : v)
      };
    });
    addLog('BATTERY', `Swapped battery for booking ${bookingId}`, reason);
  };

  const createMaintenanceJob = (vehicleId: string, description: string) => {
    const job: MaintenanceJob = {
      id: `maint-${Date.now()}`,
      vehicleId,
      storeId: state.activeStoreId === 'all' ? (state.vehicles.find(v => v.id === vehicleId)?.storeId || 's1') : state.activeStoreId,
      status: 'Open',
      description,
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      maintenanceJobs: [...prev.maintenanceJobs, job],
      vehicles: prev.vehicles.map(v => v.id === vehicleId ? { ...v, status: VehicleStatus.MAINTENANCE } : v)
    }));
    addLog('MAINTENANCE', `Opened maintenance job for vehicle ${vehicleId}`, description);
  };

  const closeMaintenanceJob = (jobId: string, nextStatus: VehicleStatus, reason: string) => {
    setState(prev => {
      const job = prev.maintenanceJobs.find(j => j.id === jobId);
      if (!job) return prev;
      return {
        ...prev,
        maintenanceJobs: prev.maintenanceJobs.map(j => j.id === jobId ? { ...j, status: 'Closed', closedAt: Date.now() } : j),
        vehicles: prev.vehicles.map(v => v.id === job.vehicleId ? { ...v, status: nextStatus } : v)
      };
    });
    addLog('MAINTENANCE', `Closed maintenance job ${jobId}`, reason);
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const { stores, vehicles, batteries, customers } = getSeedDataFromCSV();
    setState({
      stores, vehicles, batteries, customers,
      bookings: [], maintenanceJobs: [], logs: [],
      activeStoreId: 'all', rentalRates: DEFAULT_RATES
    });
  };

  return {
    state, switchStore, updateRentalRates, createStore, updateStore, deleteStore,
    bulkCreateStores, bulkCreateVehicles, bulkCreateBatteries, bulkCreateCustomers,
    updateVehicle, updateBattery, 
    updateVehicleStatus, assignBattery, migrateAsset, createCustomer,
    createBooking, updateBooking, recordPayment, markBookingAsSettled,
    startBooking, pauseBooking, completeBooking,
    swapVehicle, swapBattery, createMaintenanceJob, closeMaintenanceJob, resetData
  };
};