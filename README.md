# Ghana Legal Evidence Intelligence System (GLEIS)
### AI-Powered Audio and Document Evidence Search System
*Built for the Judicial Service of Ghana, Superior Courts of Judicature, Office of the Attorney-General, and Law Enforcement Agencies.*

---

## 1. Overview & Objective

The **Ghana Legal Evidence Intelligence System (GLEIS)** is a secure, modern web application designed to help judges, state attorneys, defense counsel, court registrars, and investigators rapidly locate specific words, phrases, witness statements, transaction amounts, and legal facts across long audio recordings and voluminous document exhibits without manually listening to or reading hundreds of pages.

### Key Highlights
- **Exact Audio Search with Diarization:** Search for any word or sentence in court audio transcripts. Displays recording filename, speaker label (Judge, Prosecutor, Counsel, Witness), timestamp, surrounding context, and a one-click button to play the original audio starting at that exact millisecond.
- **Document Search with Page Preservation:** Search words/phrases across PDFs, DOCXs, and scanned exhibits. Displays page number, section heading, surrounding context, and a button to jump straight to the relevant page with highlighted text.
- **Unified Evidentiary Search:** Single search interface querying audio transcripts and documents simultaneously, with exact keyword, exact phrase, and AI semantic search modes.
- **Grounded Legal AI Q&A (RAG):** Ask complex legal questions grounded strictly in the evidentiary record. Every assertion cites the exact audio timestamp `[00:45]` or document page `[Page 2]`. No hallucinations; clear disclaimers that AI does not decide guilt or innocence.
- **Cryptographic Evidence Integrity (Chain of Custody):** Calculates SHA-256 cryptographic hashes before ingestion. Produces tamper-evident audit logs with verifiable HMAC checksums compliant with Section 112 of the Ghana Evidence Act, 1975 (NRCD 323).
- **Role-Based Access Control (RBAC):** Super Admin, Organization Admin, Lawyer / Lead Counsel, and Reviewer roles strictly enforced.

---

## 2. Technology Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend / Identity:** Firebase Authentication with Role Claims
- **Database:** Cloud Firestore (Structured metadata, cases, evidence, segments, pages, bookmarks, audit logs)
- **File Storage:** Cloud Storage for Firebase (Read-only immutable original evidence files; separate artifacts)
- **Audio Transcription:** OpenAI Whisper API / Google Cloud Speech-to-Text with word-level timestamps and speaker diarization (with high-fidelity offline fallback)
- **Document Processing & OCR:** Page-preserving text extraction and OCR confidence scoring with warning badges
- **Dedicated Search Engine:** Inverted index and BM25 token search engine with instant Algolia bridge
- **Testing:** Vitest automated test suite for integrity verification, RBAC permissions, and search accuracy

---

## 3. Database Schema (Cloud Firestore)

```text
users/{userId}
  ├── uid, email, displayName, role (super_admin | org_admin | lawyer | reviewer)
  └── organizationId, barNumber, division, createdAt

organizations/{organizationId}
  ├── name, code, type, contactEmail, jurisdiction

cases/{caseId}
  ├── caseNumber, suitNumber, title, description, court, presidingJudge, status
  ├── members/{userId} (role: owner | lead_counsel | investigator | viewer)
  ├── evidence/{evidenceId}
  │     ├── fileName, fileType (audio | document), fileSizeBytes, sha256Hash
  │     ├── status (uploaded | queued | processing | indexing | completed | completed_with_warnings | failed)
  │     ├── segments/{segmentId} (startTime, endTime, speakerLabel, text, words: [{word, start, end}])
  │     └── pages/{pageId} (pageNumber, text, headings, isOcr, ocrConfidence, hasWarnings)
  ├── bookmarks/{bookmarkId} (evidenceId, type, timestamp / pageNumber, note, tags)
  └── auditLogs/{logId} (action, actionDescription, userId, evidenceSha256, timestamp, integrityChecksum)
```

---

## 4. Required API Keys & External Services

| Service | Environment Variable | Purpose |
| :--- | :--- | :--- |
| **Firebase Auth & Firestore** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID` | Identity, database collections, and cloud storage |
| **Audio Transcription** | `VITE_OPENAI_API_KEY` or `VITE_WHISPER_ENDPOINT` | Word-level speech-to-text with timestamps and diarization |
| **Grounded Legal AI Assistant** | `VITE_GEMINI_API_KEY` or `VITE_OPENAI_API_KEY` | Strict legal RAG Q&A with verifiable evidence citations |
| **Algolia (Optional)** | `VITE_ALGOLIA_APP_ID`, `VITE_ALGOLIA_SEARCH_KEY` | High-volume external full-text index (built-in fast search engine runs automatically if omitted) |
| **Local Development Mode** | `VITE_ENABLE_LOCAL_MODE=true` | Runs complete system with built-in realistic Ghanaian legal fixtures and WebCrypto without requiring paid cloud keys |

---

## 5. Security Rules

### Firestore Security Rules (`firestore.rules`)
- Authenticated access required for all read/write operations.
- Super Admin possesses global administrative override.
- Case members can only read evidence belonging to cases to which they are explicitly assigned.
- Lawyers and Admins can create cases and upload evidence; Reviewers have read-only access.
- Audit logs are **append-only** (`allow update, delete: if false;`), ensuring tamper resistance.

### Cloud Storage Security Rules (`storage.rules`)
- Original evidence placed in `/cases/{caseId}/original/{evidenceId}` is **IMMUTABLE** (`allow update: if false;`).
- Size limited to 500 MB per file.
- MIME types strictly validated for audio (`audio/*`) and legal documents (`application/pdf`, `.docx`, `.txt`).

---

## 6. How to Run Locally

### Prerequisites
- Node.js 18+ or 20+ installed.

### Installation
```bash
# Clone the repository and navigate to directory
cd c:\Ai

# Install dependencies
npm install

# Start development server
npm run dev
# The application will launch at http://localhost:5173
```

### Running Automated Test Suite
```bash
npm test
```
*Executes all 10 unit and integration tests across RBAC permissions, SHA-256 evidence hashing, and keyword/phrase/semantic search.*

### Building for Production
```bash
npm run build
```
*Generates optimized production assets in `dist/` ready for Firebase Hosting.*

### Firebase Deployment
```bash
# Install Firebase CLI if not present
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy --only firestore:rules,storage,hosting
```

---

## 7. Courtroom User Personas & Demonstration Accounts

Use the one-click demo login buttons on the login screen (`/login`) to evaluate role permissions:

1. **Super Admin:** *Her Ladyship Justice Sophia Adinyira (Ret.)* (`justice.adinyira@judicial.gov.gh`) — Global administrative access, user role provisioning, system overrides.
2. **Organization Admin:** *Mr. Benjamin Kwakye (Chief Registrar)* (`registrar.commercial@court.gov.gh`) — Court registry administration, case assignments, vault oversight.
3. **Lawyer / Lead Counsel:** *Mrs. Abena Osei-Mensah (Chief State Attorney)* (`abena.osei@ag.gov.gh`) — Uploads evidence, searches transcripts, creates bookmarks, asks AI questions, reviews exhibits.
4. **Reviewer / Investigator:** *D/C/Insp. Eric Addo (Lead Financial Investigator)* (`investigator.eric@cid.police.gov.gh`) — Read-only examination of evidence, searches, and forensic timeline verification.
