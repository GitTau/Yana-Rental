import { Store, Vehicle, Battery, Customer, VehicleStatus, BatteryStatus, RentalRates } from './types';

export const MOCK_OPERATOR_ID = 'OP-7742';

export const DEFAULT_RATES: RentalRates = {
  weeklyRate: 1500,
  monthlyRate: 5000,
  securityDeposit: 2000,
  gstPercentage: 18
};

// --- CSV DATA STRINGS ---

export const STORES_CSV = `id,name,location,state,targetRentals
s1,ZAP POINT OD 01,"Saheed Nagar, Bhubaneswar",Odisha,25
s2,ZAP POINT OD 02,"Badambadi, Cuttack",Odisha,15
s3,ZAP POINT JH 01,"Main Road, Jamshedpur",Jharkhand,10`;

export const VEHICLES_CSV = `id,plateNumber,storeId,status
v-1,YEV-OD-001,s1,Available
v-2,YEV-OD-002,s1,Available
v-3,YEV-OD-003,s1,Available
v-4,YEV-OD-004,s1,Available
v-5,YEV-OD-005,s1,Maintenance
v-6,YEV-OD-010,s2,Available
v-7,YEV-OD-011,s2,In Use
v-8,YEV-OD-012,s2,Available
v-9,YEV-JH-101,s3,Available
v-10,YEV-JH-102,s3,Available`;

export const BATTERIES_CSV = `id,serialNumber,storeId,status
b-1,BAT-ALPHA-01,s1,Available
b-2,BAT-ALPHA-02,s1,Available
b-3,BAT-ALPHA-03,s1,Available
b-4,BAT-BETA-01,s2,Available
b-5,BAT-BETA-02,s2,In Use
b-6,BAT-BETA-03,s2,Available
b-7,BAT-GAMA-01,s3,Available
b-8,BAT-GAMA-02,s3,Available
b-9,BAT-GAMA-03,s3,Maintenance
b-10,BAT-GAMA-04,s3,Available`;

export const CUSTOMERS_CSV = `id,name,phone,email,kycStatus,agreementAccepted,storeId
c1,Rohan Sharma,9876543210,rohan@yana.in,true,true,s1
c2,Priya Das,8765432109,priya@yana.in,true,true,s1
c3,Amit Kumar,7654321098,amit@yana.in,true,true,s2
c4,Subhashree Jena,9437012345,subha@yana.in,false,false,s2
c5,Debasish Roy,9007012345,deba@yana.in,true,true,s3
c6,Ananya Chatterjee,9830054321,ananya@yana.in,false,false,s3`;

// Helper to parse CSV strings into objects
export const parseCSV = <T>(csv: string): T[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      let val: any = values[index];
      // Convert booleans
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      // Convert numbers (new targetRentals field)
      if (!isNaN(val) && val !== '') val = Number(val);
      
      obj[header.trim()] = val;
    });
    return obj as T;
  });
};

export const getSeedDataFromCSV = () => {
  return {
    stores: parseCSV<Store>(STORES_CSV),
    vehicles: parseCSV<Vehicle>(VEHICLES_CSV),
    batteries: parseCSV<Battery>(BATTERIES_CSV),
    customers: parseCSV<Customer>(CUSTOMERS_CSV),
  };
};