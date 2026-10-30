import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

const SlotPicker = ({ slots, selectedSlotId, onSelectSlot, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-sm">
        No active pickup slots found for the selected date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot._id;
        const isDisabled = !slot.canBook;
        const fillRate = slot.capacity > 0 ? slot.booked / slot.capacity : 0;
        const isFilling = fillRate >= 0.7 && !slot.isFull;

        // Determine badge style
        let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        let badgeText = 'Available';

        if (slot.isPast) {
          badgeColor = 'bg-slate-200 text-slate-600 border-slate-300';
          badgeText = 'Past Time';
        } else if (slot.isFull) {
          badgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
          badgeText = 'Full';
        } else if (isFilling) {
          badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
          badgeText = 'Filling Fast';
        }

        return (
          <button
            type="button"
            key={slot._id}
            disabled={isDisabled}
            onClick={() => onSelectSlot(slot._id)}
            className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isDisabled
                ? 'opacity-50 bg-slate-100/80 border-slate-200 cursor-not-allowed'
                : isSelected
                ? 'bg-orange-50/70 border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                <Clock className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                {slot.label}
              </div>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-500 font-medium">
                {slot.booked}/{slot.capacity} booked
              </span>

              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${badgeColor}`}>
                {badgeText}
              </span>
            </div>

            {/* Progress bar visual indicator */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  slot.isFull
                    ? 'bg-rose-500'
                    : isFilling
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, fillRate * 100)}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SlotPicker;
