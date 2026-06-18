# AgriSubsidy System v2.0 — AGRIFOP
### Digital Input & Subsidy Management System for Agricultural Cooperatives
**Kigali, Rwanda**

---

## 📁 Project Structure

```
agrisubsidy-refactored/
├── backend/                     Node.js + Express + TypeScript + Sequelize + PostgreSQL
│   ├── src/
│   │   ├── index.ts             Server entry point
│   │   ├── types/
│   │   │   └── index.ts         ← NEW: All shared TypeScript interfaces
│   │   ├── config/
│   │   │   ├── database.ts      Sequelize connection + sync
│   │   │   └── seed.ts          Database seed script
│   │   ├── models/
│   │   │   ├── User.ts          User model (with password hashing hooks)
│   │   │   ├── Cooperative.ts   Cooperative model
│   │   │   ├── index.ts         All other models (Farmer, Input, Subsidy, etc.)
│   │   │   └── associations.ts  All FK relationships
│   │   ├── middleware/
│   │   │   └── auth.ts          JWT authenticate + authorize middleware
│   │   ├── controllers/         ← REFACTORED: Split from one 350-line file
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── cooperative.controller.ts
│   │   │   ├── subsidy.controller.ts
│   │   │   ├── input.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── index.ts         Barrel re-export (backward compatible)
│   │   ├── routes/              ← REFACTORED: Split from one 100-line file
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── cooperative.routes.ts
│   │   │   ├── subsidy.routes.ts
│   │   │   ├── input.routes.ts
│   │   │   ├── distribution.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── index.ts         Clean route aggregator
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── subsidy.service.ts
│   │   │   ├── input.service.ts
│   │   │   └── analytics.service.ts
│   │   └── utils/
│   │       ├── jwt.ts           Token generation & validation
│   │       ├── response.ts      sendSuccess / sendError / buildPagination
│   │       └── logger.ts        Winston logger
│   ├── .env.example             Copy to .env and fill in your DB credentials
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                    React + TypeScript + Vite + Tailwind CSS
    └── src/
        ├── App.tsx              All routes (unchanged)
        ├── api/
        │   └── client.ts        Axios client + all API functions (unchanged)
        ├── contexts/
        │   └── AuthContext.tsx  Auth state (unchanged)
        ├── types/
        │   └── index.ts         ← NEW: All shared TypeScript interfaces
        ├── constants/
        │   └── index.ts         ← NEW: CROP_TYPES, PROVINCES, ROUTES, QUERY_KEYS
        ├── utils/
        │   ├── index.ts         ← NEW: timeAgo(), formatCurrency(), getStatusBadge()
        │   └── validation.ts    ← NEW: validateRegistrationStep(), validatePasswordChange()
        ├── hooks/
        │   └── index.ts         ← NEW: useAdminDashboard(), useFarmerDashboard(), etc.
        ├── components/
        │   └── common/
        │       └── index.tsx    ← NEW: StatCard, FormField, StatusBadge, EmptyState, etc.
        ├── features/            ← REFACTORED: Feature-based architecture
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx    (cursor-loss bug fixed)
        │   ├── admin/
        │   │   ├── AdminDashboard.tsx  (refactored)
        │   │   ├── AdminLayout.tsx
        │   │   ├── AdminPages.tsx
        │   │   ├── UserApproval.tsx
        │   │   ├── CooperativeManagement.tsx
        │   │   ├── InputCatalog.tsx
        │   │   ├── DistributionSchedule.tsx
        │   │   ├── DistributionReceipt.tsx
        │   │   └── AdminBeneficiaryDatabase.tsx
        │   ├── farmer/
        │   │   ├── FarmerDashboard.tsx (refactored)
        │   │   ├── FarmerLayout.tsx
        │   │   ├── FarmerInputs.tsx
        │   │   ├── FarmerSubsidies.tsx
        │   │   ├── ProfilePage.tsx
        │   │   ├── SecurityPage.tsx
        │   │   └── NotificationsPage.tsx
        │   └── cooperative/
        │       ├── CoopDashboard.tsx
        │       ├── CoopLayout.tsx
        │       ├── CoopProfile.tsx
        │       ├── InputDistribution.tsx
        │       ├── BeneficiaryDatabase.tsx
        │       └── ReportsPage.tsx
        └── pages/               Original pages (for backward compatibility)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Database Setup

```sql
-- In psql or pgAdmin:
CREATE DATABASE agrisubsidy_db;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set:
#   DB_PASSWORD=your_postgres_password
#   JWT_SECRET=any_random_32+_char_string

# Start the server
npm run dev

# Seed the database (first time, separate terminal)
npm run seed
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

