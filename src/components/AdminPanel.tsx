import React, { useEffect, useState } from "react";
import { 
  collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Appointment, Doctor, UserProfile } from "../types";
import { DEFAULT_DOCTORS, PRESET_DOCTOR_IMAGES, getDoctorProfileImage } from "../data";
import { 
  Calendar, CheckCircle, Clock, XCircle, Search, Filter, 
  Trash2, UserPlus, Users, Stethoscope, FileSpreadsheet, PlusCircle, AlertCircle
} from "lucide-react";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [aptStatusFilter, setAptStatusFilter] = useState("All");
  const [aptSearch, setAptSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<"appointments" | "doctors" | "patients">("appointments");

  // New Doctor State form
  const [showDocForm, setShowDocForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("");
  const [docDept, setDocDept] = useState("Cardiology");
  const [docExp, setDocExp] = useState("10 Years");
  const [docEdu, setDocEdu] = useState("");
  const [docImage, setDocImage] = useState(PRESET_DOCTOR_IMAGES[5]);
  const [docEmail, setDocEmail] = useState("");
  const [docAvailability, setDocAvailability] = useState<string[]>(["Monday", "Wednesday"]);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [confirmRetireId, setConfirmRetireId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    setLoading(true);

    // List all appointments inside firestore
    const unsubscribeApts = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Appointment));
      
      // Sort: newest first
      list.sort((a,b) => {
        const timeValA = a.createdAt?.seconds || Date.parse(a.date) / 1000;
        const timeValB = b.createdAt?.seconds || Date.parse(b.date) / 1000;
        return timeValB - timeValA;
      });
      setAppointments(list);
      setLoading(false);
    }, (error) => {
      console.error("Admin appointments snapshot failed:", error);
    });

    // List all doctors with support for active and retired clinical staff
    let fetchedDocs: Doctor[] = [];
    let retiredIds: Set<string> = new Set();

    const updateDoctorsList = () => {
      const mergedMap = new Map<string, Doctor>();
      // Load defaults
      DEFAULT_DOCTORS.forEach((doc) => mergedMap.set(doc.doctorId, doc));
      // Overwrite/add custom ones from Firestore
      fetchedDocs.forEach((doc) => mergedMap.set(doc.doctorId, doc));

      // Filter out any retired staff
      const activeDoctors = Array.from(mergedMap.values()).filter(
        (doc) => !retiredIds.has(doc.doctorId)
      );
      setDoctorsList(activeDoctors);
    };

    const unsubscribeDocs = onSnapshot(collection(db, "doctors"), (snapshot) => {
      fetchedDocs = [];
      snapshot.forEach((doc) => fetchedDocs.push(doc.data() as Doctor));
      updateDoctorsList();
    }, (error) => {
      console.warn("Doctors snapshot mapping admin fallback:", error);
      updateDoctorsList();
    });

    const unsubscribeRetired = onSnapshot(collection(db, "retired_doctors"), (snapshot) => {
      retiredIds = new Set();
      snapshot.forEach((doc) => retiredIds.add(doc.id));
      updateDoctorsList();
    }, (error) => {
      console.warn("Retired doctors collection snapshot failed in Admin:", error);
      updateDoctorsList();
    });

    // List all patient users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const record = doc.data() as UserProfile;
        if (record.role === "patient") list.push(record);
      });
      setPatients(list);
    }, (error) => {
      console.error("Admin patients user snapshot failed:", error);
    });

    return () => {
      unsubscribeApts();
      unsubscribeDocs();
      unsubscribeRetired();
      unsubscribeUsers();
    };
  }, [user]);

  // Adjust Doctor Role state (Approve / Confirm / Cancel / Complete schedules)
  const handleUpdateStatus = async (appointmentId: string, newStatus: "confirmed" | "completed" | "cancelled") => {
    try {
      const aptRef = doc(db, "appointments", appointmentId);
      await updateDoc(aptRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
      } catch (diagnosticsError: any) {
        setErrorMessage("Administrative state override blocked: Temporal rules or invalid operation constraints rejected update.");
        console.error(diagnosticsError.message);
      }
    }
  };

  // Admin: Delete/Retire doctor profile
  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      // 1. Delete from main doctors directory if it was a custom added profile
      const docRef = doc(db, "doctors", doctorId);
      await deleteDoc(docRef);

      // 2. Add to retired_doctors register to filter out from defaults as well
      const retiredRef = doc(db, "retired_doctors", doctorId);
      await setDoc(retiredRef, {
        retired: true,
        retiredAt: serverTimestamp(),
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `doctors/${doctorId}`);
      } catch (diagnosticsError: any) {
        setErrorMessage("Action Denied: Insufficient credential level or database sync bounds.");
        console.error(diagnosticsError.message);
      }
    }
  };

  // Add Doctors Form submission
  const handleAddNewDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docSpecialty || !docEmail || !docEdu) {
      setErrorMessage("Please fill all doctor parameters (Name, Speciality, Email, Credentials).");
      return;
    }

    setDocSubmitting(true);
    setErrorMessage("");

    const docCol = collection(db, "doctors");
    const doctorId = doc(docCol).id;

    // Compile payload strictly matching isValidDoctor schemas
    const docPayload: Doctor = {
      doctorId,
      name: docName.startsWith("Dr.") ? docName.trim() : `Dr. ${docName.trim()}`,
      specialty: docSpecialty.trim(),
      department: docDept,
      experience: docExp,
      education: docEdu.trim(),
      imageUrl: docImage.trim() || PRESET_DOCTOR_IMAGES[5],
      availability: docAvailability,
      email: docEmail.trim(),
    };

    try {
      const docRef = doc(db, "doctors", doctorId);
      await setDoc(docRef, docPayload);
      
      // Clear values
      setDocName("");
      setDocSpecialty("");
      setDocEdu("");
      setDocEmail("");
      setShowDocForm(false);
      setDocSubmitting(false);
    } catch (err) {
      setDocSubmitting(false);
      try {
        handleFirestoreError(err, OperationType.CREATE, `doctors/${doctorId}`);
      } catch (diagnosticsError: any) {
        setErrorMessage("Validation error: Server rules rejected new doctor record parameters.");
        console.error(diagnosticsError.message);
      }
    }
  };

  // Filter lists details
  const filteredAppointments = appointments.filter((apt) => {
    const matchSearch = apt.patientName.toLowerCase().includes(aptSearch.toLowerCase()) || 
                        apt.doctorName.toLowerCase().includes(aptSearch.toLowerCase());
    const matchStatus = aptStatusFilter === "All" || apt.status === aptStatusFilter;
    return matchSearch && matchStatus;
  });

  const totalEarnings = appointments.filter(a => a.status === 'completed').length * 150; // $150 static consult fee

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-10 text-left">
      {/* Title block */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-mono">Administration Hub</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mt-0.5">Clinic Management Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Manage physical resources, schedule states, adjust clinicians, and browse patient registries.</p>
        </div>

        {/* Dashboard toggles */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setSelectedSection("appointments")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSection === "appointments" ? "bg-white text-emerald-800 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setSelectedSection("doctors")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSection === "doctors" ? "bg-white text-emerald-800 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Doctors Directory
          </button>
          <button
            onClick={() => setSelectedSection("patients")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSection === "patients" ? "bg-white text-emerald-800 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Registered Patients
          </button>
        </div>
      </div>

      {/* Statistic strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-150 p-6 rounded-[2rem] shadow-xs text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Total Bookings</span>
          <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">{appointments.length}</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Sourced from online portal</span>
        </div>

        <div className="bg-white border border-slate-150 p-6 rounded-[2rem] shadow-xs text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Pending Reviews</span>
          <span className="text-3xl font-extrabold font-display text-amber-600 block mt-1">
            {appointments.filter((a) => a.status === "pending").length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Requires immediate confirm</span>
        </div>

        <div className="bg-white border border-slate-150 p-6 rounded-[2rem] shadow-xs text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Acquired Physicians</span>
          <span className="text-3xl font-extrabold font-display text-emerald-700 block mt-1">{doctorsList.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Vetted board specialists</span>
        </div>

        <div className="bg-white border border-slate-150 p-6 rounded-[2rem] shadow-xs text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Patient Registries</span>
          <span className="text-3xl font-extrabold font-display text-emerald-700 block mt-1">{patients.length}</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Verified health profile cases</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Sections switcher */}
      {selectedSection === "appointments" && (
        <div className="space-y-6 animate-fade-in">
          {/* Appointment Filters toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                placeholder="Search consults by doctor or patient name..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {["All", "pending", "confirmed", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setAptStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                      aptStatusFilter === status 
                        ? "bg-white text-emerald-800 font-extrabold shadow-sm border border-slate-200/50" 
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List/Table view */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-mono">Retrieving live hospital records...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="bg-white rounded-[2rem] border border-slate-150 p-6 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all duration-200"
                >
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                        ID: {apt.appointmentId.slice(0, 8)}...
                      </span>
                      {apt.status === "pending" && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-widest font-mono">
                          Reviewing
                        </span>
                      )}
                      {apt.status === "confirmed" && (
                        <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 uppercase tracking-widest font-mono border border-emerald-100/40">
                          Approved
                        </span>
                      )}
                      {apt.status === "completed" && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-widest font-mono">
                          Archived
                        </span>
                      )}
                      {apt.status === "cancelled" && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 uppercase tracking-widest font-mono">
                          Cancelled
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold block">Patient detail</span>
                        <p className="text-sm font-bold text-slate-950 font-display truncate">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{apt.patientEmail}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold block">Doctor assigned</span>
                        <p className="text-sm font-bold text-slate-950 font-display truncate">{apt.doctorName}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{apt.department}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400 block">Scheduled Date:</span>
                        <span className="text-slate-950 font-mono block font-bold">{apt.date}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400 block">Selected Time:</span>
                        <span className="text-slate-950 font-mono block font-bold">{apt.time}</span>
                      </div>
                    </div>

                    {apt.complaints && (
                      <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-slate-600 leading-normal block italic">
                        <strong>Brief Remarks:</strong> {apt.complaints}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {apt.status === "pending" && (
                    <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
                      <button
                        onClick={() => handleUpdateStatus(apt.appointmentId, "confirmed")}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approvals
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt.appointmentId, "cancelled")}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 bg-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                      </button>
                    </div>
                  )}

                  {apt.status === "confirmed" && (
                    <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
                      <button
                        onClick={() => handleUpdateStatus(apt.appointmentId, "completed")}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt.appointmentId, "cancelled")}
                        className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2rem]">
              <p className="text-slate-400 font-medium text-sm">No clinical consultation logs match the query.</p>
            </div>
          )}
        </div>
      )}

      {selectedSection === "doctors" && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center">
              <Stethoscope className="w-5.5 h-5.5 mr-2 text-emerald-600 inline" />
              Manage Staff Directories
            </h2>
            <button
              onClick={() => setShowDocForm(!showDocForm)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-650 cursor-pointer shadow-lg shadow-emerald-500/15"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Register Doctor
            </button>
          </div>

          {/* Form wrapper */}
          {showDocForm && (
            <form onSubmit={handleAddNewDoctor} className="bg-slate-50 border border-slate-205 p-6 rounded-[2rem] space-y-4 max-w-2xl animate-fade-in text-left shadow-xs">
              <h3 className="text-xs uppercase font-extrabold text-emerald-900 font-mono tracking-wider">Provide Clinician Parameters</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Dr. Linda Park"
                    required
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Medical Assignment Speciality
                  </label>
                  <input
                    type="text"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    placeholder="e.g. Lead Neuro-Oncologist"
                    required
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Clinical Department Block
                  </label>
                  <select
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics & Joint Care">Orthopedics & Joint Care</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Work Experience
                  </label>
                  <select
                    value={docExp}
                    onChange={(e) => setDocExp(e.target.value)}
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="5 Years">5 Years</option>
                    <option value="8 Years">8 Years</option>
                    <option value="10 Years">10 Years</option>
                    <option value="12 Years">12 Years</option>
                    <option value="15 Years">15 Years</option>
                    <option value="18 Years">18 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Academics / Education Certification
                  </label>
                  <input
                    type="text"
                    value={docEdu}
                    onChange={(e) => setDocEdu(e.target.value)}
                    placeholder="e.g. MD - Yale Medical Resident"
                    required
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Professional Staff Email
                  </label>
                  <input
                    type="email"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    placeholder="e.g. linda.park@greenfield.org"
                    required
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1">
                    Avatars / Choose a Professional Clinic Photo Preset
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3 bg-white p-3 rounded-2xl border border-slate-200">
                    {PRESET_DOCTOR_IMAGES.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDocImage(url)}
                        title={`Preset #${idx + 1}`}
                        className={`relative w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                          docImage === url ? "border-emerald-500 scale-110 ring-2 ring-emerald-500/20" : "border-slate-200 hover:scale-105"
                        }`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest mb-1 mt-2">
                    Or Enter Custom Portfolio Image URL
                  </label>
                  <input
                    type="text"
                    value={docImage}
                    onChange={(e) => setDocImage(e.target.value)}
                    className="w-full bg-white px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Provide bespoke Unsplash/image link..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocForm(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-650 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docSubmitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10"
                >
                  {docSubmitting ? "Saving Register..." : "Register Doctor Profile"}
                </button>
              </div>
            </form>
          )}

          {/* List all Doctors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {doctorsList.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white rounded-[2rem] border border-slate-150 p-5.5 flex flex-col justify-between hover:shadow-xs hover:border-slate-300 transition-all duration-200"
              >
                <div className="text-left space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={getDoctorProfileImage(doc.doctorId, doc.name, doc.imageUrl)}
                      alt={doc.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400";
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-905 font-display truncate max-w-[150px]">
                        {doc.name}
                      </h4>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold tracking-tight inline-block border border-emerald-100/40 mt-1">
                        {doc.department}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                    <p><strong>Certificates:</strong> {doc.education}</p>
                    <p><strong>Years:</strong> {doc.experience}</p>
                    <p><strong>Contact:</strong> <span className="font-mono text-[11px] text-slate-600">{doc.email}</span></p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end items-center gap-3">
                  {confirmRetireId === doc.doctorId ? (
                    <>
                      <button
                        onClick={() => setConfirmRetireId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteDoctor(doc.doctorId);
                          setConfirmRetireId(null);
                        }}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center font-bold cursor-pointer transition-colors shadow-xs"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Confirm Retire
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRetireId(doc.doctorId)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center font-bold cursor-pointer transition-colors"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Retire Staff
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSection === "patients" && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center">
              <Users className="w-5.5 h-5.5 mr-2 text-emerald-600 inline" />
              Patient Case Registries
            </h2>
          </div>

          {patients.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-155 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-550">
                  <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 border-b border-slate-150 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-extrabold font-mono">Patient Name</th>
                      <th scope="col" className="px-6 py-4 font-extrabold font-mono">Email Address</th>
                      <th scope="col" className="px-6 py-4 font-extrabold font-mono">Assigned Uid</th>
                      <th scope="col" className="px-6 py-4 font-extrabold font-mono">Account Registration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map((pat) => (
                      <tr key={pat.userId} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 text-slate-900 font-bold truncate max-w-[200px]">
                          {pat.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {pat.email}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {pat.userId}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-550">
                          {pat.createdAt?.seconds 
                            ? new Date(pat.createdAt.seconds * 1000).toLocaleDateString() 
                            : "Dynamic register"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2rem]">
              <p className="text-slate-400 font-medium text-sm">No clinical patient catalogs successfully synchronized yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
