import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, ShoppingBag, Utensils } from 'lucide-react';
import api from '../../api/axios';
import MenuCard from '../../components/MenuCard';
import Loader from '../../components/Loader';
import { useCart } from '../../context/CartContext';

const categories = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages'];

const Menu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const { totalItems, totalAmount, toggleCart } = useCart();

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
      const res = await api.get(`/menu${categoryParam}`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items locally by search and vegOnly toggle
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesVeg = vegOnly ? item.isVeg : true;

    return matchesSearch && matchesVeg;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-6 sm:p-10 mb-8 shadow-lg shadow-orange-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Smart Demand-Balanced Pre-Ordering
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Skip the Canteen Queue!
          </h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            Reserve your fresh meal for a dedicated pickup time slot. Helping your college canteen minimize food wastage while serving you hot food on time.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Utensils className="w-80 h-80" />
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes (e.g. Biryani, Thali, Samosa)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Veg Only Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Veg Only
            </span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Food Items */}
      {loading ? (
        <Loader message="Loading canteen menu..." />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">No items found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search or category filters to find available dishes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <MenuCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Mobile Floating Cart Summary Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:hidden z-30">
          <button
            onClick={toggleCart}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'} in Cart</span>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">
              ₹{totalAmount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;