---

## 🔑 Default Login Credentials (after seeding)

| Role        | Email                           | Password     |
|-------------|----------------------------------|--------------|
| Admin       | admin@agrifop.rw                | Admin@123    |
| Cooperative | eric.habimana@agrifop.rw        | Coop@123     |
| Farmer      | jean.uwimana@agrifop.rw         | Farmer@123   |

---

## 🌐 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| POST   | /auth/register            | —    | Register new user        |
| POST   | /auth/login               | —    | Login                    |
| POST   | /auth/refresh             | —    | Refresh access token     |
| POST   | /auth/logout              | ✅   | Logout                   |
| GET    | /auth/profile             | ✅   | Get own profile          |
| PUT    | /auth/change-password     | ✅   | Change password          |

### Users (Admin only)
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /users                    | List all users (filtered)|
| PATCH  | /users/:id/status         | Approve/suspend user     |

### Cooperatives
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /cooperatives             | List cooperatives        |
| POST   | /cooperatives             | Create (admin)           |
| PUT    | /cooperatives/:id         | Update (admin)           |
| GET    | /cooperatives/:id/farmers | List cooperative farmers |

### Subsidies
| Method | Endpoint                             | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | /subsidies/programs                  | List programs            |
| POST   | /subsidies/programs                  | Create program (admin)   |
| PUT    | /subsidies/programs/:id              | Update program (admin)   |
| GET    | /subsidies/applications              | List applications        |
| POST   | /subsidies/applications              | Apply (farmer)           |
| PATCH  | /subsidies/applications/:id/review   | Approve/reject           |
| PATCH  | /subsidies/applications/:id/disburse | Record disbursement      |

### Inputs & Distributions
| Method | Endpoint                      | Description               |
|--------|-------------------------------|---------------------------|
| GET    | /inputs                       | List inputs               |
| POST   | /inputs                       | Create input              |
| PUT    | /inputs/:id                   | Update input              |
| GET    | /inputs/categories            | List categories           |
| GET    | /inputs/low-stock             | Low stock alerts          |
| GET    | /distributions                | List distributions        |
| POST   | /distributions                | Create distribution       |
| PATCH  | /distributions/:id/approve    | Approve distribution      |

### Analytics
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /analytics/admin                 | Admin dashboard data     |
| GET    | /analytics/farmer                | Farmer dashboard data    |
| GET    | /analytics/cooperative           | Cooperative dashboard    |
| GET    | /analytics/subsidy-analytics     | Subsidy analytics        |
| GET    | /analytics/inventory             | Inventory stats          |
| GET    | /analytics/audit-logs            | System audit logs        |

---

## 🔧 Key Refactoring Changes

### Backend

#### Before: `controllers/index.ts` (350+ lines, 6 controllers in 1 file)
```
controllers/
└── index.ts    ← everything
```

#### After: One controller per domain
```
controllers/
├── auth.controller.ts
├── user.controller.ts
├── cooperative.controller.ts
├── subsidy.controller.ts
├── input.controller.ts
├── analytics.controller.ts
├── notification.controller.ts
└── index.ts    ← barrel re-export, backward compatible
```

#### Before: `routes/index.ts` (100+ lines, all routes inline)
```
routes/
└── index.ts    ← everything
```

#### After: One router per domain
```
routes/
├── auth.routes.ts
├── user.routes.ts
├── cooperative.routes.ts
├── subsidy.routes.ts
├── input.routes.ts
├── distribution.routes.ts
├── analytics.routes.ts
├── notification.routes.ts
└── index.ts    ← clean aggregator
```

### Frontend

#### Critical Bug Fixed
`RegisterPage.tsx` defined the `Field` component inside the render function, causing React to destroy and recreate the input DOM element on every keystroke — losing cursor focus. Fixed by extracting it to `components/common/FormField`.

#### New Shared Layers
- `types/index.ts` — All TypeScript interfaces (no more `any` casts)
- `constants/index.ts` — CROP_TYPES, PROVINCES, ROUTES, QUERY_KEYS
- `utils/index.ts` — timeAgo(), formatCurrency() (previously duplicated)
- `utils/validation.ts` — Form validation (previously inline in RegisterPage)
- `hooks/index.ts` — useAdminDashboard(), useFarmerDashboard(), useNotifications()
- `components/common/` — StatCard, FormField, StatusBadge, EmptyState, PageHeader

---

## 📝 Environment Variables

```env
# Backend .env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrisubsidy_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_32_char_secret_here
JWT_EXPIRES_IN=15m
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
```

```env
# Frontend .env
VITE_API_URL=http://localhost:5000/api/v1
```
