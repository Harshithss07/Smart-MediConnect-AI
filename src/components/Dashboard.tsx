import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Appointment, MedicalReport } from "../types";
import { 
  Calendar, Inbox, FileText, CheckCircle2, Clock, XCircle, Trash2, 
  UploadCloud, AlertCircle, FilePlus2, User, Key, Search 
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // New report form states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [reportName, setReportName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");
  const [fileSizeStr, setFileSizeStr] = useState("1.8 MB");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  const [errMessage, setErrMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Patient Query: Securely constrain lists to ONLY matching patientId
    const aptRef = collection(db, "appointments");
    const qApts = query(aptRef, where("patientId", "==", user.userId));
    
    const unsubscribeApts = onSnapshot(qApts, (snapshot) => {
      const aptList: Appointment[] = [];
      snapshot.forEach((doc) => {
        aptList.push(doc.data() as Appointment);
      });
      // Sort: Newest first
      aptList.sort((a,b) => {
        const dateA = new Date(`${a.date}T${a.time.split(" ")[0]}`);
        const dateB = new Date(`${b.date}T${b.time.split(" ")[0]}`);
        return dateB.getTime() - dateA.getTime();
      });
      setAppointments(aptList);
      setLoading(false);
    }, (error) => {
      console.error("Secure query appointments snapshot failed:", error);
      setErrMessage("Access error: Check secure database query formulations.");
      setLoading(false);
    });

    // Patient Query: Securely constrain lists to ONLY matching patientId
    const reportsRef = collection(db, "reports");
    const qReports = query(reportsRef, where("patientId", "==", user.userId));

    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const repList: MedicalReport[] = [];
      snapshot.forEach((doc) => {
        repList.push(doc.data() as MedicalReport);
      });
      // Sort newest upload
      repList.sort((a,b) => b.uploadedAt?.seconds - a.uploadedAt?.seconds);
      setReports(repList);
    }, (error) => {
      console.error("Secure query reports snapshot failed:", error);
    });

    return () => {
      unsubscribeApts();
      unsubscribeReports();
    };
  }, [user]);

  // Cancel Appointment handler
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm("Confirm cancelling this pending medical slot query?")) {
      return;
    }

    try {
      const aptDocRef = doc(db, "appointments", appointmentId);
      // Change status to cancelled
      await updateDoc(aptDocRef, {
        status: "cancelled",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
      } catch (diagnosticsError: any) {
        alert("Operation denied: Safe state invariants prohibit modifying closed schedules.");
        console.error(diagnosticsError.message);
      }
    }
  };

  // Upload Medical Report (writes clinical file data inside Firestore sandbox rules)
  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!reportName || !doctorName) {
      alert("Please designate a specific Report Title and Diagnostic Doctor.");
      return;
    }

    setReportSubmitting(true);
    const reportsCol = collection(db, "reports");
    const reportId = doc(reportsCol).id;

    // Build payload obeying structural rules schema
    const reportPayload: MedicalReport = {
      reportId,
      patientId: user.userId,
      patientName: user.name,
      patientEmail: user.email,
      doctorName,
      reportName,
      fileSize: fileSizeStr,
      notes: notes.trim(),
      uploadedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "reports", reportId), reportPayload);
      
      // Flush variables and shut drawer
      setReportName("");
      setDoctorName("");
      setNotes("");
      setFileSizeStr("1.8 MB");
      setShowUploadForm(false);
      setReportSubmitting(false);
    } catch (err) {
      setReportSubmitting(false);
      try {
        handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
      } catch (diagError: any) {
        alert("Report writing forbidden: Validation constraints rejected input parameters.");
        console.error(diagError.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 animate-pulse" /> Pending approval
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-150 uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider font-mono">
            <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-12 text-left">
      {/* Visual stats and greetings header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-[2rem] p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent)]" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-emerald-400 font-mono uppercase tracking-wider">Patient Management Board</p>
            <h1 className="text-3xl font-extrabold font-display leading-tight">Welcome Back, {user?.name}</h1>
            <p className="text-sm text-slate-300">View active clinic schedules, access prescriptions reports, and upload digital receipts.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono block">Scheduled Appointments</span>
              <span className="text-3xl font-extrabold font-display block mt-1">{appointments.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono block">Diagnostic Reports</span>
              <span className="text-3xl font-extrabold font-display block mt-1">{reports.length}</span>
            </div>
          </div>
        </div>
      </div>

      {errMessage && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Side contains Appointment Slices, Right side has Medical Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Appointments column */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center">
              <Calendar className="w-5.5 h-5.5 mr-2 text-emerald-600 inline" />
              Booked Consultations
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{appointments.length} Records</span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-405 font-mono">Connecting with appointments database...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {appointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="bg-white rounded-[2rem] border border-slate-150 p-6 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-sm hover:border-slate-300 transition-all duration-200"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(apt.status)}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 tracking-wider font-mono">
                        {apt.department}
                      </span>
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-base font-bold text-slate-850 font-display">Dr. {apt.doctorName}</p>
                      <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
                        <span className="font-semibold text-emerald-800">Date: {apt.date}</span>
                        <span>Hour: {apt.time}</span>
                      </div>
                    </div>

                    {apt.complaints && (
                      <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 px-3 py-2 rounded-xl italic block max-w-lg border border-slate-100">
                        📌 "{apt.complaints}"
                      </p>
                    )}
                  </div>

                  {/* Cancel Action if pending */}
                  {apt.status === "pending" && (
                    <button
                      onClick={() => handleCancelAppointment(apt.appointmentId)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-red-200 text-red-700 bg-white hover:bg-neutral-50 cursor-pointer text-xs font-bold self-end sm:self-start shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-white border border-dashed border-slate-200 rounded-[2rem] text-center space-y-3">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">You have no active consulting bookings recorded.</p>
            </div>
          )}
        </div>

        {/* Diagnostic Reports Column (PII upload track) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center">
              <FileText className="w-5.5 h-5.5 mr-2 text-emerald-600 inline" />
              Medical Reports Archive
            </h2>
            
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 shadow-sm"
            >
              <FilePlus2 className="w-3.5 h-3.5 mr-1" />
              Upload Report
            </button>
          </div>

          {/* Inline upload drawer */}
          {showUploadForm && (
            <form onSubmit={handleReportUpload} className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4 animate-fade-in text-left shadow-sm">
              <h3 className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider font-mono">Provide Report Metadata</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g. Lipids & Blood Panel"
                    required
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-205 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                    Diagnosing General Physician
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Emily Thorne"
                    required
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-205 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                    Document File Size / Type (Metadata)
                  </label>
                  <select
                    value={fileSizeStr}
                    onChange={(e) => setFileSizeStr(e.target.value)}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-205 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="1.2 MB (PDF)">1.2 MB (PDF)</option>
                    <option value="2.4 MB (DOCX)">2.4 MB (DOCX)</option>
                    <option value="4.5 MB (JPEG scan)">4.5 MB (JPEG scan)</option>
                    <option value="950 KB (JSON data)">950 KB (JSON data)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                    Laboratory Analysis Summary Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Input detailed diagnostic metrics (e.g. Fasting glucose normal, cholesterol 180ml/dl)..."
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-205 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs cursor-pointer font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs cursor-pointer font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  {reportSubmitting ? "Uploading Records..." : "Publish Medical File"}
                </button>
              </div>
            </form>
          )}

          {/* Reports Archive */}
          {reports.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {reports.map((rep) => (
                <div
                  key={rep.reportId}
                  className="bg-white border border-slate-150 p-5 rounded-[2rem] text-left space-y-2.5 hover:border-slate-305 hover:shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-850 font-display leading-snug">{rep.reportName}</h4>
                      <p className="text-[10px] font-semibold text-slate-400 font-mono tracking-wide">
                        MD Signoff: Dr. {rep.doctorName}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-100/50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {rep.fileSize}
                    </span>
                  </div>

                  {rep.notes && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl font-sans mt-2 border border-slate-100 leading-relaxed block whitespace-pre-wrap">
                      🍳 <strong>Diagnostic Notes:</strong> <br />
                      {rep.notes}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 font-mono flex items-center justify-end pt-1">
                    <span>
                      Uploaded On: {rep.uploadedAt?.seconds 
                        ? new Date(rep.uploadedAt.seconds * 1000).toLocaleString() 
                        : "Synchronizing Timestamp"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-white border border-dashed border-slate-200 rounded-[2rem] text-center space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No diagnostic reports uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
