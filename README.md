# 💬 PSPL ChatBot

<div align="center">

**Intelligent Customer Support Routing System**

*Route • Resolve • Respond — without missing a beat*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-4A90D9?style=for-the-badge)]()
[![Production](https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge)]()

**[Features](#-features) • [Architecture](#%EF%B8%8F-architecture) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Getting Started](#-getting-started)**

</div>

---

## 🚨 The Problem

Managing client inquiries at scale without a dedicated support team is messy:

- 📧 Emails get lost and go unassigned
- 🤷 Admins don't know who's handling what
- ⏱️ Clients wait too long for answers that already exist
- 🔁 The same questions get answered manually over and over again

**There was no system. Just chaos.**

---

## 💡 The Solution

PSPL ChatBot is a **full-stack customer support routing system** that combines an intelligent chat widget with a real-time admin dashboard. It knows when support staff are online, automatically resolves common queries, and escalates to a human the moment something needs a real person.

| Layer | What It Does |
|-------|-------------|
| 🤖 **Auto-Resolution** | Keyword matching handles FAQs at 85%+ confidence threshold |
| 🕐 **Business Hours** | WebSocket-powered live status — always accurate, no polling |
| 📨 **Smart Escalation** | Routes unresolved queries to available admins via email |
| 📊 **Admin Dashboard** | Real-time conversation queue, response metrics, availability tracking |
| 💾 **Session Storage** | Full conversation history persisted in MongoDB |

**Philosophy:** *Resolve what can be automated. Escalate what can't. Never make a client wait unnecessarily.*

---

## ✨ Features

### 💬 Chat Widget

Embedded client-facing interface where users send inquiries. Keyword matching resolves common questions instantly at the 85% confidence threshold. Below that, the query is automatically flagged and escalated to the next available admin — no manual monitoring needed.

---

### 🕐 Business Hours Display

WebSocket connection keeps the "We're open / closed" status live and accurate in real time. No polling, no stale data, no refreshing required.

---

### 📊 Admin Dashboard

Admins log in to update their availability status. The dashboard surfaces:

- Full active conversation queue
- Pending escalations with conversation previews
- Response time metrics
- Auto-resolved vs. manually handled query breakdown

---

### 📨 Email Escalation

When a query can't be auto-resolved, the system fires an email to the first available admin with a conversation preview. One click opens the dashboard directly to that session.

**Escalation flow:**
Client sends message
↓
Keyword match runs
↓
Confidence ≥ 85%  →  instant auto-response
Confidence < 85%  →  check admin availability
↓
Email fired to available admin
↓
Admin clicks link → dashboard → responds in real time

---

## 🏗️ Architecture
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

---

## 🛠️ Tech Stack
Frontend:  React 18, PostCSS, Tailwind CSS
Backend:   FastAPI (Python)
Database:  MongoDB
Real-Time: WebSocket
Notifs:    SMTP Email

---

## 🔌 Backend API

PSPL ChatBot connects to these endpoints with **automatic demo fallback** if the backend is offline:
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

---

## 📈 Impact

| Metric | Result |
|--------|--------|
| Daily users served | 250+ |
| Average response time | Reduced by 40% (~10 min → ~6 min) |
| Queries auto-resolved | 60% |
| Manual coordination saved | 8 hrs/week |

---

## ⚙️ Getting Started

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Python >= 3.9
```

### Installation
```bash
# Clone the repo
git clone https://github.com/sansitamalhotra/ChatBot.git
cd ChatBot
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on localhost:3000
```

### Backend
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on localhost:8000
```

<div align="center">

**Built with 💬 at S M Software Solutions**

*Serving 250+ daily users — and counting.*

[Report Bug](https://github.com/sansitamalhotra/ChatBot/issues) • [Request Feature](https://github.com/sansitamalhotra/ChatBot/issues)

</div>
