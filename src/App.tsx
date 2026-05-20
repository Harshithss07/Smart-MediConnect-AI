/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { Home } from "./components/Home";
import { Departments } from "./components/Departments";
import { Doctors } from "./components/Doctors";
import { Appointments } from "./components/Appointments";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";
import { ChatbotWidget } from "./components/ChatbotWidget";
import { Heart, Activity, MapPin, Mail, Phone, CalendarRange } from "lucide-react";

function RootAppContent() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [preSelectedDoctorId, setPreSelectedDoctorId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Custom navigation handler supporting automatic parameter binding
  const handleNavigate = (tabId: string) => {
    if (tabId !== "book") {
      setPreSelectedDoctorId(null);
    }
    setCurrentTab(tabId);
  };

  const handleSelectDoctorFromDirectory = (docId?: string) => {
    if (docId) {
      setPreSelectedDoctorId(docId);
    } else {
      setPreSelectedDoctorId(null);
    }
    setCurrentTab("book");
  };

  const renderActiveContent = () => {
    switch (currentTab) {
      case "home":
        return (
          <Home
            onNavigate={handleNavigate}
            onNavigateToDoctor={handleSelectDoctorFromDirectory}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case "departments":
        return <Departments onNavigateToBooking={() => handleNavigate("book")} />;
      case "doctors":
        return (
          <Doctors
            onNavigateToBooking={handleSelectDoctorFromDirectory}
            onNavigateToAdmin={() => handleNavigate("admin")}
          />
        );
      case "book":
        return (
          <Appointments
            preSelectedDoctorId={preSelectedDoctorId}
            onNavigateToDashboard={() => handleNavigate("dashboard")}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case "dashboard":
        return user ? (
          <Dashboard />
        ) : (
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <h3 className="text-xl font-bold font-display text-gray-900">Dashboard Unavailable</h3>
            <p className="text-xs text-gray-400">Please sign in to view your patient portal records.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-5 py-2 px-1 text-center rounded-lg border text-xs font-bold cursor-pointer transition-all bg-green-600 text-white"
            >
              Sign In Now
            </button>
          </div>
        );
      case "admin":
        return user && user.role === "admin" ? (
          <AdminPanel />
        ) : (
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <h3 className="text-xl font-bold font-display text-red-700">Unauthorized Access</h3>
            <p className="text-xs text-gray-500">Only authorized administrators are permitted to audit clinical panels.</p>
            <button
              onClick={() => handleNavigate("home")}
              className="px-5 py-2.5 bg-green-600 font-bold text-white text-xs rounded-xl"
            >
              Back to Home
            </button>
          </div>
        );
      default:
        return <Home onNavigate={handleNavigate} onOpenAuth={() => setIsAuthOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* Interactive Responsive Sidebar - only rendered when user is authenticated */}
      {user && (
        <Navbar
          currentTab={currentTab}
          onChangeTab={handleNavigate}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Main Content Area - conditional layout-padding based on auth status */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
        user ? "lg:pl-64 pt-16 lg:pt-0" : "pt-0"
      }`}>
        {/* Modern Top Header Bar for Public Visitor Landing (Only when logged out) */}
        {!user && (
          <header className={`sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shadow-xs`}>
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleNavigate("home")}>
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl text-white shadow-xs">
                <Activity className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <span className="text-lg font-extrabold text-slate-800 font-display tracking-tight">
                Greenfield <span className="text-emerald-600">Medical</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          </header>
        )}

        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveContent()}
          </div>
        </main>

        {/* Authentic Modal Gate */}
        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}

        {/* High-Fidelity Footer segment */}
        <footer className="bg-emerald-950 border-t border-emerald-900 text-emerald-250 py-16 px-4 sm:px-8 text-left relative overflow-hidden rounded-t-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.08),transparent)]" />
          <div className="max-w-7xl mx-auto relative grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* Logo brand */}
            <div className="md:col-span-5 space-y-4 text-left">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-emerald-600 text-white mr-3">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-white font-display">
                  Greenfield <span className="text-emerald-400 font-extrabold">Medical</span>
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 leading-relaxed max-w-sm">
                Accredited high-care clinical medical networks. Supporting virtual appointment scheduling, private patient reporting, and secure administrator oversight boards.
              </p>
              <div className="text-xs space-y-1.5 font-mono text-emerald-300">
                <div className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-2" /> 740 Arbor Boulevard, Suite 400</div>
                <div className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2" /> (555) 794-0822</div>
                <div className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2" /> support@greenfield.org</div>
              </div>
            </div>

            {/* Quick links block */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wider">Patient resources</h4>
              <div className="flex flex-col space-y-2 text-xs text-emerald-200/70">
                <button onClick={() => handleNavigate("book")} className="hover:text-emerald-400 text-left cursor-pointer bg-transparent border-0">Schedule Consult</button>
                <button onClick={() => handleNavigate("doctors")} className="hover:text-emerald-400 text-left cursor-pointer bg-transparent border-0">Meet Clinicians</button>
                <button onClick={() => handleNavigate("departments")} className="hover:text-emerald-400 text-left cursor-pointer bg-transparent border-0">Clinic Specialties</button>
                <button onClick={() => setIsAuthOpen(true)} className="hover:text-emerald-400 text-left cursor-pointer bg-transparent border-0">Credential Register</button>
              </div>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wider">Administrative Integrity</h4>
              <p className="text-xs text-emerald-200/60 leading-relaxed">
                Greenfield safeguards private health records using strict ABAC controls. Verified credentials prevent unverified telemetry leaks. Use the Admin Portal link to manage live database registers.
              </p>
              <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                <Heart className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>COMMITTED TO SECURE CARE</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-emerald-900 text-center text-[10px] font-mono text-emerald-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Greenfield Medical Center. All Rights Reserved.</span>
            <span className="flex items-center"><CalendarRange className="w-3.5 h-3.5 mr-1" /> Dynamic System Active</span>
          </div>
        </footer>
        <ChatbotWidget />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootAppContent />
    </AuthProvider>
  );
}
