import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Check, X, Users, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';

const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    startTime: '',
    endTime: '',
    capacity: 25,
    isActive: true
  });

  const { showToast } = useToast();

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get('/slots/admin');
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openAddModal = () => {
    setEditingSlot(null);
    setFormData({
      label: '',
      startTime: '',
      endTime: '',
      capacity: 25,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      label: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      isActive: slot.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.label || !formData.startTime || !formData.endTime) {
      showToast('Please fill all slot fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        capacity: Number(formData.capacity)
      };

      if (editingSlot) {
        const res = await api.put(`/slots/${editingSlot._id}`, payload);
        if (res.data.success) {
          showToast('Time slot updated successfully', 'success');
        }
      } else {
        const res = await api.post('/slots', payload);
        if (res.data.success) {
          showToast('New time slot created', 'success');
        }
      }

      setIsModalOpen(false);
      fetchSlots();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save time slot';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId, label) => {
    if (!window.confirm(`Delete time slot "${label}"? This may affect scheduled pickups.`)) {
      return;
    }

    try {
      const res = await api.delete(`/slots/${slotId}`);
      if (res.data.success) {
        showToast('Time slot deleted', 'success');
        fetchSlots();
      }
    } catch (err) {
      showToast('Failed to delete time slot', 'error');
    }
  };

  const toggleSlotActive = async (slot) => {
    try {
      const res = await api.put(`/slots/${slot._id}`, {
        isActive: !slot.isActive
      });
      if (res.data.success) {
        showToast(`Slot "${slot.label}" is now ${!slot.isActive ? 'Active' : 'Disabled'}`, 'info');
        fetchSlots();
      }
    } catch (err) {
      showToast('Failed to toggle slot state', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pickup Time Slots & Capacity
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define pickup intervals and maximum order capacity per interval to prevent kitchen overloads.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition self-start sm:self-auto active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Create Time Slot
        </button>
      </div>

      {/* Slots Table */}
      {loading ? (
        <Loader message="Loading pickup slots..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70 border-b border-slate-200">
                  <th className="py-3 px-4">Slot Label</th>
                  <th className="py-3 px-3">Start (24h)</th>
                  <th className="py-3 px-3">End (24h)</th>
                  <th className="py-3 px-3 text-center">Max Capacity</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.map((slot) => (
                  <tr key={slot._id} className="hover:bg-slate-50/60 transition">
                    {/* Label */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      {slot.label}
                    </td>

                    {/* Start */}
                    <td className="py-3.5 px-3 font-semibold text-slate-600">{slot.startTime}</td>

                    {/* End */}
                    <td className="py-3.5 px-3 font-semibold text-slate-600">{slot.endTime}</td>

                    {/* Capacity */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        <Users className="w-3 h-3 text-slate-400" />
                        {slot.capacity} orders
                      </span>
                    </td>

                    {/* Active Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => toggleSlotActive(slot)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                          slot.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {slot.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(slot)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot._id, slot.label)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Display Label *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. 12:00 PM - 12:30 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Start Time (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    End Time (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Max Order Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g. 25"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500"
                />
                Active (available for student bookings)
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSlots;
