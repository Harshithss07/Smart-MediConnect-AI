import React from "react";
import { DEPARTMENTS } from "../data";
import { Activity, Baby, Brain, Sparkles, Eye, Stethoscope, ChevronRight, Check } from "lucide-react";

interface DepartmentsProps {
  onNavigateToBooking: () => void;
}

export const Departments: React.FC<DepartmentsProps> = ({ onNavigateToBooking }) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredDepts = DEPARTMENTS.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeptIconClass = (iconName: string) => {
    switch (iconName) {
      case "Heart": return <Activity className="w-6 h-6 text-emerald-600" />;
      case "Baby": return <Baby className="w-6 h-6 text-emerald-600" />;
      case "Brain": return <Brain className="w-6 h-6 text-emerald-600" />;
      case "Activity": return <Activity className="w-6 h-6 text-emerald-600" />;
      case "Sparkles": return <Sparkles className="w-6 h-6 text-emerald-600" />;
      default: return <Stethoscope className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-12 text-left">
      {/* Title block */}
      <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-mono">Specialty Segments</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mt-1">Hospital Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Browse our clinical blocks and schedule diagnostics with specialized consultants.</p>
        </div>

        {/* Quick Search */}
        <div className="w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specialties or symptoms..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {filteredDepts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-[2rem] border border-slate-150 p-7 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-emerald-50 rounded-xl inline-block">
                    {getDeptIconClass(dept.iconName)}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/40">
                    OPD Block
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 font-display mb-2.5">{dept.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{dept.description}</p>

                <div className="space-y-2 mb-6">
                  <h4 className="text-[11px] font-mono leading-tight font-bold text-slate-400 uppercase tracking-wider">Associated Indicators</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {dept.symptoms.map((symptom, i) => (
                      <div key={i} className="flex items-center text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Direct booking allowed</span>
                <button
                  onClick={onNavigateToBooking}
                  className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer group"
                >
                  Schedule Appointment
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-[2rem]">
          <p className="text-slate-400 font-medium text-sm">No specialized departments match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2 cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Specialty Spotlight Section */}
      <section className="bg-gradient-to-r from-emerald-50 to-slate-50 border border-slate-150 p-8 sm:p-10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-left space-y-2 max-w-xl">
          <h3 className="text-lg font-bold text-slate-900 font-display">Looking for Emergency Assistance or Specialty Labs?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our trauma units, surgical blocks, and diagnostics imaging laboratories (MRI, CT scans) function 24 hours a day. Telehealth booking covers online general consultation.
          </p>
        </div>
        <button
          onClick={onNavigateToBooking}
          className="inline-flex items-center justify-center px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/15 transition-all shrink-0 cursor-pointer"
        >
          Request General Screening
        </button>
      </section>
    </div>
  );
};
