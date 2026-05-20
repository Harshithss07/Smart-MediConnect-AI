import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  simulateLogin: (role: "patient" | "admin", email?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, role: "patient" | "admin") => Promise<void>;
  logout: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Sync user profile from Firestore or create patient profile if returning user has none
  const syncUserProfile = async (fUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", fUser.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data && !data.email && fUser.email) {
          // Keep it updated if email became available
          data.email = fUser.email;
        }
        setUser(data as UserProfile);
      } else {
        // Automatically bootstrap admin if direct user email matches devs
        const isDefaultAdmin = fUser.email === "harshithss272@gmail.com";
        const emailPlaceholder = fUser.email || `patient-${fUser.uid.slice(0, 8)}@greenfield.org`;
        const newProfile: UserProfile = {
          userId: fUser.uid,
          name: fUser.displayName || "Patient",
          email: emailPlaceholder,
          role: isDefaultAdmin ? "admin" : "patient",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        setUser(newProfile);
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
      const emailPlaceholder = fUser.email || `patient-${fUser.uid.slice(0, 8)}@greenfield.org`;
      // Fallback local representation to let the user work on UI safely
      setUser({
        userId: fUser.uid,
        name: fUser.displayName || "Patient Profile",
        email: emailPlaceholder,
        role: fUser.email === "harshithss272@gmail.com" ? "admin" : "patient",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  useEffect(() => {
    if (isDemo) return; // Keep demo credentials unchanged

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      if (fUser) {
        setFirebaseUser(fUser);
        await syncUserProfile(fUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemo]);

  // Google Provider Login Process
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    setIsDemo(false);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setFirebaseUser(result.user);
        await syncUserProfile(result.user);
      }
    } catch (err) {
      console.error("Firebase Popup Auth Blocked or Cancelled. Reverting setup:", err);
      // Give full warning details about standard iframe policies
      alert(
        "Notice: Google Sign-In popups can sometimes be blocked by browser iframe third-party cookie restrictions. Click 'Simulate' block below for full dynamic dashboard evaluation!"
      );
      setLoading(false);
    }
  };

  // Demo Login Simulator (Great for quick, browser restricted sandbox testing!)
  const simulateLogin = async (role: "patient" | "admin", customEmail?: string) => {
    setLoading(true);
    setIsDemo(true);
    try {
      // Attempt anonymous Firebase login to obtain a real UID and active session
      const cred = await signInAnonymously(auth);
      const liveUid = cred.user.uid;
      const demoEmail = customEmail || (role === "admin" ? "admin@greenfield.org" : "patient@greenfield.org");
      const demoUserRec: UserProfile = {
        userId: liveUid,
        name: role === "admin" ? "Dr. Admin Greenfield" : "Grace Miller (Demo Patent)",
        email: demoEmail,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Safely register the profile inside the users collection
      const userDocRef = doc(db, "users", liveUid);
      await setDoc(userDocRef, {
        userId: liveUid,
        name: demoUserRec.name,
        email: demoUserRec.email,
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFirebaseUser(cred.user);
      setUser(demoUserRec);
    } catch (err) {
      console.warn("Could not sign in anonymously (likely Anonymous Auth is disabled in the console). Falling back to offline simulator id:", err);
      const demoId = role === "admin" ? "demo_admin_uid" : "demo_patient_uid";
      const demoEmail = customEmail || (role === "admin" ? "admin@greenfield.org" : "patient@greenfield.org");
      const demoUserRec: UserProfile = {
        userId: demoId,
        name: role === "admin" ? "Dr. Admin Greenfield" : "Grace Miller (Demo Patent)",
        email: demoEmail,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setFirebaseUser({
        uid: demoId,
        displayName: demoUserRec.name,
        email: demoEmail,
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
      } as any);
      setUser(demoUserRec);
    } finally {
      setLoading(false);
    }
  };

  // Login with Email/Password
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setIsDemo(false);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        setFirebaseUser(result.user);
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed") || err.message?.includes("not-allowed")) {
        console.warn("Email/Password provider is currently not enabled in the Firebase Console. Initiating elegant local simulator fallback.");
        setIsDemo(true);
        const resolvedRole = (email.toLowerCase().includes("admin") || email === "admin@greenfield.org") ? "admin" as const : "patient" as const;
        const resolvedName = resolvedRole === "admin" ? "Dr. Admin Greenfield" : "Grace Miller (Patient)";
        const resolvedId = resolvedRole === "admin" ? "demo_admin_uid" : "demo_patient_uid";
        
        const demoUserRec: UserProfile = {
          userId: resolvedId,
          name: resolvedName,
          email: email,
          role: resolvedRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setFirebaseUser({
          uid: resolvedId,
          displayName: resolvedName,
          email: email,
          emailVerified: true,
          isAnonymous: true,
          metadata: {},
          providerData: [],
        } as any);
        setUser(demoUserRec);
        return;
      }
      console.error("Firebase credentials login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register with Email/Password
  const registerWithEmail = async (email: string, password: string, name: string, role: "patient" | "admin") => {
    setLoading(true);
    setIsDemo(false);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        const userDocRef = doc(db, "users", result.user.uid);
        const newUserProfile: UserProfile = {
          userId: result.user.uid,
          name,
          email,
          role,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, newUserProfile);
        
        setFirebaseUser(result.user);
        setUser({
          userId: result.user.uid,
          name,
          email,
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed") || err.message?.includes("not-allowed")) {
        console.warn("User registration provider is currently disabled in the Firebase Console. Standard local fallback initiated.");
        setIsDemo(true);
        const resolvedId = role === "admin" ? "demo_admin_uid" : `demo_pat_${Date.now()}`;
        const demoUserRec: UserProfile = {
          userId: resolvedId,
          name: name,
          email: email,
          role: role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setFirebaseUser({
          uid: resolvedId,
          displayName: name,
          email: email,
          emailVerified: true,
          isAnonymous: true,
          metadata: {},
          providerData: [],
        } as any);
        setUser(demoUserRec);
        return;
      }
      console.error("Firebase credentials sign up error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out of current session (both structures)
  const logout = async () => {
    setLoading(true);
    if (!isDemo) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase signOut failure:", err);
      }
    }
    setIsDemo(false);
    setFirebaseUser(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      loginWithGoogle, 
      simulateLogin, 
      loginWithEmail, 
      registerWithEmail, 
      logout, 
      isDemo 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be utilized strictly under an AuthProvider.");
  }
  return context;
};
