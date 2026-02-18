💬 PSPL ChatBot
<div align="center">
Intelligent Customer Support Routing System
Route • Resolve • Respond — without missing a beat
Features • Architecture • Tech Stack • Getting Started
</div>

🚨 The Problem
Managing client inquiries at scale without a dedicated support team is messy:

📧 Emails get lost and go unassigned
🤷 Admins don't know who's handling what
⏱️ Clients wait too long for answers that already exist
🔁 The same questions get answered manually over and over again

There was no system. Just chaos.

💡 The Solution
PSPL ChatBot is a full-stack customer support routing system that combines an intelligent chat widget with a real-time admin dashboard. It knows when support staff are online, automatically resolves common queries, and escalates to a human the moment something needs a real person.
LayerWhat It Does🤖 Auto-ResolutionKeyword matching handles FAQs at 85%+ confidence threshold🕐 Business HoursWebSocket-powered live status — always accurate, no polling📨 Smart EscalationRoutes unresolved queries to available admins via email📊 Admin DashboardReal-time conversation queue, response metrics, availability tracking💾 Session StorageFull conversation history persisted in MongoDB
Philosophy: Resolve what can be automated. Escalate what can't. Never make a client wait unnecessarily.

✨ Features
💬 Chat Widget
Embedded client-facing interface where users send inquiries. Keyword matching resolves common questions instantly at the 85% confidence threshold. Below that, the query is automatically flagged and escalated to the next available admin — no manual monitoring needed.

🕐 Business Hours Display
WebSocket connection keeps the "We're open / closed" status live and accurate in real time. No polling, no stale data, no refreshing required.

📊 Admin Dashboard
Admins log in to update their availability status. The dashboard surfaces:

Full active conversation queue
Pending escalations with conversation previews
Response time metrics
Auto-resolved vs. manually handled query breakdown


📨 Email Escalation
When a query can't be auto-resolved, the system fires an email to the first available admin with a conversation preview. One click opens the dashboard directly to that session.
Escalation flow:
Client sends message
        ↓
Keyword match runs
        ↓
Confidence ≥ 85% → instant auto-response
Confidence < 85% → check admin availability
        ↓
Email fired to available admin
        ↓
Admin clicks link → dashboard → responds in real time

🏗️ Architecture
Client Chat Widget (React)
        ↓
   WebSocket / REST API
        ↓
     FastAPI Backend
    ├── Business hours broadcaster (WebSocket)
    ├── Keyword matcher → auto-respond or escalate
    ├── Admin availability tracker
    └── Email notification dispatcher
        ↓
      MongoDB
  (sessions, conversations, admin status)

🛠️ Tech Stack
Frontend:  React 18, PostCSS, Tailwind CSS
Backend:   FastAPI (Python)
Database:  MongoDB
Real-Time: WebSocket
Notifs:    SMTP Email

🔌 Backend API
POST /chat
Body:    { user_id, session_id, message }
Returns: { response, escalated: bool }

GET  /admin/status
Returns: { available_admins: [] }

POST /admin/login
Body:    { admin_id }
Returns: { status: "available" }

POST /escalate
Body:    { session_id, reason }
Returns: { success: true }
Auto-demo fallback activates if the backend is offline — the widget stays functional for testing.

📈 Impact
MetricResultDaily users served250+Average response timeReduced by 40% (~10 min → ~6 min)Queries auto-resolved60%Manual coordination saved8 hrs/week

⚙️ Getting Started
Prerequisites
bashNode.js >= 18.0.0
npm >= 9.0.0
Python >= 3.9
Frontend
bashcd frontend
npm install
npm start        # http://localhost:3000
npm run build    # production build
Backend
bashcd server
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on localhost:8000

🔮 What's Next
Phase 1: MVP ✅ (Current)

 Chat widget with keyword-based auto-resolution
 WebSocket business hours display
 Admin availability tracking
 Email escalation with conversation preview
 MongoDB session persistence
 Admin dashboard with queue and metrics

Phase 2: Post-Launch

 Sentiment analysis to prioritize urgent escalations
 Multi-language support
 SMS notifications alongside email
 Analytics dashboard for response trends
 Expanded FAQ database with ML-based matching


<div align="center">
Built with 💬 at S M Software Solutions
Serving 250+ daily users — and counting.
Report Bug • Request Feature
</div>
