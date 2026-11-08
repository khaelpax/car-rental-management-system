import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components';
import { AuthProvider } from './context';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  CarsPage,
  CarDetailsPage,
  BookingsPage,
  AdminPage,
  AssistantPage,
  NotFoundPage,
} from './pages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="cars" element={<CarsPage />} />
            <Route path="cars/:id" element={<CarDetailsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route
              path="assistant"
              element={
                <ProtectedRoute>
                  <AssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
