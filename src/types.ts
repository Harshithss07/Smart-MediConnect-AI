export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: "patient" | "admin";
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Doctor {
  doctorId: string;
  name: string;
  specialty: string;
  department: string;
  experience: string;
  education: string;
  imageUrl: string;
  availability: string[]; // e.g. ["Monday", "Wednesday", "Friday"]
  email: string;
}

export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "10:00 AM"
  status: "pending" | "confirmed" | "cancelled" | "completed";
  complaints: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface MedicalReport {
  reportId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  reportName: string;
  fileSize: string;
  notes: string;
  uploadedAt: any; // Firestore Timestamp
}

// Available Departments inside the green hospital theme
export interface Department {
  id: string;
  name: string;
  iconName: string;
  description: string;
  symptoms: string[];
}
