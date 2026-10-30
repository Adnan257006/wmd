import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  Scale,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Utensils
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';

const Wastage = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [menuItems, setMenuItems] = useState([]);
  const [wastageEntries, setWastageEntries] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, wastageRes] = await Promise.all([
        api.get('/menu'),
        api.get(`/wastage?date=${selectedDate}&days=7`)
      ]);

      if (itemsRes.data.success) {
        setMenuItems(itemsRes.data.data);

        // Pre-fill existing entries if found for selectedDate
        const entriesMap = {};
        if (wastageRes.data.success) {
          wastageRes.data.dayEntries.forEach((entry) => {
            const mId = entry.menuItem?._id || entry.menuItem;
            entriesMap[mId] = {
              prepared: entry.prepared,
              leftover: entry.leftover
            };
          });
          setTrendData(wastageRes.data.trend || []);
        }

        // Initialize missing items with zero
        itemsRes.data.data.forEach((item) => {
          if (!entriesMap[item._id]) {
            entriesMap[item._id] = { prepared: 0, leftover: 0 };
          }
        });

        setWastageEntries(entriesMap);
      }
    } catch (err) {
      showToast('Failed to load wastage data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleInputChange = (itemId, field, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setWastageEntries((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: num
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const entries = Object.keys(wastageEntries).map((itemId) => ({
        menuItem: itemId,
        prepared: wastageEntries[itemId].prepared || 0,
        leftover: wastageEntries[itemId].leftover || 0
      }));

      const res = await api.post('/wastage', {
        date: selectedDate,
        entries
      });

      if (res.data.success) {
        showToast(`Wastage audit saved for ${selectedDate}`, 'success');
        loadData();
      }
    } catch (err) {
      showToast('Failed to record wastage entries', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading food wastage analytics..." />;
  }

  // Calculate day totals
  const totalPreparedDay = Object.values(wastageEntries).reduce((a, b) => a + (b.prepared || 0), 0);
  const totalLeftoverDay = Object.values(wastageEntries).reduce((a, b) => a + (b.leftover || 0), 0);
  const dayWastagePct =
    totalPreparedDay > 0 ? ((totalLeftoverDay / totalPreparedDay) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            End-of-Day Food Wastage Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log actual prepared dishes and unsold leftovers to calibrate tomorrow's AI forecast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Reload data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Wastage Trend Line Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">7-Day Kitchen Wastage Trend</h2>
            <p className="text-xs text-slate-500">Prepared portions vs leftover food discarded/carried forward</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">
              Selected Day Waste Rate: <span className="text-rose-600 font-extrabold">{dayWastagePct}%</span>
            </span>
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            No historical wastage records for this window.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val, name) => [
                    `${val} portions`,
                    name === 'totalPrepared' ? 'Prepared' : 'Leftover'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="totalPrepared"
                  name="Total Prepared"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalLeftover"
                  name="Leftover (Wasted)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Audit Entry Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Portion Audit for {selectedDate}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter total cooked portions and leftover remaining at canteen closing.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50 self-start sm:self-auto active:scale-98"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Entries...' : 'Save Wastage Audit'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70 border-b border-slate-200">
                <th className="py-3 px-4">Menu Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4 text-center">Prepared (Cooked)</th>
                <th className="py-3 px-4 text-center">Leftover (Unsold)</th>
                <th className="py-3 px-4 text-center">Wastage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuItems.map((item) => {
                const prepared = wastageEntries[item._id]?.prepared || 0;
                const leftover = wastageEntries[item._id]?.leftover || 0;
                const pct = prepared > 0 ? ((leftover / prepared) * 100).toFixed(0) : 0;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={prepared}
                        onChange={(e) => handleInputChange(item._id, 'prepared', e.target.value)}
                        className="w-24 text-center py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={leftover}
                        onChange={(e) => handleInputChange(item._id, 'leftover', e.target.value)}
                        className="w-24 text-center py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      />
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${
                          pct > 20
                            ? 'bg-rose-100 text-rose-800'
                            : pct > 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};

export default Wastage;
