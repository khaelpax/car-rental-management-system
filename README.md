# Car Rental Management System

A modern Car Rental Management web application built with React, TypeScript, Vite, React Router, and Firebase (Authentication + Cloud Firestore).

## Tech Stack
- **React 19** + **TypeScript** (Strict mode, no plain JavaScript)
- **Vite** (Next generation frontend build tooling)
- **React Router v7** (Declarative client-side routing)
- **Firebase v11** (Authentication & Cloud Firestore)
- **Responsive CSS** (Mobile-first, modern responsive UI layout)

## Project Structure
```
car-rental-management-system/
├── .env                  # Firebase configuration with VITE_FIREBASE_* variables
├── .env.example          # Template for environment variables
├── index.html            # Vite HTML entry point
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── src/
    ├── main.tsx          # Application entry point
    ├── App.tsx           # Route configuration & app setup
    ├── index.css         # Responsive styling system
    ├── vite-env.d.ts     # Vite environment types
    ├── types/            # TypeScript interfaces
    │   ├── car.ts        # Car, CarCategory, TransmissionType, FuelType
    │   ├── booking.ts    # Booking, BookingStatus, PaymentStatus
    │   ├── user.ts       # User, UserRole
    │   └── index.ts
    ├── components/       # Reusable components with typed props
    │   ├── Navbar.tsx    # Responsive header navigation
    │   ├── Footer.tsx    # App footer
    │   ├── Layout.tsx    # Common page wrapper with Outlet
    │   ├── CarCard.tsx   # Typed car listing card
    │   ├── ProtectedRoute.tsx # Auth & role-based route guard
    │   ├── LoadingSpinner.tsx # Configurable loading spinner
    │   └── index.ts
    ├── pages/            # Page views for all application routes
    │   ├── HomePage.tsx      # Route: /
    │   ├── LoginPage.tsx     # Route: /login
    │   ├── RegisterPage.tsx  # Route: /register
    │   ├── CarsPage.tsx      # Route: /cars
    │   ├── CarDetailsPage.tsx# Route: /cars/:id
    │   ├── BookingsPage.tsx  # Route: /bookings
    │   ├── AdminPage.tsx     # Route: /admin
    │   ├── NotFoundPage.tsx  # Route: *
    │   └── index.ts
    ├── hooks/            # Custom React hooks
    │   ├── useAuth.ts        # Authentication state hook
    │   ├── useCars.ts        # Car fleet fetching hook
    │   ├── useBookings.ts    # User bookings fetching hook
    │   └── index.ts
    └── services/         # Firebase & data services
        ├── firebase.ts       # Firebase app, auth, and db initialization
        ├── carService.ts     # Car Firestore operations scaffold
        ├── bookingService.ts # Booking Firestore operations scaffold
        └── index.ts
```

## Routes
- `/` - Home landing page with hero banner & feature highlights
- `/login` - User login form
- `/register` - User registration form
- `/cars` - Fleet catalog and car listings
- `/cars/:id` - Detailed car information & reservation entry
- `/bookings` - User's booking history and status
- `/admin` - Administrative management dashboard

## Environment Configuration
Set your Firebase project credentials in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
