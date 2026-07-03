import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import VerifyPhone from './pages/VerifyPhone.jsx';
import Artisans from './pages/Artisans.jsx';
import ArtisanProfile from './pages/ArtisanProfile.jsx';
import BookingPage from './pages/BookingPage.jsx';
import Notifications from './pages/Notifications.jsx';
import PaymentCallback from './pages/PaymentCallback.jsx';
import ClientDashboard from './pages/client/ClientDashboard.jsx';
import ArtisanDashboard from './pages/artisan/ArtisanDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/artisans" element={<Artisans />} />
          <Route path="/artisans/:id" element={<ArtisanProfile />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />

          <Route path="/verify-phone" element={<ProtectedRoute><VerifyPhone /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/book/:artisanId" element={<ProtectedRoute roles={['client']}><BookingPage /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/artisan/*" element={<ProtectedRoute roles={['artisan']}><ArtisanDashboard /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
