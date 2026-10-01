# ⚡ CodeFix AI — AI-Powered Structured Debugging Assistant

> **Hackathon 2026 Submission**  
> An intelligent developer tool that diagnoses code errors, explains root causes, generates verified fixes, and guides engineers with Socratic mentoring and beginner-friendly analogies.

---

## 🎯 Problem Statement

When encountering programming bugs, developers—especially students and junior engineers—often paste cryptic stack traces into generic chat interfaces. They get wall-of-text explanations that lack structure, miss the actual root cause, fail to teach the underlying mechanics, or hallucinate fixes.

**CodeFix AI** replaces unstructured chat with a dedicated, deterministic **developer debugging tool**:
- Extracts a structured **Error Fingerprint** (Language, Category, Severity, AI Confidence).
- Pinpoints the **Root Cause** separate from immediate symptoms.
- Delivers an actionable **Recommended Fix** and syntax-clean **Corrected Code**.
- Features **"Explain Like I'm a Beginner"** mode for jargon-free analogies.
- Features **"Debugging Mentor Mode"** to guide learners through the debugging thought process using Socratic hints.
- Stores historical debug sessions in a persistent **SQLite Database**.

---

## 🏆 Hackathon Judging Alignment

| Hackathon Criterion | How CodeFix AI Delivers |
|---|---|
| **1. GitHub Collaboration & Workflow** | Structured branch strategy (`main`, `develop`, `feature/*`), PR templates, conventional commits, and team role division. |
| **2. Functionality & Completion** | Full end-to-end pipeline: error parsing, Gemini 3.8 Flash structured JSON schema, SQLite persistence, history viewer, and copy triggers. |
| **3. Uniqueness & Innovation** | Error Fingerprinting, Socratic Mentor Mode (hints before solution), and ELI5 Beginner Mode. |
| **4. Architecture & Technical Understanding** | Clean separation of concerns (Flask Controller, Prompt Builder, AI Service, SQLite DAL, CSS/JS Frontend). |
| **5. UI/UX & Usability** | Modern dark-mode developer aesthetic, responsive cards, 1-click hackathon demo presets, one-click code copy buttons, live search filters. |
| **6. Final Demo & Explanation** | Rehearsed 2-minute demo flow covering broken code to verified diagnosis. |

---

## 🛠️ Architecture & Tech Stack

```text
CodeFix-AI/
├── app.py                     # Flask web server, route definitions, error handling
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template (API keys)
├── .gitignore                 # Files excluded from Git (venv, .env, DB, caches)
├── README.md                  # Complete documentation and hackathon guide
│
├── services/                  # Business logic & AI layer
│   ├── __init__.py
│   ├── ai_service.py          # Google Gemini 3.8 Flash SDK client & error fallback
│   └── prompt_builder.py      # Schema enforcement, system instructions, and prompt assembly
│
├── database/                  # Data access layer (DAL)
│   ├── __init__.py
│   └── database.py            # SQLite schema initialization, CRUD operations
│
├── templates/                 # Jinja2 HTML templates
│   ├── index.html             # Main submission form with mode toggles & presets
│   ├── result.html            # Structured diagnosis dashboard (Fingerprint, Fix, Mentor)
│   └── history.html           # Historical archive with live search filter
│
├── static/                    # Frontend styling & interactions
│   ├── style.css              # Dark-mode developer theme, responsive cards
│   └── script.js              # Presets loader, copy-to-clipboard, filter logic
│
└── tests/                     # Automated testing suite
    └── test_app.py            # Pytest test cases for routes, validation, and SQLite
```

- **Backend**: Python 3.10+, Flask 3.0+
- **AI Engine**: Google Gemini API (`gemini-3.8-flash`) via `google-genai`
- **Database**: SQLite3 (embedded, zero-configuration)
- **Frontend**: HTML5, CSS3 (Custom Dark Theme), Vanilla JavaScript
- **Testing**: `pytest`

---

## 🚀 Quick Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-team/codefix-ai.git
cd codefix-ai
```

### 2. Create and activate a Python virtual environment
```bash
# On macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# On Windows (Command Prompt):
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your **Gemini API Key**:
```ini
GEMINI_API_KEY="your-gemini-api-key-here"
FLASK_APP=app.py
PORT=5000
```
> Get a free API key at [Google AI Studio](https://aistudio.google.com/).

### 5. Run the application
```bash
python app.py
```
Visit `http://localhost:5000` in your web browser.

### 6. Run Automated Tests
```bash
pytest
```

---

## 👥 Hackathon Team Division & Workflow

### Suggested Team Roles (4-Person Team)
- **Member 1 (Lead & AI Architect)**: `services/prompt_builder.py`, `services/ai_service.py`, schema validation, Gemini API integration.
- **Member 2 (Backend & Database)**: `app.py`, `database/database.py`, SQLite CRUD, session flash messages.
- **Member 3 (Frontend & UI/UX)**: `templates/*.html`, `static/style.css`, responsive layout, dark mode aesthetic, copy buttons.
- **Member 4 (QA & Presentation / Mentor)**: `tests/test_app.py`, edge case testing, presentation slide deck, 2-minute live demo.

### Git Branching Strategy
```text
main (stable, production-ready release)
 │
 └── develop (staging branch for integrations)
      │
      ├── feature/flask-backend       (app.py & routing)
      ├── feature/gemini-service      (ai_service & prompt engineering)
      ├── feature/sqlite-database     (schema & storage)
      ├── feature/frontend-ui         (templates & styles)
      └── feature/testing             (pytest & validation)
```

### Pull Request & Commit Convention
- Format: `feat(scope): concise description` (e.g., `feat(ai): integrate gemini-3.8-flash structured response schema`)
- Review: Every PR requires at least 1 peer approval before merging into `develop`.

---

## 🎬 2-Minute Hackathon Demo Script

1. **The Hook (0:00 - 0:20)**:  
   *"Judges, every developer loses hours deciphering cryptic errors. ChatGPT gives walls of text. We built CodeFix AI: a structured debugging assistant."*
2. **The Bug (0:20 - 0:45)**:  
   *Click the 'Python IndexError' preset.* Show the deliberate off-by-one loop: `for i in range(len(items) + 1):`.
3. **The Diagnosis (0:45 - 1:15)**:  
   *Click 'Analyze & Fix'.* Highlight:
   - **Error Fingerprint**: Category: *Runtime*, Severity: *Medium*, Confidence: *98%*.
   - **Root Cause**: Explicit off-by-one explanation.
   - **Corrected Code**: Idiomatic `for item in items:`.
4. **The Innovation (1:15 - 1:40)**:  
   - Reveal **Beginner Mode**: Show the ELI5 box metaphor.
   - Reveal **Debugging Mentor Mode**: Show the progressive hints leading the student to discover the fix.
5. **Persistence & Closing (1:40 - 2:00)**:  
   *Click 'History'.* Show the saved analysis in SQLite with instant search.  
   *"CodeFix AI doesn't just fix your code—it teaches you how to become a better engineer."*
