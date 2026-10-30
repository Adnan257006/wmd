import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Clock,
  ClipboardList,
  Scale,
  X,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Demand Dashboard',
      icon: LayoutDashboard,
      description: 'Demand overview & forecast'
    },
    {
      to: '/admin/orders',
      label: 'Manage Orders',
      icon: ClipboardList,
      description: 'Order flow & status updates'
    },
    {
      to: '/admin/menu',
      label: 'Manage Menu',
      icon: Utensils,
      description: 'Items, pricing & limits'
    },
    {
      to: '/admin/slots',
      label: 'Manage Slots',
      icon: Clock,
      description: 'Pickup timing & capacities'
    },
    {
      to: '/admin/wastage',
      label: 'Wastage Tracker',
      icon: Scale,
      description: 'Leftover audit & 7-day trend'
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header in Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-lg">Admin Console</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Canteen Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-start gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs border border-orange-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Canteen Health Status Box */}
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-orange-800 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            Demand AI Active
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Forecasting tomorrow's preparation based on 4-week moving average & wastage.
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
