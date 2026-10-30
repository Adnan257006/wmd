import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  LogOut,
  User,
  Menu as MenuIcon,
  X,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          )}

          <Link to={isAdmin ? '/admin/dashboard' : '/menu'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Canteen<span className="text-orange-500">Flow</span>
                </span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block">Demand Management System</p>
            </div>
          </Link>
        </div>

        {/* Center Links (Student Role) */}
        {isAuthenticated && isStudent && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <Link
              to="/menu"
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/menu')
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Canteen Menu
            </Link>
            <Link
              to="/orders"
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/orders')
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Orders
            </Link>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Cart Button (for Students) */}
              {isStudent && (
                <button
                  onClick={toggleCart}
                  className="relative p-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition shadow-xs flex items-center justify-center"
                  aria-label="Open Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              {/* User Info & Logout */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight truncate max-w-[130px]">{user?.name}</p>
                  <p className="text-slate-500 text-[11px] capitalize">{user?.role} {user?.rollNumber ? `• ${user?.rollNumber}` : ''}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-orange-600 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav for student */}
      {isAuthenticated && isStudent && (
        <div className="md:hidden flex border-t border-slate-200 bg-white px-4 py-2 justify-around text-xs font-semibold">
          <Link
            to="/menu"
            className={`py-1.5 px-3 rounded-lg ${isActive('/menu') ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600'}`}
          >
            Menu
          </Link>
          <Link
            to="/orders"
            className={`py-1.5 px-3 rounded-lg ${isActive('/orders') ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600'}`}
          >
            My Orders
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
