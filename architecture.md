
# YANA Ops CRM - Technical & Operational Architecture

## 1. Vision & Core Principles
YANA Ops CRM is a high-performance, store-first operational OS designed for intensive EV fleet management. It bridges the gap between physical "Zap Point" operations and enterprise-level asset tracking.

- **Store-First Scoping**: Data is natively isolated by `store_id`. Operators manage their specific location while Admins retain a "Global Network" view.
- **Audit-First Integrity**: Every manual override (status changes, master edits) requires a mandatory reason and generates an immutable `audit_logs` entry.
- **Revenue Protection Protocol**: Integrated financial gates prevent asset release without meeting specific collection thresholds.
- **Physical-Digital Synchronization**: Reflects the real-world state of hardware (Bikes + Batteries) in real-time using Supabase.

---

## 2. Domain Model (Database Alignment)

### 2.1 Core Entities & Schema Mapping
| Frontend Entity | Database Table | Key Attributes (DB Name) |
| :--- | :--- | :--- |
| **Store** | `stores` | `store_id` (PK), `name`, `location`, `state_name`, `target_rentals` |
| **Vehicle** | `vehicles` | `id` (PK), `store_id`, `plate_number`, `status`, `assigned_battery_id` |
| **Battery** | `batteries` | `id` (PK), `store_id`, `serial_number`, `status`, `assigned_vehicle_id` |
| **Customer** | `customers` | `id` (PK), `store_id`, `name`, `phone`, `aadhar_no`, `pan_no`, `bank_name`, `account_number`, `kyc_status` |
| **Booking** | `bookings` | `id` (PK), `customer_id`, `vehicle_id`, `status`, `rental_plan`, `total_amount`, `amount_paid`, `is_settled` |
| **Maintenance**| `maintenance_jobs` | `id` (PK), `vehicle_id`, `status`, `description`, `resolution_notes` |

---

## 3. Technical Stack & State Management

### 3.1 Backend: Supabase
The application communicates directly with Supabase via `@supabase/supabase-js`.
- **Row Level Security (RLS)**: Expected to be handled at the database level.
- **Real-time Sync**: Uses Postgres Channels to listen for changes and re-hydrate the frontend state instantly.

### 3.2 Frontend: React & custom hooks
The `useYanaData` hook serves as the "Controller," managing:
- **CamelCase Mapping**: Automatically translates between database `snake_case` and frontend `camelCase`.
- **Virtual Calculation**: Since the `bookings` schema lacks a dedicated `expected_return_date` column, the frontend dynamically computes it based on `started_at` + `rental_plan` duration (7 or 30 days).

---

## 4. Operational Guardrails & Business Logic

### 4.1 The "Revenue Protection Gate"
To ensure cash-flow stability and asset security, the system enforces a strict dispatch barrier based on the rental duration:
- **Weekly Plans**: Require **100% Payment** (Rent + Deposit + Fines) before dispatch.
- **Monthly Plans**: Require **Flat ₹4000 Payment** before dispatch.
- **UI Feedback**: The progress bar in the Operator Portal turns amber/red if the specific threshold is not met, locking the "Dispatch" action.

### 4.2 Auto-Pausing & Liability
- **Logic**: During a **Vehicle Swap**, if damage is recorded, the fine is added to `fines_amount`.
- **System Action**: If the new total liability reduces the rider's paid coverage below the plan's threshold (100% for Weekly / Flat ₹4000 for Monthly), the booking is automatically set to `PAUSED`. The operator is prompted to collect the difference immediately.

### 4.3 Checklist-Driven Inspection
Inspection is strictly structured. Specific checklist items (e.g., "Fan", "Wheel Puncture", "Key Missing") have standardized fine values. Selecting these during return updates the `fines_amount` and the `checklist` JSON array in the database.

---

## 5. Financial Settlement & Tax
- **GST Logic**: Applied to base rental plans (Weekly/Monthly) as defined in `global_config`.
- **Security Deposit**: Handled as a non-taxable liability.
- **Settlement Lifecycle**: 
  1. **Return**: Ride marked `COMPLETED`. Fleet assets return to `AVAILABLE`.
  2. **Clearance Ticket**: A "Settlement Ticket" stays open until `is_settled` is true.
  3. **Refund Calculation**: `Deposit - Fines`. 
  4. **Closure**: Store Admin confirms physical refund and marks the record `is_settled = true`.

---

## 6. Portal Access Matrix
- **Admin**: Full terminal configuration, global pricing, asset migration between stores, and bulk data imports.
- **Operator**: Store-level fleet control, rider dispatch, damage assessment, and cash collection.
- **Rider**: Mobile-first portal for self-onboarding, tracking current rides, and viewing settlement banking details.
