import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const MenuCard = ({ item }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAdd = () => {
    if (!item.isAvailable) return;
    addToCart(item, quantity);
    showToast(`Added ${quantity}x "${item.name}" to cart`, 'success');
    setQuantity(1);
  };

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
        !item.isAvailable
          ? 'opacity-60 border-slate-200 bg-slate-50/70'
          : 'border-slate-200/80 hover:border-orange-300'
      }`}
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              item.isAvailable ? 'group-hover:scale-105' : 'grayscale'
            }`}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
            }}
          />

          {/* Sold out overlay tag */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
              <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-full shadow-lg tracking-wider">
                Sold Out
              </span>
            </div>
          )}

          {/* Category Pill */}
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
            {item.category}
          </span>

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-xs">
            <div
              className={`w-4 h-4 border-2 flex items-center justify-center rounded-xs ${
                item.isVeg ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </div>
          </div>

          {/* Daily Limit Badge if applicable */}
          {item.dailyLimit && item.isAvailable && (
            <span className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Limit: {item.dailyLimit}/day
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-orange-600 transition-colors">
              {item.name}
            </h3>
          </div>

          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
            {item.description || 'Delicious freshly prepared canteen special meal.'}
          </p>
        </div>
      </div>

      {/* Card Footer: Price & Controls */}
      <div className="p-4 pt-0 mt-auto">
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Price</span>
            <span className="font-extrabold text-lg text-slate-900">
              ₹{item.price}
            </span>
          </div>

          {item.isAvailable ? (
            <div className="flex items-center gap-1.5">
              {/* Stepper */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 hover:bg-white rounded-md text-slate-600 transition disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-xs text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="p-1 hover:bg-white rounded-md text-slate-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAdd}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400 italic">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
