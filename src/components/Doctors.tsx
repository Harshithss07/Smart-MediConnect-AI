import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Doctor } from "../types";
import { DEFAULT_DOCTORS, getDoctorProfileImage } from "../data";
import { Search, MapPin, Calendar, Mail, GraduationCap, Briefcase, Plus, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DoctorsProps {
  onNavigateToBooking: (doctorId?: string) => void;
  onNavigateToAdmin?: () => void;
}

export const Doctors: React.FC<DoctorsProps> = ({ onNavigateToBooking, onNavigateToAdmin }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let fetchedDocs: Doctor[] = [];
    let retiredIds: Set<string> = new Set();

    const updateDoctorsList = () => {
      const mergedMap = new Map<string, Doctor>();
      // Load defaults
      DEFAULT_DOCTORS.forEach((doc) => mergedMap.set(doc.doctorId, doc));
      // Overwrite/add custom ones from Firestore
      fetchedDocs.forEach((doc) => mergedMap.set(doc.doctorId, doc));

      // Filter retired
      const activeDoctors = Array.from(mergedMap.values()).filter(
        (doc) => !retiredIds.has(doc.doctorId)
      );
      setDoctors(activeDoctors);
      setLoading(false);
    };

    const unsubscribeDocs = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        fetchedDocs = [];
        snapshot.forEach((doc) => {
          fetchedDocs.push(doc.data() as Doctor);
        });
        updateDoctorsList();
      },
      (error) => {
        console.warn("Doctors fetch permissions or connection fallback active:", error);
        updateDoctorsList();
      }
    );

    const unsubscribeRetired = onSnapshot(
      collection(db, "retired_doctors"),
      (snapshot) => {
        retiredIds = new Set();
        snapshot.forEach((doc) => retiredIds.add(doc.id));
        updateDoctorsList();
      },
      (error) => {
        console.warn("Retired doctors fetch snapshot error in Doctors directory:", error);
        updateDoctorsList();
      }
    );

    return () => {
      unsubscribeDocs();
      unsubscribeRetired();
    };
  }, []);

  // Filter criteria logic
  const departmentsList = ["All", ...Array.from(new Set(doctors.map((doc) => doc.department)))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "All" || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-10 text-left">
      {/* Title Header with Search and Filter bar */}
      <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-mono">Specialist Council</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mt-1">Medical Staff Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Meet our accredited clinical specialists and view active consult availability schedules.</p>
        </div>

        {/* Action button if administrator is logged in */}
        {user?.role === "admin" && onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="inline-flex items-center justify-center px-4.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register New Staff
          </button>
        )}
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search physicians by name or specialization..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Filter */}
        <div className="w-full sm:w-64">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All" ? "All Specialties" : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="h-8 w-8 border-4 border-emerald-550 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-450 text-sm">Synchronizing clinic registers...</p>
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.doctorId}
              className="bg-white rounded-[2rem] border border-slate-150 shadow-xs overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image & Header decoration */}
              <div>
                <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-slate-50">
                  <img
                    src={getDoctorProfileImage(doctor.doctorId, doctor.name, doctor.imageUrl)}
                    alt={doctor.name}
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/80 flex items-center space-x-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold font-mono text-emerald-800">BOARD CERTIFIED</span>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-6 text-left space-y-4">
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 border border-emerald-100/40">
                      {doctor.department}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-display leading-snug">{doctor.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 font-mono">{doctor.specialty}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100/80 text-xs text-slate-600">
                    <div className="flex items-start">
                      <GraduationCap className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-normal">{doctor.education}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0" />
                      <span>{doctor.experience} experience track</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  </div>

                  {/* Availability List details */}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase tracking-wider block mb-1">
                      Target Available Days
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {doctor.availability.map((day, dIdx) => (
                        <span key={dIdx} className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-emerald-700">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action path */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => onNavigateToBooking(doctor.doctorId)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Select Schedule Date
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-[2rem]">
          <p className="text-slate-400 font-medium text-sm">No medical staff found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDept("All");
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2 cursor-pointer"
          >
            Reset Catalog Filters
          </button>
        </div>
      )}
    </div>
  );
};
