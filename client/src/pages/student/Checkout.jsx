import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, ArrowRight, AlertCircle, Sparkles, ShoppingBag } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import SlotPicker from '../../components/SlotPicker';
import Loader from '../../components/Loader';

const Checkout = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Date selection: today or tomorrow
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlotId(null);
        const res = await api.get(`/slots?date=${selectedDate}`);
        if (res.data.success) {
          setSlots(res.data.data);
        }
      } catch (err) {
        showToast('Failed to load slots for this date', 'error');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  if (cartItems.length === 0 && !completedOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">No items to checkout</h2>
        <p className="text-xs text-slate-500 mb-6">Please add dishes to your cart before selecting a time slot.</p>
        <Link to="/menu" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">
          Explore Menu
        </Link>
      </div>
    );
  }

  // --- ORDER SUCCESS VIEW ---
  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl text-center relative overflow-hidden">
          {/* Confetti or decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-orange-500 to-amber-400" />

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Pre-Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2">
            Ready for Pickup!
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Present this token number at the canteen pickup counter during your allocated slot time.
          </p>

          {/* Token Number Highlight Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Your Pickup Token
            </span>
            <div className="text-4xl sm:text-5xl font-black text-orange-600 tracking-wider my-1 font-mono">
              {completedOrder.tokenNumber}
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-700 text-xs font-semibold mt-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Slot: {completedOrder.slot?.label || 'Allocated Slot'}</span>
              <span>•</span>
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{new Date(completedOrder.orderDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Order Details Mini-list */}
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 text-xs space-y-2 border border-slate-100">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Order Items ({completedOrder.items?.length})
            </div>
            {completedOrder.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-semibold text-slate-800">₹{it.price * it.quantity}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Amount</span>
              <span className="text-orange-600">₹{completedOrder.totalAmount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/orders"
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 text-sm transition"
            >
              View in My Orders
            </Link>
            <Link
              to="/menu"
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
            >
              Order More Food
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- CHECKOUT FLOW ---
  const handlePlaceOrder = async () => {
    if (!selectedSlotId) {
      showToast('Please select a pickup time slot first', 'error');
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        orderDate: selectedDate,
        slot: selectedSlotId,
        items: cartItems.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setCompletedOrder(res.data.data);
        clearCart();
        showToast('Pre-order placed successfully!', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try another slot.';
      showToast(msg, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const selectedSlot = slots.find((s) => s._id === selectedSlotId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
        Select Pickup Slot
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Choose your pickup time so the canteen staff can prepare your meal fresh without crowd congestion.
      </p>

      {/* Date Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          1. Select Pickup Date
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayStr())}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
              selectedDate === getTodayStr()
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Today ({new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })})
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTomorrowStr())}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
              selectedDate === getTomorrowStr()
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })})
          </button>
        </div>
      </div>

      {/* Time Slot Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Choose Time Window
          </label>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Filling
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Full / Passed
            </span>
          </div>
        </div>

        <SlotPicker
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
          loading={loadingSlots}
        />
      </div>

      {/* Order Review Bottom Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-medium">Selected Pickup Window</div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            {selectedSlot ? selectedSlot.label : 'None selected yet'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Total Payable: <span className="font-extrabold text-orange-600 text-sm">₹{totalAmount}</span> ({cartItems.length} items)
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={!selectedSlotId || placingOrder}
          className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
        >
          {placingOrder ? (
            <>
              <Loader message="" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <span>Confirm & Place Pre-Order</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
