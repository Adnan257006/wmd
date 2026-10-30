import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, CheckCircle2, XCircle, ArrowRight, Utensils, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const { showToast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      showToast('Failed to fetch your orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(orderId);
      const res = await api.put(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        showToast('Order cancelled successfully', 'success');
        fetchOrders();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel order';
      showToast(msg, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  // Helper to check if an order is eligible for cancellation
  const getCancellationStatus = (order) => {
    if (order.status !== 'Placed') {
      return { canCancel: false, reason: `Status is ${order.status}` };
    }

    if (!order.slot || !order.slot.startTime) {
      return { canCancel: true, reason: '' };
    }

    const [hours, minutes] = order.slot.startTime.split(':').map(Number);
    const slotDateTime = new Date(order.orderDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    const diffMs = slotDateTime.getTime() - Date.now();
    const thirtyMinutesMs = 30 * 60 * 1000;

    if (diffMs < thirtyMinutesMs) {
      return {
        canCancel: false,
        reason: 'Within 30 mins of pickup slot'
      };
    }

    return { canCancel: true, reason: '' };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Preparing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Collected':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'All' ? true : o.status === statusFilter
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            My Order History
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your meal preparation status and view your pickup tokens.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {['All', 'Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <Loader message="Loading your orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <Utensils className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg mb-1">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            You don't have any orders {statusFilter !== 'All' ? `with status "${statusFilter}"` : 'yet'}. Check out today's specials!
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition"
          >
            Browse Today's Menu
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const cancelStatus = getCancellationStatus(order);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition overflow-hidden"
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    {/* Token Number */}
                    <div className="bg-orange-500 text-white font-black text-sm sm:text-base px-3 py-1.5 rounded-xl font-mono shadow-xs">
                      {order.tokenNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(order.orderDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.slot?.label || 'Pickup Window'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-bold text-slate-900">
                          ₹{it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-slate-100 gap-3">
                    <div className="text-xs text-slate-500">
                      Total Bill:{' '}
                      <span className="font-extrabold text-slate-900 text-base">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    {/* Cancellation Button / Notice */}
                    {order.status === 'Placed' && (
                      <div className="flex items-center gap-2">
                        {cancelStatus.canCancel ? (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancellingId === order._id}
                            className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
                          >
                            {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Non-cancellable ({cancelStatus.reason})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
