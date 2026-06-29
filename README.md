# DeadlineGuardian AI

AI productivity companion that predicts deadline failure and helps you finish tasks on time.

## Folder Structure

```
deadlineguardian/
├── frontend/          # React app
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   ├── Dashboard/
│       │   ├── Tasks/
│       │   ├── Calendar/
│       │   ├── Chat/
│       │   └── Layout/
│       ├── pages/
│       ├── hooks/
│       ├── utils/
│       ├── context/
│       └── services/
└── backend/           # FastAPI app
    ├── routers/
    ├── models/
    ├── services/
    └── utils/
```

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_key
GOOGLE_CALENDAR_CREDENTIALS=path_to_credentials.json
```
