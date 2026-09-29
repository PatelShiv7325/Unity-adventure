import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Scene from "./components/Scene.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Activities from "./pages/Activities.jsx";
import ActivityDetails from "./pages/ActivityDetails.jsx";
import Booking from "./pages/Booking.jsx";
import Pay from "./pages/Pay.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Gallery from "./pages/Gallery.jsx";
import Terms from "./pages/Terms.jsx";
import JoyRides from "./pages/services/JoyRides.jsx";
import Training from "./pages/services/Training.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminActivities from "./pages/admin/AdminActivities.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminRevenue from "./pages/admin/AdminRevenue.jsx";
import AdminCoupons from "./pages/admin/AdminCoupons.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Scene kind="sky" className="page-bg" />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/activities/:slug" element={<ActivityDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/services/joy-rides" element={<JoyRides />} />
          <Route path="/services/training" element={<Training />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:slug" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/pay/:bookingId" element={<ProtectedRoute><Pay /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="coupons" element={<AdminCoupons />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  );
}