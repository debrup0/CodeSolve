import React, { useState, useEffect } from 'react';
import {
  Bug,
  Cpu,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  History,
  GraduationCap,
  Sparkles,
  Search,
  Trash2,
  FolderTree,
  GitBranch,
  Users,
  Award,
  Play,
  ArrowRight,
  Code2,
  RefreshCw,
  HelpCircle,
  Info
} from 'lucide-react';

interface DebuggingReport {
  error_name: string;
  category: string;
  severity: string;
  confidence: number;
  what_happened: string;
  root_cause: string;
  why_it_happened: string;
  recommended_solution: string;
  corrected_code: string;
  explanation: string;
  prevention_tips: string[];
  commands: string[];
  beginner_explanation: string;
  mentor_guidance?: {
    guiding_question: string;
    hint_1: string;
    hint_2: string;
    hint_3: string;
    checkpoint_task: string;
  };
}

interface AnalysisRecord {
  id: string;
  timestamp: string;
  language: string;
  errorMessage: string;
  codeSnippet?: string;
  beginnerMode: boolean;
  mentorMode: boolean;
  result: DebuggingReport;
}

interface HistorySummary {
  id: string;
  timestamp: string;
  language: string;
  error_name: string;
  category: string;
  severity: string;
  confidence: number;
  what_happened: string;
  beginnerMode: boolean;
  mentorMode: boolean;
}

const DEMO_PRESETS = [
  {
    label: 'Python IndexError',
    lang: 'Python',
    error: 'IndexError: list index out of range\n  File "app.py", line 5, in process_scores\n    total += scores[i]',
    code: 'def process_scores(scores):\n    total = 0\n    # Off-by-one boundary bug: range includes len(scores)\n    for i in range(len(scores) + 1):\n        total += scores[i]\n    return total\n\nscores = [85, 92, 78]\nprint("Final Score:", process_scores(scores))',
    beginner: true,
    mentor: true
  },
  {
    label: 'JS Cannot read properties of undefined',
    lang: 'JavaScript',
    error: "TypeError: Cannot read properties of undefined (reading 'avatar')\n    at renderProfileHeader (userView.js:28:31)",
    code: 'function renderProfileHeader(userData) {\n    // Bug: userData or userData.profile may be undefined\n    const avatarUrl = userData.profile.avatar.url;\n    return `<img src="${avatarUrl}" alt="Avatar"/>`;\n}\n\nrenderProfileHeader({ name: "Alex" });',
    beginner: true,
    mentor: true
  },
  {
    label: 'Java NullPointerException',
    lang: 'Java',
    error: 'Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.trim()" because "input" is null\n\tat DataParser.cleanInput(DataParser.java:12)',
    code: 'public class DataParser {\n    public static String cleanInput(String input) {\n        // Bug: input is not checked for null before calling methods\n        return input.trim().toLowerCase();\n    }\n    public static void main(String[] args) {\n        cleanInput(null);\n    }\n}',
    beginner: true,
    mentor: true
  },
  {
    label: 'C++ Segmentation Fault',
    lang: 'C++',
    error: 'Segmentation fault (core dumped)\n./program',
    code: '#include <iostream>\n\nint main() {\n    int* numbers = nullptr;\n    // Bug: dereferencing a null pointer without memory allocation\n    numbers[0] = 100;\n    std::cout << numbers[0] << std::endl;\n    return 0;\n}',
    beginner: true,
    mentor: true
  }
];

