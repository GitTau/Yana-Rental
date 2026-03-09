
export enum UserRole {
  OPERATOR = 'Operator',
  ADMIN = 'Admin',
  RIDER = 'Rider'
}

export enum VehicleStatus {
  AVAILABLE = 'Available',
  IN_USE = 'In Use',
  MAINTENANCE = 'Maintenance',
  INACTIVE = 'Inactive'
}

export enum BatteryStatus {
  AVAILABLE = 'Available',
  IN_USE = 'In Use',
  MAINTENANCE = 'Maintenance'
}

export enum BookingStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum RentalPlan {
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export interface RentalRates {
  weeklyRate: number;
  monthlyRate: number;
  securityDeposit: number;
  gstPercentage: number;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  state: string;
  targetRentals: number;
}

export interface Vehicle {
  id: string;
  storeId: string;
  plateNumber: string;
  status: VehicleStatus;
  assignedBatteryId?: string;
}

export interface Battery {
  id: string;
  storeId: string;
  serialNumber: string;
  status: BatteryStatus;
  assignedVehicleId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  address?: string;
  aadharNo?: string;
  panNo?: string;
  emergencyContact1?: string;
  emergencyContact2?: string;
  kycStatus: boolean;
  agreementAccepted: boolean;
  storeId: string;
  startDate?: string;
  endDate?: string;
  // Banking for Settlements
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string | null;
  batteryId: string | null;
  storeId: string;
  status: BookingStatus;
  createdAt: number;
  startedAt?: number;
  pausedAt?: number;
  completedAt?: number;
  pauseReason?: string;
  notes?: string;
  rentalPlan?: RentalPlan;
  expectedEndDate?: number;
  totalAmount?: number;
  depositAmount?: number;
  amountPaid: number; 
  finesAmount?: number; 
  checklist?: string[];
  isSettled?: boolean; // Flag to track if payment/refund cycle is closed
}

export interface MaintenanceJob {
  id: string;
  vehicleId: string;
  storeId: string;
  status: 'Open' | 'Closed';
  description: string;
  createdAt: number;
  closedAt?: number;
}

export interface AuditLog {
  id: string;
  storeId: string;
  timestamp: number;
  type: 'VEHICLE' | 'BATTERY' | 'BOOKING' | 'MAINTENANCE' | 'SYSTEM';
  message: string;
  reason: string;
  operatorId: string;
}

export interface YanaState {
  stores: Store[];
  vehicles: Vehicle[];
  batteries: Battery[];
  customers: Customer[];
  bookings: Booking[];
  maintenanceJobs: MaintenanceJob[];
  logs: AuditLog[];
  activeStoreId: string;
  rentalRates: RentalRates;
}
