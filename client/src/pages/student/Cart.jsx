import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount, totalItems } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
          Looks like you haven't added anything to your cart yet. Choose your favorite dishes and pre-order for a convenient time slot!
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 transition">
          <ArrowLeft className="w-4 h-4" />
          Continue Browsing
        </Link>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
        >
          Clear All Items
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            Order Review <span className="text-sm font-normal text-slate-500">({totalItems} items)</span>
          </h1>

          {cartItems.map((item) => (
            <div
              key={item.menuItem}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-xs ${
                      item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-slate-900 truncate text-base">{item.name}</h3>
                </div>

                <p className="text-xs font-semibold text-slate-400 mb-2">₹{item.price} each</p>

                <div className="flex items-center justify-between">
                  {/* Stepper */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItem, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded text-slate-600 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded text-slate-600 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-slate-900 text-base">
                      ₹{item.price * item.quantity}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.menuItem)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Bill Summary
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Canteen Service Fee</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax & Packaging</span>
                <span className="font-semibold text-slate-800">₹0</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="font-extrabold text-xl text-orange-600">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              Select Pickup Slot
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Pay at counter / verified token upon pickup
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
