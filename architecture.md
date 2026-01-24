# YANA Ops CRM - Technical Architecture

## 1. Vision & Core Principles
YANA Ops CRM is a store-first operational OS designed for high-frequency EV fleet management. 
- **Operational Scoping**: Every data point is isolated by `storeId` but accessible via a global `Admin` context.
- **Audit-First**: No manual override occurs without a reason and a corresponding entry in the `AuditLog`.
- **Constraint-Driven**: Prevent "illegal" states (e.g., booking a vehicle that is already in use or in maintenance).

---

## 2. Domain Model (Data Structures)

### 2.1 Core Entities (`types.ts`)
| Entity | Key Properties | Purpose |
| :--- | :--- | :--- |
| **Store** | `id`, `name`, `targetRentals` | The physical hub. Includes performance goals set by Admin. |
| **Vehicle** | `id`, `storeId`, `status`, `plateNumber` | The physical EV asset. Tracked in the Master Fleet Registry. |
| **Battery** | `id`, `storeId`, `serialNumber` | The power asset. Tracked in the Master Fleet Registry. |
| **Customer** | `id`, `kycStatus`, `phone`, `aadharNo` | The Rider/Subscriber. Includes full PII from Requisition form. |
| **Booking** | `id`, `expectedEndDate`, `amountPaid` | The central transaction record. Handles lifecycle and overdue logic. |

---

## 3. State Management (`useYanaData.ts`)

### 3.1 Central State Tree
The state is managed in a single object `YanaState` and persisted to `localStorage` under `yana_ops_v1_state`.
- **Hydration**: System seeds data from CSV strings (including Rental Targets) on first load.
- **Store Target Logic**: Admins define `targetRentals` per store to drive localized operational focus.

---

## 4. Operational Logic & Algorithms

### 4.1 Performance KPIs (Operator Dashboard)
- **Rent Ratio**: Actual `ACTIVE` bookings vs `Store.targetRentals`.
- **Idle Count**: Count of vehicles where `status === AVAILABLE`.
- **Overdue Detection**: Calculated as `now - Booking.expectedEndDate`. Triggers UI alerts in Ops Portal.
- **Pending Collection**: Count of records where `balance > 0 && !isSettled`.

### 4.2 Financial Settlement & Tax Logic
- **GST Calculation**: A configurable `gstPercentage` (e.g., 18%) is applied only to base rental rates.
- **Security Deposit**: Exempt from GST. Tracked separately in settlements.

---

## 5. Portals & Permissions
- **Admin**: Configures Store targets, global tax rates, and handles asset migration.
- **Operator**: Uses the **Overview Dashboard** to track daily goals, return dates, and stock levels.
- **Rider**: Profile management and Onboarding Wizard.

---

## 8. Onboarding Wizard (PDF Alignment)
- **Section A**: Personal Identity.
- **Documents**: Statutory IDs (Aadhar/PAN) and Emergency contacts.
- **Schedule**: Operational subscription window.
- **Legal (Section B & C)**: Explicit privacy and SOP consent tracking.
