# Car Rental Management System

A modern Car Rental Management web application built with React, TypeScript, Vite, React Router, Firebase (Authentication + Cloud Firestore), and Google Gemini AI via secure serverless architecture.

## Tech Stack
- **React 19** + **TypeScript** (Strict mode)
- **Vite** (Frontend tooling & dev server with local serverless API proxy)
- **React Router v7** (Declarative client-side routing)
- **Firebase v11** (Authentication & Cloud Firestore)
- **Google Gemini API** (AI Car Recommendation Assistant via serverless backend)
- **Vercel Serverless Functions** (`api/recommend.ts` powered by `@vercel/node`)
- **Responsive CSS** (Modern, mobile-first design)

## Features
- **User Authentication**: Secure email & password registration, login, logout, and role assignment (`admin` | `customer`).
- **Car Catalog & Search**: Browse available vehicles with instant keyword search and filters (category, transmission, availability).
- **Vehicle Details**: View comprehensive vehicle specifications, daily pricing in IDR, and live availability.
- **Booking Management**: Reserve vehicles with pick-up/drop-off date pickers, real-time duration and pricing calculation, and double-booking conflict prevention.
- **Admin Portal**: Fleet CRUD management with inline validation and deletion confirmation dialogs, sample fleet seeder (8 cars in IDR), and full reservations management (Confirm, Complete, Cancel).
- **AI Recommendation Assistant (`/assistant`)**: Natural language vehicle advisor powered by Google Gemini AI. Evaluates passenger count, destinations, terrain, budget, and fuel preferences against available fleet inventory.

## Project Structure
```
car-rental-management-system/
├── api/
│   └── recommend.ts          # Vercel serverless function (Gemini AI API)
├── vercel.json               # SPA rewrites & serverless routing config
├── .env.example              # Environment variables template
├── .gitignore                # Ignored files (.env, .env.local, node_modules)
├── index.html                # Vite HTML entry point
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript root configuration
├── tsconfig.app.json         # Frontend TypeScript config
├── tsconfig.node.json        # Tooling & serverless TypeScript config
├── vite.config.ts            # Vite config with dev API middleware
└── src/
    ├── main.tsx              # Application entry point
    ├── App.tsx               # Route declarations & AuthProvider
    ├── index.css             # Responsive design system
    ├── types/                # Strict TypeScript interfaces
    │   ├── car.ts            # Car and CarInput types
    │   ├── booking.ts        # Booking and BookingInput types
    │   ├── user.ts           # User and UserRole types
    │   ├── ai.ts             # CarSummary, Recommendation, RecommendResponse
    │   └── index.ts
    ├── components/           # Reusable UI components
    │   ├── Navbar.tsx        # Responsive navigation bar
    │   ├── Footer.tsx        # App footer
    │   ├── Layout.tsx        # Shell layout
    │   ├── CarCard.tsx       # Fleet vehicle card
    │   ├── ProtectedRoute.tsx# Role & authentication route guard
    │   ├── LoadingSpinner.tsx# Loading indicator
    │   └── index.ts
    ├── pages/                # Application views
    │   ├── HomePage.tsx      # Landing page
    │   ├── LoginPage.tsx     # Customer & Admin login
    │   ├── RegisterPage.tsx  # Customer registration
    │   ├── CarsPage.tsx      # Fleet catalog with search & filters
    │   ├── CarDetailsPage.tsx# Details & live booking calculator
    │   ├── BookingsPage.tsx  # Customer reservation history & cancellation
    │   ├── AdminPage.tsx     # Admin fleet & booking management
    │   ├── AssistantPage.tsx # AI Car Recommendation Assistant
    │   ├── NotFoundPage.tsx  # 404 view
    │   └── index.ts
    ├── hooks/                # React custom hooks
    │   ├── useAuth.ts        # Authentication context hook
    │   ├── useCars.ts        # Fleet retrieval hook
    │   ├── useBookings.ts    # Reservations hook
    │   └── index.ts
    └── services/             # API & data services
        ├── firebase.ts       # Firebase app, auth, and firestore
        ├── carService.ts     # Car Firestore operations
        ├── bookingService.ts # Booking Firestore operations
        ├── aiService.ts      # AI Recommendation client service
        └── index.ts
```

## Routes
- `/` - Home landing page with hero banner & features
- `/login` - User login form
- `/register` - Customer registration form
- `/cars` - Fleet catalog and vehicle listings
- `/cars/:id` - Vehicle details and live reservation calculator
- `/bookings` - Customer's booking history and status tracking
- `/assistant` - AI Car Recommendation Assistant (Protected: logged-in users only)
- `/admin` - Administrative management dashboard (Protected: `admin` role only)

## Environment Configuration
Create a `.env.local` or `.env` file in the project root:

```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini AI Configuration (Server-side only; NEVER expose to client)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

> [!SECURITY]
> The `GEMINI_API_KEY` is kept strictly on the server (`api/recommend.ts`) and is never prefixed with `VITE_` or bundled into client code.

## Running Locally

### Option 1: Standard Vite Development Server (Recommended)
The built-in Vite dev server includes a middleware proxy that executes `api/recommend.ts` locally and reads `GEMINI_API_KEY` directly from `.env` or `.env.local`:

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 2: Vercel CLI Development Server
You can also run the project using the Vercel CLI to emulate the exact Vercel production edge runtime:

```bash
# Run with Vercel CLI
npx vercel dev
```

## Building for Production
```bash
npm run build
```
This runs TypeScript project compilation (`tsc -b`) and produces production assets in `dist/`.
