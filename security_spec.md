# Security Specification & Adversarial Test Coverage

This document outlines the security architecture and validation tests for the Greenfield Medical Center Firestore database.

## 1. Data Invariants

1. **Role Sincerity**: No user can self-assign the `admin` role or modify their own `role` post-creation. Since Custom Claims are not used in standard previews, roles are verified through standard checks, defaulting to `patient` unless matching a bootstrapped admin or strict database entries.
2. **Identity Lock**: Documents in the `/users/{userId}` collection can only be written by the authenticated user whose `request.auth.uid == userId`.
3. **Medical Record Privacy (PII Isolation)**: Medical `/reports` and `/appointments` contain highly sensitive PII. Only the direct owner (`patientId == request.auth.uid`) or authorized administrative staff (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))`) may read or list them. Blanket reads are strictly forbidden.
4. **Appointment Integrity**:
   - Creating an appointment requires registering the authentic patient UID (`patientId == request.auth.uid`).
   - Appointment timestamps must match the server timestamp (`incoming().createdAt == request.time`).
   - Doctors are configured in a secure `/doctors` collection managed exclusively by admins.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following malicious payloads must be rejected by the security rules:

### Payload 1: Admin Role Self-Promotion (Collection: `users`)
An attacker tries to self-register or update their own profile to become an admin.
```json
{
  "userId": "attacker_uid",
  "name": "Evil Haxor",
  "email": "attacker@gmail.com",
  "role": "admin",
  "createdAt": "request.time"
}
```
*Expected Result:* `PERMISSION_DENIED` - Users cannot choose or modify their own role.

### Payload 2: Profile Spoofing / Impersonation (Collection: `users`)
User `uid_victim`'s profile is updated by `uid_attacker`.
```json
// Logged in as uid_attacker, writing to /users/uid_victim
{
  "userId": "uid_victim",
  "name": "Hijacked User",
  "email": "victim@gmail.com",
  "role": "patient",
  "createdAt": "request.time",
  "updatedAt": "request.time"
}
```
*Expected Result:* `PERMISSION_DENIED` - User ID in path must match `request.auth.uid`.

### Payload 3: Spoofing Appointment Ownership (Collection: `appointments`)
Booking an appointment under a victim's user ID.
```json
{
  "appointmentId": "apt_999",
  "patientId": "uid_victim",
  "patientName": "A Victim",
  "patientEmail": "victim@gmail.com",
  "doctorId": "doc_1",
  "doctorName": "Dr. Smith",
  "department": "Cardiology",
  "date": "2026-06-01",
  "time": "10:00 AM",
  "status": "pending",
  "createdAt": "request.time",
  "updatedAt": "request.time"
}
```
*Expected Result:* `PERMISSION_DENIED` - `patientId` must match the authenticated user's ID.

### Payload 4: Arbitrary Appointment Status Override (Collection: `appointments`)
A patient attempts to mark their own appointment status as `confirmed` or `completed` without admin interaction.
```json
// Patient creating appointment with 'confirmed' state directly
{
  "patientId": "uid_attacker",
  "status": "confirmed",
  "date": "2026-06-01",
  "time": "10:00 AM"
}
```
*Expected Result:* `PERMISSION_DENIED` - Patients can only create appointments under `pending` state; transition to `confirmed` requires administrative access.

### Payload 5: Corrupting Timestamps (Collection: `appointments`)
Attacker tries to set a backdated client timestamp for an appointment.
```json
{
  "patientId": "uid_attacker",
  "status": "pending",
  "createdAt": "2020-01-01T00:00:00Z" // client modified historical timestamp
}
```
*Expected Result:* `PERMISSION_DENIED` - `createdAt` must exactly match `request.time`.

### Payload 6: Doctor Profile Hijacking (Collection: `doctors`)
A patient or unauthenticated user tries to register or update a doctor profile.
```json
{
  "doctorId": "doc_cardio",
  "name": "Dr. Malicious",
  "specialty": "Cardiology",
  "department": "Cardiology",
  "experience": "1 Year",
  "education": "None",
  "imageUrl": "http://evil.com/pic.png",
  "email": "evil@hax.com"
}
```
*Expected Result:* `PERMISSION_DENIED` - Only verifiable administrators can update `doctors` data.

### Payload 7: Denial of Wallet / Oversized Field Entry (Collection: `appointments`)
Generating massive string values (e.g., 2MB paragraph of complaints) to exhaust system storage.
```json
{
  "complaints": "A".repeat(500000), // Huge string
  "patientId": "uid_attacker"
}
```
*Expected Result:* `PERMISSION_DENIED` - Fields must have strict maximum size boundaries.

### Payload 8: Direct Medical Report Injection (Collection: `reports`)
Attacker injects a synthetic report into another patient's repository.
```json
{
  "reportId": "rep_456",
  "patientId": "uid_victim",
  "reportName": "Brain Scan Results",
  "fileSize": "4.5 MB",
  "notes": "Diagnosed as healthy",
  "uploadedAt": "request.time"
}
```
*Expected Result:* `PERMISSION_DENIED` - Users can only write reports where `patientId == request.auth.uid`.

### Payload 9: Blanket Query Scraping (Collection: `reports`)
Attacker attempts a blanket query download of all reports in the database without filters.
```javascript
// Query: db.collection('reports')
```
*Expected Result:* `PERMISSION_DENIED` - Collecting reports without specifying `patientId == current_user` is prohibited.

### Payload 10: State Overwriting on Terminated Appointments (Collection: `appointments`)
Modifying an appointment that has already been marked as `completed` or `cancelled`.
```json
// Current DB state: status = 'completed'
// Update request: change doctor or time
{
  "time": "11:00 AM",
  "updatedAt": "request.time"
}
```
*Expected Result:* `PERMISSION_DENIED` - Modifications on terminal-status appointments are locked.

### Payload 11: Invalid ID Poisoning (Collection: `appointments`)
Injecting cross-site scripting strings or overlong strings as Document IDs.
```javascript
// docId = "../evil-collection/hack-doc"
```
*Expected Result:* `PERMISSION_DENIED` - IDs must strictly conform to ID character-sequence sets and length restrictions.

### Payload 12: Orphaned Entities / Invalid Doctor Reference (Collection: `appointments`)
Attacker maps an appointment to a non-existent doctor ID.
```json
{
  "doctorId": "non_existent_doctor_id",
  "patientId": "uid_attacker"
}
```
*Expected Result:* `PERMISSION_DENIED` - Valid checks must enforce cross-collection safety references.

---

## 3. Security Rule Layout

The system uses standard declarative rules in `firestore.rules` containing helper validations. Let's build the rules!
