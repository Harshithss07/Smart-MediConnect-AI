import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  Building, 
  Users, 
  CalendarPlus, 
  LayoutDashboard, 
  ShieldAlert, 
  Activity, 
  LogIn, 
  LogOut, 
  X, 
  Menu,
  ChevronRight,
  Heart
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onChangeTab, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "departments", label: "Departments", icon: Building },
    { id: "doctors", label: "Doctors Directory", icon: Users },
    { id: "book", label: "Book Appointment", icon: CalendarPlus },
  ];

  if (user) {
    navItems.push({ id: "dashboard", label: "Patient Dashboard", icon: LayoutDashboard });
  }

  if (user && user.role === "admin") {
    navItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });
  }

  const handleNavClick = (tabId: string) => {
    onChangeTab(tabId);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between bg-white text-slate-800 p-6">
      <div className="space-y-8">
        {/* Branding Area */}
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => handleNavClick("home")}>
          <div className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold font-display leading-tight tracking-tight text-slate-800">
              Greenfield <span className="text-emerald-600">Medical</span>
            </h1>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">
              Patient Portal
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5 pt-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
            Navigation Linkages
          </p>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 shadow-xs border-l-4 border-emerald-600"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                    isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-emerald-650"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600 animate-slide-right" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer Card */}
      <div className="border-t border-slate-100 pt-5 mt-auto">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100/50">
              <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold uppercase text-xs shadow-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <p className="text-xs font-bold text-slate-800 truncate" title={user.name}>
                    {user.name}
                  </p>
                  {user.role === "admin" ? (
                    <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold font-mono tracking-wider bg-red-100 text-red-800 shrink-0">
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold font-mono tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                      PT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-bold text-slate-650 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-red-500" />
              Sign Out Securely
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 transition-all cursor-pointer group"
          >
            <LogIn className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-0.5" />
            Sign In to Portal
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Permanent Sidebar - Desktop Layout (hidden on mobile, visible from lg onwards) */}
      <aside className="hidden lg:block fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200/80 shadow-xs z-30 select-none">
        <SidebarContent />
      </aside>

      {/* 2. Floating Header - Mobile Layout (visible on mobile, hidden on Desktop) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-xs select-none">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleNavClick("home")}>
          <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
            <Activity className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <span className="text-base font-extrabold text-slate-800 font-display">
            Greenfield <span className="text-emerald-600">Medical</span>
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* 3. Mobile Navigation Overlay & Slideout Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Blur Overlay background */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300" 
          />

          {/* Sliding panel content */}
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-64 bg-white shadow-2xl relative flex flex-col justify-between animation-slide-in-left">
              {/* Internal close button specifically for mobile cabinet header */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-50"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
