# 🛡️ DeadlineGuardian AI

> **Your intelligent productivity co-pilot that spots deadline risks before they happen—and guides you back on track.**

Built with **Antigravity IDE** (vibe coding) · Powered by **Google Gemini AI** · Built on **Firebase**

---

## 🚀 Live Demo

* **Frontend App:** [https://deadlineguardian.vercel.app](https://deadlineguardian.vercel.app)
* **Backend API:** [https://deadlineguardian-api.onrender.com](https://deadlineguardian-api.onrender.com)

---

## 💡 The Inspiration (Why We Built This)

We've all been there: you look at a deadline that's weeks away, think *"I have plenty of time,"* and put it off. Then, the night before, panic sets in because you underestimated the work. 

Traditional task managers are passive—they just show lists and trigger alerts when it's already too late. **DeadlineGuardian AI is proactive.** It doesn't just remind you of deadlines; it calculates if you're actually on track to meet them, predicts potential failures, and acts as a supportive companion to help you recover.

---

## ✨ Features That Actually Matter

### 🤖 Smart Task Breakdown (Gemini-Powered)
Starting is the hardest part. When you add a new project, **Google Gemini AI** acts as your project manager, automatically decomposing it into 4–6 manageable subtasks with realistic time estimates. No more writer's block or overwhelm.

### 📊 Real-Time Risk Engine
Our custom risk engine continuously evaluates a **0–100 risk score** for every task. By factoring in deadline urgency, workload density, task complexity, your historical progress speed, and priority levels, the app categorizes tasks into three clear visual states:
*   🟢 **SAFE** (0–40) – You're on track. Keep cruising.
*   🟡 **WARNING** (41–70) – You need to pick up the pace.
*   🔴 **CRITICAL** (71–100) – High risk of missing the deadline. Focus now!

### 📅 Hands-Free AI Calendar Scheduling
Planning your week shouldn't be another chore. **Gemini AI** assesses your tasks, matches them against your free calendar slots, prioritizes `CRITICAL` items first, and pushes optimized work blocks directly to your **Google Calendar**.

### 🔄 Judgment-Free Recovery Agent
Missed a study or work session? Instead of giving up or feeling guilty, our **Gemini-powered Recovery Agent** instantly recalculates your schedule based on the remaining time, creating a fresh, motivating plan for the next day.

### 💬 Instant AI Productivity Partner
Need help brainstorming, adjusting a schedule, or just finding focus? Chat directly with the built-in productivity bot, powered directly by **Gemini 2.0 Flash Lite** for lightning-fast, context-aware responses.

### ⏰ Late & Missed Task Protection
*   **Urgent Alert**: If a task is due in under 30 minutes and you have completed less than half of it, you'll receive a prominent red warning.
*   **Overdue Pulsing Badge**: Missed deadlines trigger an animated visual indicator and browser notification.

### ⏱️ Pomodoro Focus Timer
A beautiful circular countdown timer with custom presets (25, 45, 60, and 90 minutes). Completing a session automatically logs your focus hours and increments the task's progress by **+10%**. Focus sessions persist across page reloads.

### 📚 PDF & Text Academic Calendar Parser
Got a syllabus or course schedule? Upload it as a **PDF, CSV, or TXT** file. The app automatically extracts dates, creates the events, and schedules structured reminders:
*   **7 days before** (to start studying)
*   **3 days before** (to review)
*   **1 day before** (final checklist)
*   **Day of** (no surprises!)

---

## 🛠️ Tech Stack & Architecture

### Frontend
*   **Core**: React.js & React Router v6
*   **UI Assets**: Lucide React (Icons) & Recharts (Interactive Dashboard Visuals)
*   **Alerts**: react-hot-toast for slick notifications
*   **Document Parsing**: pdfjs-dist for client-side PDF text extraction
*   **Styling**: Pure CSS Variables supporting Light and Dark modes seamlessly

### Backend
*   **Framework**: FastAPI (Python 3.11)
*   **Server**: Uvicorn ASGI
*   **Data Models**: Pydantic v2 validation

### Firebase & Google Integrations
*   **Gemini 2.0 Flash Lite**: Handles rapid AI chat interactions directly from the client.
*   **Gemini 1.5 Flash**: Orchestrates complex backend operations (task decomposition, risk recovery plans, and scheduling logic).
*   **Firebase Auth**: Google Sign-In & Email/Password authentication.
*   **Firebase Firestore**: Real-time synced tasks, calendar configurations, and RAG-based user profile memory.
*   **Google Calendar API**: Synchronizes generated work blocks directly with your calendar.

---

## 🏗️ How it Fits Together

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Dashboard · Tasks · Calendar · Focus · Timetable   │
│                  AI Chat (Gemini Direct)             │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               ▼                  ▼
    ┌──────────────────┐   ┌─────────────────────┐
    │  FastAPI Backend │   │   Firebase Services  │
    │  (Python)        │   │  Auth + Firestore    │
    └────────┬─────────┘   └─────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │              Google Cloud APIs             │
    │  Gemini AI · Google Calendar · Firebase   │
    └────────────────────────────────────────────┘
```

---

## 🔄 The Life Cycle of a Task

```
User inputs a goal
     ↓
Gemini AI structures it into logical subtasks
     ↓
Risk Engine rates deadline failure probability (0-100%)
     ↓
AI Scheduler reserves optimal focus slots
     ↓
Google Calendar schedules the events automatically
     ↓
User updates progress or logs focus time via Pomodoro
     ↓
Background checker runs every 60 seconds
     ↓
If a checkpoint is missed → Gemini Recovery Agent replans
     ↓
Course notifications push study reminders at 7d · 3d · 1d
```

---

## 📁 Repository Blueprint

```
deadlineguardian/
├── frontend/                  # React Frontend App
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.js      # Analytics, risk widgets, scheduler control
│       │   ├── TasksPage.js          # Task manager & active risk indicators
│       │   ├── CalendarPage.js       # AI-generated timetable visualization
│       │   ├── FocusTimerPage.js     # Pomodoro SVG timer & tracking
│       │   ├── TimetablePage.js      # Syllabus document upload panel
│       │   ├── ChatPage.js           # Direct Gemini chat interface
│       │   └── LoginPage.js          # Auth dashboard (Google/Email)
│       ├── context/
│       │   ├── AuthContext.js        # Firebase user session
│       │   └── ThemeContext.js       # Light/Dark mode state
│       └── services/
│           ├── api.js                # Axios instance & API route handlers
│           └── firebase.js           # Frontend SDK configurations
│
└── backend/                   # FastAPI Python Backend
    ├── main.py                # Server entry point & CORS configuration
    ├── routers/
    │   ├── tasks.py           # Core task CRUD routes
    │   ├── ai.py              # AI assistant endpoints
    │   ├── calendar.py        # Calendar integration routes
    │   └── auth.py            # Token verification middleware
    └── services/
        ├── gemini_service.py  # Gemini AI calls & system prompts
        ├── risk_engine.py     # Custom risk score algorithms
        ├── firebase_service.py # Firestore read/writes
        └── calendar_service.py # Google Calendar API integration
```

---

## ⚙️ Quick Start Guide

### Prerequisites
- Node.js (v16+)
- Python (v3.11+)
- Firebase Account
- Google Gemini API Key

### 1. Spin Up the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # On Windows
pip install -r requirements.txt
```

Create a `backend/.env` file:
```env
GEMINI_API_KEY=your_gemini_key
FIREBASE_CREDENTIALS=firebase_credentials.json
GOOGLE_CALENDAR_CREDENTIALS=credentials.json
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 2. Launch the Frontend
```bash
cd ../frontend
npm install
```

Create a `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_GEMINI_API_KEY=your_gemini_key
```

Run the development server:
```bash
npm start
# Frontend runs at http://localhost:3000
```

---

## 🔑 Integrations & API Config

| Key / Config File | Provider | Target Location |
|---|---|---|
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com) | `backend/.env` & `frontend/.env` |
| **Firebase App Settings** | Firebase Console (Web App settings) | `frontend/.env` |
| **Firebase Service Account** | Firebase Settings → Service Accounts (JSON download) | Rename to `backend/firebase_credentials.json` |
| **Google Calendar OAuth** | Google Cloud Console → API Library → Credentials | Rename to `backend/credentials.json` |

---

## 🌐 Production Deployments

*   **Frontend (Vercel)**: Ensure the root directory is set to `frontend`, the build command is `npm run build`, and output is directed to `build`. Add all `REACT_APP_` environment variables to your Vercel project settings.
*   **Backend (Render)**: Set the root directory to `backend`, the build command to `pip install -r requirements.txt`, and the start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`. Configure `GEMINI_API_KEY` in Render's environment variables.

---

## 🧠 Core Gemini AI Implementations

We use Gemini to solve various scheduling and productivity friction points:

```python
# 1. AI Task Breakdown
"Break this task into 4-6 subtasks with time estimates"
# Gemini returns clean JSON arrays directly to keep backend parsing lightweight.

# 2. Dynamic Calendar Mapping
"Create work blocks prioritizing CRITICAL tasks"
# Translates risk ratings into time blocks based on available calendar slots.

# 3. Empathetic Recovery Planning
"User missed a session. Replan remaining work"
# Provides quick, encouraging task updates rather than rigid calendar warnings.
```

---

## 📊 The Risk Engine Algorithm

To calculate accurate failure probabilities, the risk engine combines urgency, total workload pressure, task difficulty, and priority weighting, and reduces risk relative to progress:

```
Risk Score (0-100) =
    Deadline Urgency (0-35)
  + Workload Pressure (0-20)
  + Task Difficulty (0-35)
  + Priority Weight (0-20)
  - Progress Reduction (progress × 0.3)

Risk Tiers:
🟢 SAFE     : 0 - 40
🟡 WARNING  : 41 - 70
🔴 CRITICAL : 71 - 100
```

---

## 🙌 Credits & Acknowledgement

- **Antigravity IDE** – Supercharged vibe coding for quick, AI-assisted development.
- **Google Gemini** – The conversational and analytical engine.
- **Firebase** – Robust authentication and real-time syncing.
- **Google Calendar API** – Connecting calendar events.

---

## 👩‍💻 Developer

**Sahithya Kedala**  
Built for the Hackathon utilizing the Google AI Stack & Antigravity IDE.

---

*DeadlineGuardian AI — Because missing deadlines is not an option.* 🛡️