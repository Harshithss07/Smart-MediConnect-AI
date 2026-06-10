Smart Healthcare Appointment & Patient Management Platform,
click here 👉: https://greenfield-medical-center-538368690835.asia-southeast1.run.app/

---
# Greenfield Medical Center - Web Application Portal Documentation

Greenfield Medical Center is a high-fidelity, full-stack patient and provider portal styled in an elegant green medical visual theme. The application provides patients and clinic administrators with seamless coordination tools, persistent records management, and interactive AI consultation guidance.

---

## 🏗️ Architecture Overview

The application utilizes a **full-stack unified architecture** with a modular front-end connected to a secure backend serving both dynamic and static layers.

1. **Frontend**: Styled with **Tailwind CSS v4**, React 19, and Lucide React icons. Real-time synchronizations listen to database changes instantly using Firestore subscriptions.
2. **Backend Server (`server.ts`)**: Built with Express, integrated with Vite as a middleware for development, and compiled as a standalone CommonJS bundle (`dist/server.cjs`) using `esbuild` for production deployment.
3. **Database & Core Auth**: Built entirely on top of **Firebase Firestore** (for real-time directories, appointments, and diagnostic reports) and **Firebase Authentication** (safekeeping patient and staff credentials).
4. **AI Healthcare Engine**: Integrates `@google/genai` on the server-side, routing conversations to `gemini-3.5-flash` using strict clinical data limits to prevent hallucinations.

---

## 🛠️ Tech Stack & Key Dependencies

- **Framework**: React 19 + TypeScript 5
- **Build Core**: Vite v6 + esbuild
- **Server**: Express v4 + tsx
- **Styles**: Tailwind CSS v4 + Motion
- **Services Engine**: Google GenAI SDK (`@google/genai` v1.29.0)
- **Database / Auth**: Firebase SDK v12

---

## 🎯 Modular Feature Directory

### 1. Main Landing Screen (`Home.tsx`)
- Contains an **Interactive Clinic Doctor Directory Lookup** where patients can search doctors, departments, or symptoms.
- Dynamic listings featuring live-tracking clinics and quick directions.
- Direct statistics panel highlighting real-time patient queue details.

### 2. Live Doctors Directory (`Doctors.tsx`, `Departments.tsx`)
- Provides filterable cards mapping specialists to specific departments.
- Identifies operational schedules and credentials, excluding doctors flagged as "Retired".

### 3. Integrated Appointment Scheduler (`Appointments.tsx`)
- Dynamic slot reservation. Patients select their doctor, choose available times matching that specialist's weekly schedule, specify their complaints, and submit appointments.
- Cross-references real-time slots to prevent double-bookings.

### 4. Patient & Admin Dashboards (`Dashboard.tsx`, `AdminPanel.tsx`)
- **Patient Dashboard**: Lists historical appointments, diagnostic medical reports, and enables users to cancel booked slots or read physician guidelines.
- **Admin Control Panel**:
  - **Provider Management**: Registered users can onboard new specialists, edit current credentials, or flag clinical providers as retired.
  - **"Retire Staff" Tool**: Instantly soft-delete specialists from view and sync with the database via a structured and secure two-step confirmation panel.
  - **Reports Engine**: Generates and uploads new digital diagnostic report cards for patients directly.

### 5. AI Healthcare Assistant (`ChatbotWidget.tsx`, `server.ts`)
- Features a conversational companion widget running on the bottom-right corner of all portal views.
- Proxied through a secure `/api/chat` backend route to protect the `GEMINI_API_KEY`.
- Underpinned by custom clinical grounding guidelines matching official department registers. Correctly maps headaches to the neurology clinic, chest pain to cardiology, and handles ophthalmology limitations gracefully.

---

## 🗄️ Database Schemas & Collections

### `users`
Tracks user profiles, matching unique logins to corresponding access levels.
- `userId` (string)
- `name` (string)
- `email` (string)
- `role` ("patient" | "admin")
- `createdAt` / `updatedAt` (Timestamp)

### `doctors`
Stores custom registered and edited doctor profiles.
- `doctorId` (string)
- `name` (string)
- `specialty` (string)
- `department` (string)
- `experience` (string)
- `education` (string)
- `imageUrl` (string)
- `availability` (array of strings, e.g., `["Monday", "Wednesday"]`)
- `email` (string)

### `retired_doctors`
Stores the IDs of soft-deleted, retired doctors. This ensures default seed profiles can be updated and filtered out across the portal.
- `retired` (boolean)
- `retiredAt` (Timestamp)

### `appointments`
Manages reservations.
- `appointmentId` (string)
- `patientId` (string)
- `patientName` (string)
- `patientEmail` (string)
- `doctorId` (string)
- `doctorName` (string)
- `department` (string)
- `date` (string)
- `time` (string)
- `status` ("pending" | "confirmed" | "cancelled" | "completed")
- `complaints` (string)
- `createdAt` / `updatedAt` (Timestamp)

### `reports`
Diagnostic reports metadata.
- `reportId` (string)
- `patientId` (string)
- `patientName` (string)
- `patientEmail` (string)
- `doctorName` (string)
- `reportName` (string)
- `fileSize` (string)
- `notes` (string)
- `uploadedAt` (Timestamp)

---

## 💻 Running & Deploying

### Environment Variables
Declare required keys inside `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Local Dev Build
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the developer server:
   ```bash
   npm run dev
   ```

### Production Build
Compliant CJS distribution build bundled using esbuild:
```bash
npm run build
npm run start
```

