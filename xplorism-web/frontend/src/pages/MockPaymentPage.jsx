import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check } from 'lucide-react';
import { api } from '../services/api';

export default function MockPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const booking = state.bookingData || {};

  useEffect(() => {
    // Ensure page opens scrolled to top
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } catch (e) {
      // ignore
    }
  }, []);

  const formattedAmount = booking.finalLocalPrice ? `${booking.currency.symbol}${booking.finalLocalPrice}` : '';
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      // Call backend to create a simulated booking
      const payload = {
        bookingHotel: booking.bookingHotel,
        roomType: booking.roomType,
        guests: booking.guests,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        price: booking.rawUSDPrice,
        associatedTrip: booking.associatedTrip,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail
      };

      let apiResp = null;
      try {
        apiResp = await api.post('/bookings', payload);
      } catch (err) {
        // If API fails (e.g., not authenticated), continue with client-side simulation
        console.warn('Booking API failed, falling back to client simulation.', err.message);
      }

      const confNum = apiResp?.booking?.id || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      const bookingConfirm = {
        confirmationNumber: confNum,
        paymentId: `pay_${Math.random().toString(36).substring(2, 11)}`,
        hotelName: booking.bookingHotel?.name || 'Hotel',
        roomType: booking.roomType,
        guests: booking.guests,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        price: booking.rawUSDPrice,
        associatedTrip: booking.associatedTrip || 'General Dashboard'
      };

      navigate('/hotels', { state: { bookingConfirm } });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <Navbar activeTab="hotels" />
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-2xl border p-6 shadow-xl bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="text-xl font-extrabold mb-2">Mock Razorpay Checkout</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">This is a simulated payment page for student project purposes — no real transactions will occur.</p>

          <div className="rounded-xl p-4 bg-[var(--bg-primary)] border mb-4" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{booking.bookingHotel?.name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{booking.roomType}</div>
              </div>
              <div className="text-lg font-extrabold text-rose-500">{formattedAmount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border text-xs font-bold"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Simulate Payment</span>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
