import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, HeartHandshake, Shield, Award, Clock, MapPin, Phone, Star, 
  ChevronRight, Brain, Baby, Sparkles, Activity, FileText, Search, 
  Stethoscope, Calendar, AlertOctagon, Flame, PhoneCall, ShieldCheck, Heart,
  Building, CheckCircle2, KeyRound, UserCheck, HelpCircle, Users
} from "lucide-react";
import { DEPARTMENTS, DEFAULT_DOCTORS, getDoctorProfileImage } from "../data";
import { Department, Doctor } from "../types";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface HomeProps {
  onNavigate: (tabId: string) => void;
  onNavigateToDoctor?: (docId: string) => void;
  onOpenAuth: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onNavigateToDoctor, onOpenAuth }) => {
  const { user } = useAuth();
  const [selectedDeptIndex, setSelectedDeptIndex] = useState(0);
  const activeDept: Department = DEPARTMENTS[selectedDeptIndex];

  // Appointment counts fetched from Firestore if logged in
  const [userAptsCount, setUserAptsCount] = useState<number | null>(null);

  // Search doctor states
  const [allDoctors, setAllDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);

  // Emergency assistance visualizer states
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeFirstAidTopic, setActiveFirstAidTopic] = useState<string | null>(null);

  // Subscribe to live doctors registry from Firestore to pull and show all custom registered/edited specialists
  useEffect(() => {
    let fetchedDocs: Doctor[] = [];
    let retiredIds: Set<string> = new Set();

    const updateDoctorsList = () => {
      const mergedMap = new Map<string, Doctor>();
      DEFAULT_DOCTORS.forEach((doc) => mergedMap.set(doc.doctorId, doc));
      fetchedDocs.forEach((doc) => mergedMap.set(doc.doctorId, doc));

      const loaded = Array.from(mergedMap.values()).filter(
        (doc) => !retiredIds.has(doc.doctorId)
      );
      setAllDoctors(loaded);
    };

    const unsubDocs = onSnapshot(collection(db, "doctors"), (snapshot) => {
      fetchedDocs = [];
      snapshot.forEach((doc) => {
        fetchedDocs.push(doc.data() as Doctor);
      });
      updateDoctorsList();
    }, (error) => {
      console.warn("Home view failed to subscribe to live doctors registry:", error);
      updateDoctorsList();
    });

    const unsubRetired = onSnapshot(collection(db, "retired_doctors"), (snapshot) => {
      retiredIds = new Set();
      snapshot.forEach((doc) => retiredIds.add(doc.id));
      updateDoctorsList();
    }, (error) => {
      console.warn("Home view failed to subscribe to retired doctors collection:", error);
      updateDoctorsList();
    });

    return () => {
      unsubDocs();
      unsubRetired();
    };
  }, []);

  // Fetch live appointments for current patient to show in statistics card
  useEffect(() => {
    if (!user) {
      setUserAptsCount(null);
      return;
    }
    try {
      const aptRef = collection(db, "appointments");
      const q = query(aptRef, where("patientId", "==", user.userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserAptsCount(snapshot.size);
      }, (error) => {
        console.warn("Home component failed to listen to live stats:", error);
        setUserAptsCount(0);
      });
      return () => unsubscribe();
    } catch {
      setUserAptsCount(0);
    }
  }, [user]);

  // Handle active doctor search filtering based on the unified doctors directory
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(allDoctors);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allDoctors.filter(
      (doc) => 
        doc.name.toLowerCase().includes(q) || 
        doc.specialty.toLowerCase().includes(q) || 
        doc.department.toLowerCase().includes(q)
    );
    setFilteredDoctors(filtered);
  }, [searchQuery, allDoctors]);

  // Helper to resolve department icons
  const getIcon = (name: string) => {
    switch (name) {
      case "Heart": return <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />;
      case "Baby": return <Baby className="w-5 h-5 text-emerald-600" />;
      case "Brain": return <Brain className="w-5 h-5 text-emerald-600" />;
      case "Activity": return <Activity className="w-5 h-5 text-emerald-600" />;
      case "Sparkles": return <Sparkles className="w-5 h-5 text-emerald-600" />;
      default: return <Stethoscope className="w-5 h-5 text-emerald-600" />;
    }
  };

  // Immediate Action: Preselect clinician and jump straight to appointments schedule
  const handleQuickBook = (docId: string) => {
    if (onNavigateToDoctor) {
      onNavigateToDoctor(docId);
    } else {
      onNavigate("book");
    }
  };

  // -------------------------------------------------------------
  // VIEW A: AUTHENTICATED HOME VIEW WITH MEDICAL BOARD INTERACTION
  // -------------------------------------------------------------
  const renderAuthenticatedHome = () => {
    return (
      <div className="space-y-10 pb-20 mt-4">
        {/* Welcome and Hospital Branding Hero Plate */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-[2rem] p-8 sm:p-10 relative overflow-hidden shadow-xl text-left border border-slate-800"
        >
          {/* Subtle medical background vector accents */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent)]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Greenfield Clinical Network Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight tracking-tight text-white">
                Greenfield Medical Center
              </h1>
              <p className="text-sm font-semibold text-emerald-400 tracking-wide font-sans italic opacity-95">
                "Pioneering clinical excellence, preserving patient trust."
              </p>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Welcome back, <strong className="text-white font-bold">{user?.name}</strong>. Here you can lookup registered healthcare experts, schedule virtual consultations, audit clinical specialties, and contact triage immediately in emergencies.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-xs shrink-0 text-left backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest">Portal Health Status</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-sans leading-snug">
                All clinicians are active. Your digital medical record telemetry shielding is live and secured with HIPAA database invariants.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 1. PORTAL STATISTICS - HIGH CONTRAST BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left"
          >
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 inline-block">
              <Users className="w-5 h-5 font-bold" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Vetted Clinicians</p>
              <h4 className="text-2xl font-extrabold text-slate-900 font-display mt-1">5 Specialists</h4>
              <p className="text-xs text-slate-500 mt-1 leading-tight">Board certified Harvard & Stanford residency associates.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left"
          >
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 inline-block">
              <Building className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Specialization Labs</p>
              <h4 className="text-2xl font-extrabold text-slate-900 font-display mt-1">6 Departments</h4>
              <p className="text-xs text-slate-500 mt-1 leading-tight">Cardiovascular care, advanced neuro science, pediatrics.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left"
          >
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 inline-block">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Your Active Slots</p>
              <h4 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
                {userAptsCount !== null ? `${userAptsCount} Booked` : "Syncing..."}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-tight">Click 'Patient Dashboard' sidebar tab to cancel/modify slots.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-red-50/60 border border-red-100 rounded-2xl p-5 shadow-xs text-left"
          >
            <div className="p-2.5 bg-red-100 rounded-xl text-red-700 inline-block">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-red-500 font-mono uppercase tracking-wider">Response Team</p>
              <h4 className="text-2xl font-extrabold text-red-950 font-display mt-1">24/7 Hotline</h4>
              <p className="text-xs text-red-700 mt-1 leading-tight">Urgent Ambulance dispatch & first-aid checklist online.</p>
            </div>
          </motion.div>
        </div>

        {/* 2. DYNAMIC SEARCH DOCTOR BAR WITH LIVE RESULTS */}
        <section className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs text-left space-y-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600 shrink-0" />
              Interactive Clinic Doctor Directory Lookup
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Find doctors instantly by physician name, clinical specialty, or medical department below. Highlight card to set up direct consults.
            </p>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter... e.g. Dr. Sarah Jenkins, Cardiology, Neurologist"
              className="w-full pl-12 pr-4 py-3 bg-slate-55 border border-slate-200/80 rounded-2xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-sans shadow-xs"
            />
          </div>

          {/* Doctors Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <AnimatePresence mode="popLayout">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={doc.doctorId}
                    className="bg-slate-50/50 hover:bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-250 transition-all group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={getDoctorProfileImage(doc.doctorId, doc.name, doc.imageUrl)}
                          alt={doc.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20 shadow-xs"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-display group-hover:text-emerald-700 transition-colors">
                            {doc.name}
                          </h4>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide bg-emerald-50 border border-emerald-100/50 text-emerald-800">
                            {doc.department}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-700 text-[11px]">{doc.specialty}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Residency: {doc.education}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold font-mono">Exp: {doc.experience}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-400 font-mono">Available: {doc.availability.join(", ")}</span>
                      <button
                        onClick={() => handleQuickBook(doc.doctorId)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer shrink-0 shadow-xs flex items-center space-x-1"
                      >
                        <span>Book Slot</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center bg-slate-50 border rounded-2xl p-6">
                  <p className="text-xs text-slate-400 font-semibold font-mono">No clinical match found. Try entering alternative specialties or physician names.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 3. DUAL-TIER CALL TO ACTIONS: "BOOK APPOINTMENT" CTA & "EMERGENCY CONTACT PANEL" */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Booking CTA trigger */}
          <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-3xl md:col-span-6 text-left flex flex-col justify-between hover:shadow-sm transition-all shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
            
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 inline-block">
                <Calendar className="w-6 h-6 shrink-0" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Schedule Your Consultations Online</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect virtually with our lead medical doctors. Complete rapid diagnosis checklists, pick free hour slots, and assign symptoms for doctor reviews.
              </p>
            </div>

            <button
              onClick={() => onNavigate("book")}
              className="mt-6 inline-flex items-center justify-center px-5 py-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer self-start transition-all group"
            >
              <span>Book Appointment Slot</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Emergency support CTA / panel */}
          <div className="bg-red-50/50 border border-red-150 p-6 sm:p-8 rounded-3xl md:col-span-6 text-left flex flex-col justify-between hover:bg-red-50 transition-colors relative overflow-hidden">
            <div className="absolute right-0 top-0 w-20 h-20 bg-red-400/5 rounded-full blur-xl animate-pulse" />

            <div className="space-y-3">
              <div className="p-3 bg-red-100 rounded-2xl text-red-700 inline-block animate-pulse">
                <AlertOctagon className="w-6 h-6 shrink-0" />
              </div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-red-950 font-display">Clinical Emergency Crisis Hub</h3>
                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                Requires acute medical help? Click below to access immediate ambulance dispatches, phone speed dials, and core first-aid guidance lists.
              </p>
            </div>

            <button
              onClick={() => setIsEmergencyOpen(!isEmergencyOpen)}
              className="mt-6 inline-flex items-center justify-center px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer self-start shadow-md shadow-red-600/10 transition-all uppercase tracking-wider"
            >
              <PhoneCall className="w-3.5 h-3.5 mr-2 animate-bounce" />
              {isEmergencyOpen ? "Collapse Emergency Panel" : "Request Urgent Assistance"}
            </button>
          </div>
        </section>

        {/* Expandable Interactive crisis center drawer */}
        <AnimatePresence>
          {isEmergencyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-white border-2 border-red-100 rounded-3xl p-6 sm:p-8 shadow-lg text-left text-slate-800 space-y-6"
            >
              <div className="flex items-start justify-between border-b pb-4 border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                    Emergency Triage Dashboard
                  </span>
                  <h4 className="text-md font-bold text-slate-900 font-display mt-2">Active Crisis Communication Channels</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-400">Emergency dispatch</p>
                  <p className="text-sm font-bold text-red-600 font-mono">1-800-473-3634</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Emergency Numbers grid */}
                <div className="md:col-span-5 space-y-4">
                  <h5 className="text-xs uppercase font-extrabold text-slate-500 font-mono tracking-wider">Fast Line Speed-Dials</h5>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100/50 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-bold text-red-950 font-display">Triage Central Desk</p>
                        <p className="text-[10px] text-red-700 font-mono">(555) 794-0822</p>
                      </div>
                      <a href="tel:5557940822" className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold font-mono">Dial</a>
                    </div>

                    <div className="p-3 bg-red-50 rounded-xl border border-red-100/50 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-bold text-red-950 font-display">Ambulance Service Dispatch</p>
                        <p className="text-[10px] text-red-700 font-mono">1-800-RED-HELP</p>
                      </div>
                      <a href="tel:18007334357" className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold font-mono">Dial</a>
                    </div>
                  </div>
                  <div className="p-3.5 bg-yellow-50 rounded-2xl border border-yellow-200 text-[11px] leading-relaxed text-yellow-800">
                    ⚠️ <strong>Clinical Protocol:</strong> Our surgeons handle extreme emergencies round-the-clock. Physical ambulances are stationed at Suite 400, C-Block base, 24 hours.
                  </div>
                </div>

                {/* Interactive Triage Self-Care Accordion */}
                <div className="md:col-span-7 space-y-3.5">
                  <h5 className="text-xs uppercase font-extrabold text-slate-500 font-mono tracking-wider">Instant First-Aid Accordion Care</h5>
                  
                  <div className="space-y-2">
                    {[
                      {
                        title: "🛑 Sudden Chest Pain guidelines",
                        content: "Have the patient sit upright immediately. Loosen tight chest clothing. Keep breathing slow and deep. Call Greenfield Emergency Dispatcher and wait for assistance. Avoid rapid physical movements."
                      },
                      {
                        title: "💨 Severe Breathing issues / Asthma",
                        content: "Maintain sitting posture leaning slightly forward. Assist the patient in using their designated rescue inhaler. Eliminate high allergy triggers, dust particles, and smoke in surrounding room immediately."
                      },
                      {
                        title: "🩹 Extreme Physical Cut / Heavy Bleeding",
                        content: "Apply clean, direct pressure to the wound with a sanitized cloth or sterile field bandage. Elevate the wounded extremity above heart level if imaginable to diminish blood velocity. Maintain pressure."
                      }
                    ].map((topic, idx) => (
                      <div key={idx} className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                        <button
                          onClick={() => setActiveFirstAidTopic(activeFirstAidTopic === topic.title ? null : topic.title)}
                          className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-700 flex justify-between items-center cursor-pointer"
                        >
                          <span>{topic.title}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{activeFirstAidTopic === topic.title ? "▼" : "▶"}</span>
                        </button>
                        {activeFirstAidTopic === topic.title && (
                          <div className="p-3.5 bg-white border-t border-slate-100 leading-relaxed text-slate-600 text-[11px] font-sans">
                            {topic.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. CLINICAL SPECIALIZATIONS ACCORDION PREVIEW */}
        <section className="bg-emerald-950 text-white py-14 sm:py-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)] rounded-[2.5rem]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch px-6 sm:px-10">
            
            <div className="lg:col-span-5 text-left flex flex-col justify-between space-y-6">
              <div>
                <p className="text-xs uppercase font-extrabold text-emerald-400 tracking-widest font-mono">Our Active Labs</p>
                <h2 className="text-3xl font-bold font-display mt-2 mb-4 leading-snug">Expertise & Specialties</h2>
                <p className="text-sm text-emerald-100/80 leading-relaxed">
                  Browse operational units to view disease check symptoms, specific surgeon portfolios, and bookable telehealth diagnostic tracks.
                </p>
              </div>

              <div className="flex flex-col space-y-2 mt-4">
                {DEPARTMENTS.map((dept, index) => {
                  const isActive = index === selectedDeptIndex;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDeptIndex(index)}
                      className={`aria-selected:bg-emerald-500 flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "text-emerald-300 hover:text-white hover:bg-emerald-900/40"
                      }`}
                    >
                      <span>{dept.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "translate-x-1" : "opacity-0"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-emerald-900/30 border border-emerald-800/45 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center space-x-3.5 mb-4">
                  <div className="p-3 bg-emerald-600/30 text-emerald-400 rounded-xl">
                    {getIcon(activeDept.iconName)}
                  </div>
                  <h3 className="text-xl font-bold font-display text-white">{activeDept.name}</h3>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                  {activeDept.description}
                </p>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider mb-2.5">Symptoms Indicator Catalog</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeDept.symptoms.map((symptom, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-800/40 border border-emerald-700/30 rounded-full text-xs text-emerald-200">
                        • {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-xs text-emerald-300 leading-none">Complete detailed testing loops securely.</span>
                <button
                  onClick={() => onNavigate("book")}
                  className="inline-flex items-center justify-center px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-450 rounded-xl text-xs font-bold text-white transition-all cursor-pointer group shadow-lg shadow-emerald-500/25 shrink-0"
                >
                  Book {activeDept.name} Telehealth
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // VIEW B: PUBLIC VISITOR LANDING PAGE (NO SIDEBAR - BEAUTIFUL DESIGN)
  // -----------------------------------------------------------------
  const renderUnauthenticatedHome = () => {
    return (
      <div className="space-y-16 pb-20 mt-4 max-w-7xl mx-auto flex flex-col">
        {/* Top-Tier Brand Heading & Hero Plate */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-slate-50/20 to-transparent py-14 sm:py-20 rounded-[2.5rem]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Accepting Online Registrations</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
                  Modern Healthcare, <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Preserved with Trust</span>
                </h1>
                
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Greenfield Medical Center combines elite clinical expertise with seamless digital convenience. Browse specialized medical departments, select your target physicians, schedule instant appointments, and manage medical reports with peace of mind.
                </p>

                {/* VISITOR AUTHENTICATION INTERACTIVE TRIGGERS */}
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Get Instant Portal Access Now</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Separate Sign In Button */}
                    <button
                      onClick={onOpenAuth}
                      className="inline-flex items-center justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md shadow-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Sign In to Medical Portal
                    </button>

                    {/* Separate Sign Up Button */}
                    <button
                      onClick={onOpenAuth}
                      className="inline-flex items-center justify-center px-6 py-3.5 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-750 font-bold rounded-xl text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 cursor-pointer box-border"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Create Patient Account (Register)
                    </button>
                  </div>
                </div>

                {/* Trust Statistics Banner */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/80 max-w-lg">
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-display">15k+</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Healed Patients</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-display">5 Expert</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Clinicians</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-display">99.2%</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono">High Satisfaction</p>
                  </div>
                </div>
              </div>

              {/* Graphic Display Side */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-emerald-300/10 blur-3xl rounded-full scale-95" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 bg-white p-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=620"
                    alt="Modern Hospital Suite"
                    className="rounded-[1.5rem] w-full h-[320px] object-cover"
                  />
                  
                  {/* Fixed emergency hot desk */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-lg">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Emergency direct hotline</p>
                      <p className="text-md font-bold text-slate-950 font-mono">1-800-473-3634</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Integrity Segment */}
        <section className="px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs uppercase font-extrabold text-emerald-600 tracking-widest font-mono">Modern Medical Standards</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1">Structured Core Health Pillars</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-[2rem] text-left hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 inline-block mb-4">
                <HeartHandshake className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-display">Compassionate Care</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Every patient file is reviewed with customized care schedules, discarding rigid generic medical sheets.
              </p>
            </div>

            <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-[2rem] text-left hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 inline-block mb-4">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-display">HIPAA Secured Safeguards</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                State-of-the-art Firestore credentials protection preventing telemetry leaks across digital charts.
              </p>
            </div>

            <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-[2rem] text-left hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 inline-block mb-4">
                <Award className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-display">Vetted Clinicians</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Associate surgeons graduated from leading medical colleges with thousands of operational hours.
              </p>
            </div>
          </div>
        </section>

        {/* Operation Logistics Section */}
        <section className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left mx-6">
          <div className="flex space-x-3">
            <div className="p-2.5 bg-slate-50 border border-slate-100 text-emerald-700 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold font-display text-slate-800 text-xs sm:text-sm">Facility Office Hours</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                General OPD operates Monday - Friday: 8:00 AM - 8:00 PM. Emergency care stays open 24/7.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="p-2.5 bg-slate-50 border border-slate-100 text-emerald-700 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold font-display text-slate-800 text-xs sm:text-sm">Hospital Location</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                740 Arbor Boulevard, Greenfield Heights, Suite 400. Direct secure car park included free.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="p-2.5 bg-slate-55 border border-slate-100 text-emerald-700 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold font-display text-slate-800 text-xs sm:text-sm">Phone Assistance Desk</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dial us directly at (555) 794-0822 to process insurance forms or book direct triage assistance.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="animate-fade-in text-slate-800">
      {user ? renderAuthenticatedHome() : renderUnauthenticatedHome()}
    </div>
  );
};