const FLASK_CODE_SNIPPETS: Record<string, string> = {
  'app.py': `# app.py - Main Flask Application for CodeFix AI
from flask import Flask, render_template, request, jsonify, redirect, url_for
from services.ai_service import analyze_error_with_gemini
from database.database import init_db, save_analysis, get_all_history, get_analysis_by_id

app = Flask(__name__)
app.secret_key = "hackathon-secret-key"

with app.app_context():
    init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    lang = request.form.get('language')
    err = request.form.get('error_message')
    code = request.form.get('code_snippet')
    beginner = bool(request.form.get('beginner_mode'))
    mentor = bool(request.form.get('mentor_mode'))

    success, report, err_msg = analyze_error_with_gemini(lang, err, code, beginner, mentor)
    if not success:
        return render_template('index.html', error=err_msg)

    record_id = save_analysis(lang, err, code, report, beginner, mentor)
    return redirect(url_for('result', record_id=record_id))`,
  'services/ai_service.py': `# services/ai_service.py - Google Gemini 3.8 Flash Client
import os, json, re
from google import genai
from .prompt_builder import build_system_prompt, build_user_prompt

def analyze_error_with_gemini(language, error_msg, code_snippet, beginner, mentor):
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    system_prompt = build_system_prompt(language, beginner, mentor)
    user_prompt = build_user_prompt(language, error_msg, code_snippet, beginner, mentor)

    response = client.models.generate_content(
        model='gemini-3.8-flash',
        contents=f"{system_prompt}\\n\\n{user_prompt}",
        config={'response_mime_type': 'application/json', 'temperature': 0.2}
    )
    return True, json.loads(response.text), ""`,
  'database/database.py': `# database/database.py - SQLite Persistence Layer
import sqlite3, json, os
from datetime import datetime

DB_PATH = 'codefix.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS error_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            language TEXT NOT NULL,
            error_message TEXT NOT NULL,
            code_snippet TEXT,
            error_name TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            confidence INTEGER NOT NULL,
            what_happened TEXT NOT NULL,
            root_cause TEXT NOT NULL,
            why_it_happened TEXT NOT NULL,
            recommended_solution TEXT NOT NULL,
            corrected_code TEXT,
            explanation TEXT NOT NULL,
            prevention_tips TEXT,
            beginner_explanation TEXT,
            mentor_guidance TEXT
        )
    ''')
    conn.commit()
    conn.close()`
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'debugger' | 'history' | 'hackathon'>('debugger');
  
  // Form State
  const [language, setLanguage] = useState<string>('Python');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [beginnerMode, setBeginnerMode] = useState<boolean>(true);
  const [mentorMode, setMentorMode] = useState<boolean>(true);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Mentor Mode Interactive Hints
  const [revealedHint, setRevealedHint] = useState<number>(0);
  const [showDirectSolutionInMentor, setShowDirectSolutionInMentor] = useState<boolean>(false);

  // History State
  const [historyList, setHistoryList] = useState<HistorySummary[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('all');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Python Flask Code Explorer in Hackathon Tab
  const [selectedFlaskFile, setSelectedFlaskFile] = useState<string>('app.py');

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setLanguage(preset.lang);
    setErrorMessage(preset.error);
    setCodeSnippet(preset.code);
    setBeginnerMode(preset.beginner);
    setMentorMode(preset.mentor);
    setApiError(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!errorMessage.trim()) {
      setApiError('Please enter an error message or stack trace to diagnose.');
      return;
    }

    setApiError(null);
    setIsAnalyzing(true);
    setRevealedHint(0);
    setShowDirectSolutionInMentor(!mentorMode);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          errorMessage,
          codeSnippet,
          beginnerMode,
          mentorMode
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Analysis service failed. Please check inputs.');
      }

      setCurrentRecord(data.data);
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setApiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (data.success && data.item) {
        setCurrentRecord(data.item);
        setLanguage(data.item.language);
        setErrorMessage(data.item.errorMessage);
        setCodeSnippet(data.item.codeSnippet || '');
        setBeginnerMode(data.item.beginnerMode);
        setMentorMode(data.item.mentorMode);
        setRevealedHint(3);
        setShowDirectSolutionInMentor(true);
        setActiveTab('debugger');
      }
    } catch (err) {
      console.error('Failed to fetch item:', err);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      fetchHistory();
      if (currentRecord?.id === id) {
        setCurrentRecord(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all debug history?')) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      fetchHistory();
      setCurrentRecord(null);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const filteredHistory = historyList.filter(item => {
    const matchesSearch =
      item.error_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.language.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.category.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.what_happened.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesCategory =
      historyCategoryFilter === 'all' || item.category.toLowerCase() === historyCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#090d14] text-[#e6edf3] font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="border-b border-[#1f2937] bg-[#0d121c]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-extrabold text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  CodeFix <span className="text-cyan-400">AI</span>
                </span>
                <span className="bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                  Hackathon 2026
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">Structured AI Debugging Assistant</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('debugger')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'debugger'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161f30]'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>Debugger</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161f30]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History ({historyList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hackathon')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'hackathon'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161f30]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Hackathon Hub & Flask</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: DEBUGGER */}
        {activeTab === 'debugger' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#111c33] to-[#0d1627] border border-[#21304d] p-6 sm:p-8 shadow-xl">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Gemini 3.8 Flash • Structured Diagnosis • Socratic Mentorship
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Solve Bugs Faster. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Learn Why They Happened.</span>
                </h1>
                <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
                  Select your language, paste an error trace or broken code, and get a structured diagnosis: error fingerprint, root cause mechanics, syntax-clean corrected code, ELI5 beginner explanations, and progressive mentor clues.
                </p>
              </div>

              {/* 1-Click Demo Presets Bar for Hackathon Judges */}
              <div className="mt-6 pt-5 border-t border-[#1f2d47] flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mr-1">
                  <Play className="w-3.5 h-3.5" /> Quick Demo Presets:
                </span>
                {DEMO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs bg-[#162238] hover:bg-[#203152] border border-[#2a3f68] hover:border-cyan-400/50 text-[#cbd5e1] hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium shadow-sm"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Input & Form */}
            <form onSubmit={handleAnalyze} className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Language Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                    Programming Language <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#080d17] border border-[#24324d] rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="Python">Python</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Java">Java</option>
                    <option value="C">C</option>
                    <option value="C++">C++</option>
                    <option value="HTML/CSS">HTML / CSS</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                    <option value="SQL">SQL</option>
                  </select>
                </div>

                {/* Modes Toggles */}
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      beginnerMode
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#080d17] border-[#24324d] text-[#64748b]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={beginnerMode}
                      onChange={(e) => setBeginnerMode(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        🌱 Explain Like I'm a Beginner
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">
                        Jargon-free ELI5 analogy explaining what broke.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      mentorMode
                        ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
                        : 'bg-[#080d17] border-[#24324d] text-[#64748b]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={mentorMode}
                      onChange={(e) => setMentorMode(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        🧙‍♂️ Debugging Mentor Mode
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">
                        Socratic questions and progressive hints before answer.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                    Error Message / Stack Trace <span className="text-red-400">*</span>
                  </label>
                  <span className="text-xs text-[#64748b]">Console output, terminal crash, or compiler warning</span>
                </div>
                <textarea
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  rows={4}
                  placeholder="Paste error stack trace here (e.g. IndexError: list index out of range at line 5...)"
                  className="w-full bg-[#080d17] border border-[#24324d] rounded-xl p-3.5 text-sm font-mono text-white placeholder-[#475569] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Source Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                    Relevant Code Snippet <span className="text-[#64748b] text-[11px] font-normal">(Optional but recommended)</span>
                  </label>
                  <span className="text-xs text-[#64748b]">Function or loop where error occurred</span>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  rows={6}
                  placeholder="// Paste the code block related to the error here..."
                  className="w-full bg-[#080d17] border border-[#24324d] rounded-xl p-3.5 text-sm font-mono text-white placeholder-[#475569] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Error Alert */}
              {apiError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Diagnosis Failed:</strong>
                    {apiError}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#64748b]">
                  Backend API: <span className="text-cyan-400 font-mono">POST /api/analyze</span> with Gemini 3.8 Flash
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Diagnosing With Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze & Fix Error</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* RESULTS VIEW */}
            {currentRecord && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. TOP RESULT HEADER & FINGERPRINT */}
                <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f293d] pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#64748b]">ID: {currentRecord.id}</span>
                        <span className="text-xs text-[#64748b]">•</span>
                        <span className="text-xs text-[#64748b]">{new Date(currentRecord.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-white mt-1">
                        {currentRecord.result.error_name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentRecord.result.recommended_solution, 'full-fix')}
                        className="px-3.5 py-2 rounded-lg bg-[#162238] hover:bg-[#203152] border border-[#2a3f68] text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === 'full-fix' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>Copy Fix</span>
                      </button>
                    </div>
                  </div>

                  {/* ERROR FINGERPRINT */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
                      <Search className="w-4 h-4" /> ERROR FINGERPRINT
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#080d17] border border-[#1e293d] rounded-xl p-3.5 text-center">
                        <span className="block text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">Language</span>
                        <span className="text-sm font-bold text-cyan-400 mt-1 block">{currentRecord.language}</span>
                      </div>

                      <div className="bg-[#080d17] border border-[#1e293d] rounded-xl p-3.5 text-center">
                        <span className="block text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">Category</span>
                        <span className="text-sm font-bold text-purple-400 mt-1 block">{currentRecord.result.category}</span>
                      </div>

                      <div className="bg-[#080d17] border border-[#1e293d] rounded-xl p-3.5 text-center">
                        <span className="block text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">Severity</span>
                        <span className={`text-sm font-bold mt-1 block ${
                          currentRecord.result.severity === 'Critical' ? 'text-red-400' :
                          currentRecord.result.severity === 'High' ? 'text-orange-400' :
                          currentRecord.result.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {currentRecord.result.severity}
                        </span>
                      </div>

                      <div className="bg-[#080d17] border border-[#1e293d] rounded-xl p-3.5 text-center">
                        <span className="block text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">Confidence</span>
                        <span className="text-sm font-bold text-emerald-400 mt-1 block">
                          {currentRecord.result.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BEGINNER MODE (If Enabled) */}
                {currentRecord.beginnerMode && currentRecord.result.beginner_explanation && (
                  <div className="bg-gradient-to-r from-[#0d231b] via-[#0f281f] to-[#0d231b] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                      <GraduationCap className="w-5 h-5" />
                      <span>Explain Like I'm a Beginner (ELI5)</span>
                    </div>
                    <p className="text-base text-emerald-100/90 leading-relaxed">
                      {currentRecord.result.beginner_explanation}
                    </p>
                  </div>
                )}

                {/* 3. DEBUGGING MENTOR MODE (If Enabled) */}
                {currentRecord.mentorMode && currentRecord.result.mentor_guidance && (
                  <div className="bg-gradient-to-r from-[#170e2b] via-[#1c1236] to-[#170e2b] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider">
                        <HelpCircle className="w-5 h-5" />
                        <span>Debugging Mentor Guidance (Socratic Walkthrough)</span>
                      </div>
                      <span className="text-xs text-purple-300/70">
                        {revealedHint < 3 ? 'Click hints progressively to test yourself' : 'All hints revealed'}
                      </span>
                    </div>

                    <div className="bg-[#0b0617] border border-purple-900/50 rounded-xl p-4">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
                        🤔 Mentor Guiding Question:
                      </span>
                      <p className="text-white font-medium text-sm">
                        {currentRecord.result.mentor_guidance.guiding_question}
                      </p>
                    </div>

                    {/* Sequential Clues */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Hint 1 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        revealedHint >= 1
                          ? 'bg-[#120a22] border-purple-500/40 text-purple-100'
                          : 'bg-[#0a0514] border-purple-950/40 text-[#64748b]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">💡 Hint 1 (Gentle Clue)</span>
                          {revealedHint < 1 && (
                            <button
                              type="button"
                              onClick={() => setRevealedHint(1)}
                              className="text-[11px] bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white px-2 py-0.5 rounded font-medium transition-all"
                            >
                              Reveal
                            </button>
                          )}
                        </div>
                        {revealedHint >= 1 ? (
                          <p className="text-xs text-purple-200">{currentRecord.result.mentor_guidance.hint_1}</p>
                        ) : (
                          <p className="text-xs italic text-gray-500">Click to reveal subtle clue...</p>
                        )}
                      </div>

                      {/* Hint 2 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        revealedHint >= 2
                          ? 'bg-[#120a22] border-purple-500/40 text-purple-100'
                          : 'bg-[#0a0514] border-purple-950/40 text-[#64748b]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">💡 Hint 2 (Deeper Clue)</span>
                          {revealedHint === 1 && (
                            <button
                              type="button"
                              onClick={() => setRevealedHint(2)}
                              className="text-[11px] bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white px-2 py-0.5 rounded font-medium transition-all"
                            >
                              Reveal
                            </button>
                          )}
                        </div>
                        {revealedHint >= 2 ? (
                          <p className="text-xs text-purple-200">{currentRecord.result.mentor_guidance.hint_2}</p>
                        ) : (
                          <p className="text-xs italic text-gray-500">Locked until Hint 1 is viewed</p>
                        )}
                      </div>

                      {/* Hint 3 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        revealedHint >= 3
                          ? 'bg-[#120a22] border-purple-500/40 text-purple-100'
                          : 'bg-[#0a0514] border-purple-950/40 text-[#64748b]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">💡 Hint 3 (Direct Clue)</span>
                          {revealedHint === 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                setRevealedHint(3);
                                setShowDirectSolutionInMentor(true);
                              }}
                              className="text-[11px] bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white px-2 py-0.5 rounded font-medium transition-all"
                            >
                              Reveal
                            </button>
                          )}
                        </div>
                        {revealedHint >= 3 ? (
                          <p className="text-xs text-purple-200">{currentRecord.result.mentor_guidance.hint_3}</p>
                        ) : (
                          <p className="text-xs italic text-gray-500">Locked until Hint 2 is viewed</p>
                        )}
                      </div>
                    </div>

                    {currentRecord.result.mentor_guidance.checkpoint_task && (
                      <div className="p-3.5 bg-blue-950/30 border-l-4 border-blue-400 rounded-r-xl text-xs text-blue-200">
                        <strong className="text-blue-300">✅ Self-Check Action:</strong> {currentRecord.result.mentor_guidance.checkpoint_task}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ERROR DETECTED & ROOT CAUSE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Error Detected Card */}
                  <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                      <AlertCircle className="w-5 h-5" />
                      <span>🔴 What Happened</span>
                    </div>
                    <p className="text-sm text-[#cbd5e1] leading-relaxed">
                      {currentRecord.result.what_happened}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#64748b]">
                        <span>Reported Error Message</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentRecord.errorMessage, 'err-raw')}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === 'err-raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="bg-[#080d17] border border-[#1e293d] rounded-xl p-3 text-xs font-mono text-red-300 overflow-x-auto">
                        {currentRecord.errorMessage}
                      </pre>
                    </div>
                  </div>

                  {/* Root Cause Card */}
                  <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider">
                      <Cpu className="w-5 h-5" />
                      <span>🧠 Root Cause Mechanics</span>
                    </div>
                    <div className="p-3.5 bg-red-950/20 border-l-4 border-red-500 rounded-r-xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-300 block mb-1">Underlying Bug:</span>
                      <p className="text-sm text-red-100 font-medium">{currentRecord.result.root_cause}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">Why It Happened:</span>
                      <p className="text-sm text-[#cbd5e1] leading-relaxed">
                        {currentRecord.result.why_it_happened}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. RECOMMENDED FIX & COMMANDS */}
                <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5" />
                      <span>🛠️ Recommended Fix</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentRecord.result.recommended_solution, 'fix-text')}
                      className="px-3 py-1 rounded-lg bg-[#162238] hover:bg-[#203152] border border-[#2a3f68] text-xs text-white flex items-center gap-1.5"
                    >
                      {copiedId === 'fix-text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Fix Steps</span>
                    </button>
                  </div>
                  <p className="text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-line">
                    {currentRecord.result.recommended_solution}
                  </p>

                  {/* Terminal Commands if any */}
                  {currentRecord.result.commands && currentRecord.result.commands.length > 0 && (
                    <div className="pt-3 border-t border-[#1e293d] space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] block">
                        CLI / Terminal Commands:
                      </span>
                      {currentRecord.result.commands.map((cmd, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#080d17] border border-[#24324d] rounded-xl px-4 py-2.5">
                          <code className="text-xs font-mono text-emerald-300">{cmd}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(cmd, `cmd-${idx}`)}
                            className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1"
                          >
                            {copiedId === `cmd-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. CORRECTED CODE BLOCK */}
                {currentRecord.result.corrected_code && (
                  <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider">
                        <Code2 className="w-5 h-5" />
                        <span>💻 Corrected Code</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentRecord.result.corrected_code, 'corrected-code')}
                        className="px-3 py-1 rounded-lg bg-[#162238] hover:bg-[#203152] border border-[#2a3f68] text-xs text-white flex items-center gap-1.5"
                      >
                        {copiedId === 'corrected-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Corrected Code</span>
                      </button>
                    </div>
                    <pre className="bg-[#080d17] border border-[#1e293d] rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {currentRecord.result.corrected_code}
                    </pre>
                  </div>
                )}

                {/* 7. EXPLANATION & PREVENTION TIPS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Detailed Explanation */}
                  <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                      <Info className="w-5 h-5" />
                      <span>📖 Code Explanation</span>
                    </div>
                    <p className="text-sm text-[#cbd5e1] leading-relaxed">
                      {currentRecord.result.explanation}
                    </p>
                  </div>

                  {/* Prevention Tips */}
                  <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5" />
                      <span>🛡️ Future Prevention Tips</span>
                    </div>
                    <ul className="space-y-2 text-sm text-[#cbd5e1]">
                      {currentRecord.result.prevention_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-1 font-bold">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Debug Session History</h2>
                <p className="text-sm text-[#8b949e]">
                  All analyzed errors persisted in local database storage. Click any session to reload its full diagnosis.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="px-3.5 py-2 rounded-xl bg-[#162238] hover:bg-[#203152] border border-[#2a3f68] text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Search by error name, language, category, or description..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-[#0f1726] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <select
                  value={historyCategoryFilter}
                  onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                  className="w-full bg-[#0f1726] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Categories</option>
                  <option value="Runtime">Runtime</option>
                  <option value="Syntax">Syntax</option>
                  <option value="Logic">Logic</option>
                  <option value="Type">Type</option>
                  <option value="Dependency">Dependency</option>
                  <option value="Memory">Memory</option>
                  <option value="Configuration">Configuration</option>
                </select>
              </div>
            </div>

            {/* History Table / Cards */}
            {filteredHistory.length === 0 ? (
              <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto text-xl">
                  📭
                </div>
                <h3 className="text-lg font-bold text-white">No Debug Sessions Found</h3>
                <p className="text-sm text-[#8b949e] max-w-sm mx-auto">
                  {historySearch ? 'No sessions match your search terms.' : 'Run your first diagnosis in the Debugger tab to populate this archive.'}
                </p>
                <button
                  onClick={() => setActiveTab('debugger')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold mt-2 inline-flex items-center gap-1.5"
                >
                  Go to Debugger
                </button>
              </div>
            ) : (
              <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0a0f1a] text-[#8b949e] uppercase text-[11px] tracking-wider border-b border-[#1e293b]">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                        <th className="px-5 py-3.5 font-semibold">Language</th>
                        <th className="px-5 py-3.5 font-semibold">Error Name / Trace</th>
                        <th className="px-5 py-3.5 font-semibold">Category</th>
                        <th className="px-5 py-3.5 font-semibold">Severity</th>
                        <th className="px-5 py-3.5 font-semibold">Confidence</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleLoadHistoryItem(item.id)}
                          className="hover:bg-[#152033] cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 text-xs text-[#64748b] whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {item.language}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-white hover:text-cyan-400 transition-colors">
                              {item.error_name}
                            </div>
                            <div className="text-xs text-[#64748b] line-clamp-1 max-w-md mt-0.5">
                              {item.what_happened}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`text-xs font-semibold ${
                              item.severity === 'Critical' ? 'text-red-400' :
                              item.severity === 'High' ? 'text-orange-400' :
                              item.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-emerald-400">
                            {item.confidence}%
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleLoadHistoryItem(item.id)}
                              className="px-2.5 py-1 rounded bg-[#1f2d47] hover:bg-cyan-600 text-xs font-medium text-white transition-all"
                            >
                              Load
                            </button>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              className="p-1.5 rounded hover:bg-red-950/40 text-red-400 transition-all"
                              title="Delete session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HACKATHON HUB & STANDALONE FLASK ARCHITECTURE */}
        {activeTab === 'hackathon' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#170e2b] via-[#1e1338] to-[#170e2b] border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Award className="w-4 h-4" /> Hackathon Evaluation & Architecture Package
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                CodeFix AI Hackathon Deliverables & Standalone Flask Engine
              </h2>
              <p className="text-sm sm:text-base text-purple-200/80 mt-2 max-w-3xl leading-relaxed">
                Here is the complete project blueprint designed to excel in all 6 judging criteria. You can also view the exact standalone Python/Flask + SQLite code generated in the workspace to clone or submit to GitHub!
              </p>
            </div>

            {/* Judging Criteria Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <GitBranch className="w-4 h-4" /> 1. GitHub Collaboration
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Clear branching strategy (<code className="text-cyan-300">main</code>, <code className="text-cyan-300">develop</code>, <code className="text-cyan-300">feature/*</code>), conventional commits, PR review guidelines, and role division.
                </p>
              </div>

              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> 2. Functionality & Completion
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  End-to-end working system: error validation, Gemini 3.8 Flash structured JSON parsing, root cause diagnosis, syntax-clean fix, and SQLite storage.
                </p>
              </div>

              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> 3. Innovation & Uniqueness
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Error Fingerprint categorization, Socratic Mentor Mode (hints before answers), and ELI5 Beginner Mode tailored for learning developers.
                </p>
              </div>

              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FolderTree className="w-4 h-4" /> 4. Architecture & Technical
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Clean separation: Controller (<code className="text-amber-300">app.py</code>), AI Service layer, Prompt Builder, and Data Access Layer (<code className="text-amber-300">database.py</code>).
                </p>
              </div>

              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Code2 className="w-4 h-4" /> 5. UI/UX & Usability
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Responsive developer aesthetic, code syntax blocks, 1-click clipboard buttons, error severity tags, and instant preset test cases.
                </p>
              </div>

              <div className="bg-[#0f1726] border border-[#1e293b] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                  <Play className="w-4 h-4" /> 6. Final Demo Presentation
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Rehearsed 2-minute judge walkthrough with 1-click sample errors, live diagnosis, mentor hint reveal, and database persistence verify.
                </p>
              </div>
            </div>

            {/* Standalone Python / Flask Source Explorer */}
            <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f293b] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    Generated Python / Flask Repository Files
                  </h3>
                  <p className="text-xs text-[#8b949e]">
                    Inspect the exact code created in <code className="text-cyan-300 font-mono">/CodeFix-AI-Flask/</code> for your local machine or GitHub repo.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#080d17] p-1 rounded-xl border border-[#1e293d]">
                  {Object.keys(FLASK_CODE_SNIPPETS).map((filename) => (
                    <button
                      key={filename}
                      onClick={() => setSelectedFlaskFile(filename)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        selectedFlaskFile === filename
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-[#8b949e] hover:text-white'
                      }`}
                    >
                      {filename}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code display with copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#8b949e]">
                  <span className="font-mono text-cyan-400">{selectedFlaskFile}</span>
                  <button
                    onClick={() => handleCopy(FLASK_CODE_SNIPPETS[selectedFlaskFile], 'flask-file-copy')}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    {copiedId === 'flask-file-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre className="bg-[#080d17] border border-[#1e293d] rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[380px]">
                  {FLASK_CODE_SNIPPETS[selectedFlaskFile]}
                </pre>
              </div>
            </div>

            {/* 2-Minute Demo Script */}
            <div className="bg-[#0f1726] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                2-Minute Hackathon Demo Script
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-[#cbd5e1]">
                <div className="p-3.5 bg-[#080d17] border border-[#1e293d] rounded-xl">
                  <strong className="text-cyan-400 block mb-1">0:00 - 0:25: The Problem & Hook</strong>
                  <p>"Judges, every developer loses hours deciphering cryptic errors. ChatGPT gives walls of unstructured text. We built CodeFix AI: a structured AI debugging assistant that isolates root causes, produces verified fixes, and mentors developers."</p>
                </div>
                <div className="p-3.5 bg-[#080d17] border border-[#1e293d] rounded-xl">
                  <strong className="text-emerald-400 block mb-1">0:25 - 1:00: Live Diagnosis</strong>
                  <p>"Click 'Python IndexError' preset. Click 'Analyze & Fix'. Look at the Error Fingerprint: Category: Runtime, Severity: Medium, Confidence: 98%. The AI isolates the exact off-by-one boundary defect and produces corrected idiomatic code."</p>
                </div>
                <div className="p-3.5 bg-[#080d17] border border-[#1e293d] rounded-xl">
                  <strong className="text-purple-400 block mb-1">1:00 - 1:35: The Innovation (Beginner & Mentor Modes)</strong>
                  <p>"Notice Beginner Mode: it explains the bug with a real-world box analogy. Notice Debugging Mentor Mode: it asks a Socratic question and offers 3 progressive hints so learners develop debugging intuition instead of blind copy-pasting."</p>
                </div>
                <div className="p-3.5 bg-[#080d17] border border-[#1e293d] rounded-xl">
                  <strong className="text-amber-400 block mb-1">1:35 - 2:00: Persistence & Tech Stack</strong>
                  <p>"Switch to History: every debug session is archived in SQLite with full search. The system is built with Flask, Google Gemini 3.8 Flash, and a clean prompt-builder architecture."</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f2937] bg-[#0a0f1a] py-6 text-center text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            CodeFix AI • Hackathon 2026 Project • Powered by Google Gemini 3.8 Flash
          </div>
          <div className="flex items-center gap-4 text-[#8b949e]">
            <span>Flask & SQLite Core</span>
            <span>•</span>
            <span>TypeScript & Vite Engine</span>
            <span>•</span>
            <button onClick={() => setActiveTab('hackathon')} className="hover:text-cyan-400 transition-colors">
              View Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
