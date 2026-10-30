import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Utensils
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';

const statuses = ['All', 'Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'];

const ManageOrders = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSlot, setSelectedSlot] = useState('All');
  const [search, setSearch] = useState('');

  const [orders, setOrders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const { showToast } = useToast();

  const fetchOrdersAndSlots = async () => {
    try {
      setLoading(true);
      const [ordersRes, slotsRes] = await Promise.all([
        api.get(`/orders?date=${selectedDate}&status=${selectedStatus}&slot=${selectedSlot}`),
        api.get('/slots/admin')
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (slotsRes.data.success) setSlots(slotsRes.data.data);
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndSlots();
  }, [selectedDate, selectedStatus, selectedSlot]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Order status updated to "${newStatus}"`, 'success');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update order status';
      showToast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Next status shortcut
  const getNextStatus = (current) => {
    switch (current) {
      case 'Placed':
        return 'Preparing';
      case 'Preparing':
        return 'Ready';
      case 'Ready':
        return 'Collected';
      default:
        return null;
    }
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

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const tokenMatch = o.tokenNumber?.toLowerCase().includes(term);
    const nameMatch = o.user?.name?.toLowerCase().includes(term);
    const rollMatch = o.user?.rollNumber?.toLowerCase().includes(term);
    return tokenMatch || nameMatch || rollMatch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Fulfillment Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process pre-orders through Placed → Preparing → Ready → Collected.
          </p>
        </div>

        <button
          onClick={fetchOrdersAndSlots}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Slot Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Clock className="w-4 h-4 text-orange-500" />
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Pickup Slots</option>
              {slots.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by token (e.g. A-102) or student name..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <Loader message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          No orders found matching the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70 border-b border-slate-200">
                  <th className="py-3 px-4">Token & Slot</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-4">Ordered Dishes</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Update Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const nextStatus = getNextStatus(order.status);

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition">
                      {/* Token & Slot */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
                            {order.tokenNumber}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">
                              {order.slot?.label || 'Pickup Window'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{order.user?.name || 'Student'}</div>
                        <div className="text-[10px] text-slate-400">
                          {order.user?.rollNumber || order.user?.email}
                        </div>
                      </td>

                      {/* Dishes */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-slate-700">
                              <span className="font-bold text-slate-900">{it.quantity}x</span> {it.name}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 text-sm">
                        ₹{order.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Action / Next status */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusChange(order._id, nextStatus)}
                              disabled={updatingId === order._id}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <span>Advance to {nextStatus}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Manual Dropdown Override */}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={updatingId === order._id}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
                          >
                            {['Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
