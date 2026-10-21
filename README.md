# web-development-competition
Developing a one-page website using HTML, CSS, JavaScript for commpetition.

# Folder Structure:

omis-mvp/
├── vercel.json
├── package.json                   # Root package if deploying combined or frontend build
│
├── frontend/                      # React (Vite)
│   ├── src/
│   │   ├── api.js                 # Unified fetch/axios client
│   │   ├── App.jsx                # Tab navigation (Scheduler | Approvals | Visitors)
│   │   ├── components/
│   │   │   ├── BookingForm.jsx    # Room selector + booking list
│   │   │   ├── ApprovalBoard.jsx  # Table of tickets + Approve/Reject buttons
│   │   │   └── VisitorPass.jsx    # Pre-reg form + react-qr-code display
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── api/                           # FastAPI entrypoint for Vercel Serverless
    ├── requirements.txt           # fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic
    ├── db.py                      # Database connection engine & session
    ├── models.py                  # All 3 database tables in one file
    ├── schemas.py                 # Pydantic request/response schemas
    └── index.py                   # FastAPI app instance + all routes






