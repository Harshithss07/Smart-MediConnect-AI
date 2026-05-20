import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Heart, Mail, Lock, User as UserIcon, ShieldAlert, ArrowRight, Loader2, KeyRound } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"patient" | "admin">("patient");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (!email || !password) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }
    if (isSignUp && !name) {
      setErrorMsg("Name is required to register.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      if (isSignUp) {
        await registerWithEmail(email, password, name, role);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      let friendlyError = "Authentication failed. ";
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        friendlyError = "Invalid email or password combination. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyError = "An account with this email address already exists.";
      } else if (err.code === "auth/invalid-email") {
        friendlyError = "Please enter a valid email address.";
      } else if (err.message && err.message.includes("isAnonymous")) {
        friendlyError = "Network error: Connection was rejected. Double check your settings.";
      } else {
        friendlyError += err.message || "Please check your network connection.";
      }
      setErrorMsg(friendlyError);
    }
  };

  const handleGoogleSubmit = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      // Don't show redundant alerts since AuthContext shows notice, but capture error status
      setErrorMsg(err.message || "Google Sign-In was cancelled or blocked.");
    }
  };

  // Handy shortcut helpers to instantly pre-fill for sandbox tests
  const handleQuickFill = (selectedRole: "patient" | "admin") => {
    setIsSignUp(false);
    setErrorMsg(null);
    if (selectedRole === "admin") {
      setEmail("admin@greenfield.org");
      setPassword("password123");
    } else {
      setEmail("patient@greenfield.org");
      setPassword("password123");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Account Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100 duration-300 z-10 animate-fade-in">
        {/* Banner Accents */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {isSignUp ? "Create Patient Account" : "Access Medical Portal"}
              </h3>
              <p className="text-xs text-slate-400">
                {isSignUp ? "Sign up to track, manage and schedule health plans" : "Secure credential door for doctors and Patients"}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-700 font-medium leading-relaxed mb-4 flex items-start gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grace Miller"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patient@greenfield.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-mono block">
                  Assign Account Access Role
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      role === "patient"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                    }`}
                  >
                    Patient Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      role === "admin"
                        ? "bg-red-50 border-red-400 text-red-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                    }`}
                  >
                    Clinical Admin
                  </button>
                </div>
                {role === "admin" && (
                  <p className="text-[10px] text-amber-600 mt-1 font-sans leading-tight">
                    * Admin capabilities are limited. For full clinical dashboard test permissions, use 'admin@greenfield.org' or your developer email address in production.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-md disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Sign Up & Register" : "Sign In to Portal"}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </form>

          {/* Social login line divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest text-slate-400">
              <span className="bg-white px-3">or credentials bypass</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4 mr-3 shrink-0"
            />
            {loading ? "Authenticating..." : "Continue with Google Account"}
          </button>

          {/* Testing pre-fill shortcuts */}
          {!isSignUp && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-150 text-left">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sandbox Testing Auto-Fill Shortcuts</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickFill("patient")}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold font-mono transition-all text-center"
                >
                  📄 Patient Quick-Fill
                </button>
                <button
                  onClick={() => handleQuickFill("admin")}
                  className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[10px] font-bold font-mono transition-all text-center"
                >
                  🔑 Admin Quick-Fill
                </button>
              </div>
            </div>
          )}

          {/* Form Toggle Link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-450">
              {isSignUp ? "Already registered with Greenfield?" : "Don't have a patient account yet?"}
            </span>{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all cursor-pointer bg-transparent border-0"
            >
              {isSignUp ? "Sign In Instead" : "Create Account Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
