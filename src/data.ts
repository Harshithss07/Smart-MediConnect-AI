import { Department, Doctor } from "./types";

export const DEPARTMENTS: Department[] = [
  {
    id: "cardiology",
    name: "Cardiology",
    iconName: "Heart",
    description: "Comprehensive heart care including specialized diagnostics, surgery, and preventive cardiovascular treatments.",
    symptoms: ["Chest pain", "Shortness of breath", "Palpitations", "High blood pressure"]
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    iconName: "Baby",
    description: "Dedicated healthcare for infants, toddlers, and young children. Focusing on wellness checks, immunization, and common illnesses.",
    symptoms: ["Childhood fever", "Vaccinations", "Growth milestone delays", "Pediatric allergies"]
  },
  {
    id: "neurology",
    name: "Neurology",
    iconName: "Brain",
    description: "Expert evaluation, diagnosis, and treatment for neuromuscular disorders, epilepsy, spinal concerns, and brain illnesses.",
    symptoms: ["Severe headaches", "Persistent dizziness", "Numbness", "Memory issues"]
  },
  {
    id: "orthopedics",
    name: "Orthopedics & Joint Care",
    iconName: "Activity",
    description: "Specialized remedies for bone fractures, ligament issues, joints care, sports anatomy, and physical rehabilitation.",
    symptoms: ["Joint swelling", "Bone injury", "Arthritic pain", "Limiting mobility constraints"]
  },
  {
    id: "dermatology",
    name: "Dermatology",
    iconName: "Sparkles",
    description: "State-of-the-art diagnostic and cosmetic treatment paths for advanced skin conditions, hair problems, and systemic skin diseases.",
    symptoms: ["Rashes", "Unusual moles", "Acne flares", "Chronic dry skin"]
  },
  {
    id: "ophthalmology",
    name: "Ophthalmology & Eye Surgery",
    iconName: "Eye",
    description: "Clinical vision checkups, advanced corrective surgery, glaucoma treatments, and standard prescription care.",
    symptoms: ["Blurry vision", "Eye soreness", "Double vision", "Flickering lights"]
  }
];

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    doctorId: "doc_1",
    name: "Dr. Alena Vance",
    specialty: "Chief Cardiovascular Surgeon",
    department: "Cardiology",
    experience: "15 Years",
    education: "MD - Stanford University, Fellow of American College of Cardiology",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    availability: ["Monday", "Wednesday", "Friday"],
    email: "alena.vance@greenfield.org"
  },
  {
    doctorId: "doc_2",
    name: "Dr. Marcus Thorne",
    specialty: "Senior Neurologist",
    department: "Neurology",
    experience: "12 Years",
    education: "MD - Harvard Medical School, Board Certified in Adult Neurology",
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    availability: ["Tuesday", "Thursday"],
    email: "marcus.thorne@greenfield.org"
  },
  {
    doctorId: "doc_3",
    name: "Dr. Sarah Jenkins",
    specialty: "Lead Pediatric Associate",
    department: "Pediatrics",
    experience: "10 Years",
    education: "MD - Johns Hopkins University School of Medicine, Resident in Pediatrics",
    imageUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400",
    availability: ["Monday", "Tuesday", "Wednesday"],
    email: "sarah.jenkins@greenfield.org"
  },
  {
    doctorId: "doc_4",
    name: "Dr. Robert Bradley",
    specialty: "Orthopedic & Joint Surgeon",
    department: "Orthopedics & Joint Care",
    experience: "18 Years",
    education: "MD - Columbia Physicians & Surgeons, Specialist in Joint Reconstruction Surgery",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    availability: ["Wednesday", "Thursday", "Friday"],
    email: "robert.bradley@greenfield.org"
  },
  {
    doctorId: "doc_5",
    name: "Dr. Clara Mendoza",
    specialty: "Consultant Dermatologist",
    department: "Dermatology",
    experience: "8 Years",
    education: "MD, Resident in Dermatology - University of Pennsylvania School of Medicine",
    imageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
    availability: ["Monday", "Thursday"],
    email: "clara.mendoza@greenfield.org"
  },
  {
    doctorId: "doc_vegapunk",
    name: "Dr. Vegapunk",
    specialty: "Neuro-Cardio Specialist",
    department: "Neurology",
    experience: "15 Years",
    education: "MD, Ph.D. - Future Medical Institute, Expert in Neuro-Cardiology & Advanced Brain Science",
    imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    email: "vegapunk@greenfield.org"
  }
];

export const PRESET_DOCTOR_IMAGES = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400", // Dr. Alena Vance (Cardiology)
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400", // Dr. Marcus Thorne (Neurology)
  "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400", // Dr. Sarah Jenkins (Pediatrics)
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400", // Dr. Robert Bradley (Orthopedics)
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400", // Dr. Clara Mendoza (Dermatology)
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400", // Male Preset 1
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400", // Female Preset 1
  "https://images.unsplash.com/photo-1582750433449-64c31281b5bb?auto=format&fit=crop&q=80&w=400", // Male Preset 2
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", // Female Preset 2
  "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400", // Male Preset 3
  "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=400", // Female Preset 3
  "https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=400"  // Male Preset 4
];

export function getDoctorProfileImage(docId: string, name: string = "", customUrl?: string): string {
  if (customUrl && customUrl.trim() !== "" && customUrl.trim().startsWith("http")) {
    return customUrl.trim();
  }

  // Fallback to static originals for default clinical registry IDs
  if (docId === "doc_1") return PRESET_DOCTOR_IMAGES[0];
  if (docId === "doc_2") return PRESET_DOCTOR_IMAGES[1];
  if (docId === "doc_3") return PRESET_DOCTOR_IMAGES[2];
  if (docId === "doc_4") return PRESET_DOCTOR_IMAGES[3];
  if (docId === "doc_5") return PRESET_DOCTOR_IMAGES[4];
  if (docId === "doc_vegapunk") return PRESET_DOCTOR_IMAGES[5];

  // Generate a reliable, deterministic layout partition using character mapping hashes
  const combined = `${docId || ""}_${name || ""}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the full suite of preset doctor images to avoid recurrence
  const slotIdx = Math.abs(hash) % PRESET_DOCTOR_IMAGES.length;
  return PRESET_DOCTOR_IMAGES[slotIdx];
}
