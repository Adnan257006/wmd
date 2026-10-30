import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  RefreshCw,
  ShoppingBag,
  IndianRupee,
  Clock,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Utensils,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';

const Dashboard = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [summary, setSummary] = useState(null);
  const [itemDemand, setItemDemand] = useState([]);
  const [slotDemand, setSlotDemand] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      const [summaryRes, itemsRes, slotsRes, forecastRes] = await Promise.all([
        api.get(`/dashboard/summary?date=${selectedDate}`),
        api.get(`/dashboard/demand-by-item?date=${selectedDate}`),
        api.get(`/dashboard/demand-by-slot?date=${selectedDate}`),
        api.get(`/dashboard/forecast?date=${selectedDate}`)
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (itemsRes.data.success) setItemDemand(itemsRes.data.data);
      if (slotsRes.data.success) setSlotDemand(slotsRes.data.data);
      if (forecastRes.data.success) setForecast(forecastRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error loading dashboard analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, showToast]);

  useEffect(() => {
    fetchDashboardData();

    // 30 seconds auto polling as specified in prompt section 4.2
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return <Loader message="Compiling demand analytics & forecast..." />;
  }

  // Pre-calculate busy slots count
  const busySlotsCount = slotDemand.filter((s) => s.isBusy).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Demand Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time pre-orders, slot occupancy, and kitchen preparation forecast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl border border-orange-200 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={summary?.totalOrders || 0}
          note={`${summary?.activeOrders || 0} active, ${summary?.statusCounts?.Cancelled || 0} cancelled`}
          icon={ShoppingBag}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${summary?.totalRevenue || 0}`}
          note="Pre-ordered meal value"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Food Portions"
          value={summary?.totalItemsOrdered || 0}
          note="Total meal items ordered"
          icon={Utensils}
          color="blue"
        />
        <StatCard
          title="Congestion Status"
          value={busySlotsCount > 0 ? `${busySlotsCount} Busy` : 'Normal Flow'}
          note={`${slotDemand.length} total pickup slots`}
          icon={Clock}
          color={busySlotsCount > 0 ? 'amber' : 'purple'}
        />
      </div>

      {/* Order Status Breakdown Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Order Pipeline Status ({summary?.totalOrders || 0} Total)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Placed', count: summary?.statusCounts?.Placed || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Preparing', count: summary?.statusCounts?.Preparing || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Ready', count: summary?.statusCounts?.Ready || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Collected', count: summary?.statusCounts?.Collected || 0, color: 'bg-slate-100 text-slate-700 border-slate-200' },
            { label: 'Cancelled', count: summary?.statusCounts?.Cancelled || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
          ].map((s) => (
            <div key={s.label} className={`p-3 rounded-2xl border text-center ${s.color}`}>
              <div className="text-xl font-extrabold">{s.count}</div>
              <div className="text-xs font-semibold uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demand by Item */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Demand by Food Item</h2>
                <p className="text-xs text-slate-500">Portions ordered for {selectedDate}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg">
                Top Sellers
              </span>
            </div>

            {itemDemand.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No orders placed yet for this date.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemDemand.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val) => [`${val} portions`, 'Ordered']}
                    />
                    <Bar dataKey="quantity" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Mini Table Summary */}
          {itemDemand.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-center">Category</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itemDemand.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="py-1.5 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-1.5 text-center text-slate-500">{item.category}</td>
                      <td className="py-1.5 text-right font-bold text-orange-600">{item.quantity}</td>
                      <td className="py-1.5 text-right font-semibold text-slate-700">₹{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Demand by Time Slot */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Demand by Time Slot</h2>
                <p className="text-xs text-slate-500">Booked orders vs capacity (highlighting &gt;80% busy slots)</p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Booked
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Capacity
                </span>
              </div>
            </div>

            {slotDemand.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No slots configured.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slotDemand} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="startTime"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val, name) => [
                        `${val} orders`,
                        name === 'booked' ? 'Booked' : 'Capacity'
                      ]}
                    />
                    <Bar dataKey="capacity" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="booked" radius={[6, 6, 0, 0]}>
                      {slotDemand.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isBusy ? '#ea580c' : '#f97316'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Slots Status Chips */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {slotDemand.map((slot) => (
              <div
                key={slot.slotId}
                className={`p-2.5 rounded-xl border text-xs ${
                  slot.isBusy
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{slot.startTime}</span>
                  {slot.isBusy && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded">
                      Busy
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {slot.booked}/{slot.capacity} orders ({slot.percentFilled}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Tomorrow's Demand Forecast Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Tomorrow's Demand Forecast & Kitchen Preparation Guide
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated orders calculated from 4-week same-weekday history + 10% safety buffer, minus 50% average recent wastage leftovers.
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Algorithm: 4-Wk Moving Avg + Wastage Feedback
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 pb-3">
                <th className="py-2.5 px-3">Menu Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Hist. Forecast (Avg × 1.1)</th>
                <th className="py-2.5 px-3 text-right">7-Day Avg Leftover</th>
                <th className="py-2.5 px-4 text-right bg-orange-50 text-orange-700 rounded-t-xl font-extrabold">
                  Recommended Prepare
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.map((item) => (
                <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{item.category}</td>
                  <td className="py-3 px-3 text-right text-slate-700 font-semibold">₹{item.price}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {item.forecast} portions
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {item.avgLeftover > 0 ? `${item.avgLeftover} portions` : 'Minimal'}
                  </td>
                  <td className="py-3 px-4 text-right bg-orange-50/70 font-extrabold text-sm text-orange-600">
                    {item.suggestedPrepare} portions
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
