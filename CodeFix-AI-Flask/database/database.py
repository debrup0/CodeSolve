"""
database.py - SQLite Database Handler for CodeFix AI
Manages persistent storage of debug reports, fingerprints, and user sessions.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'codefix.db')

def get_db_connection() -> sqlite3.Connection:
    """Creates a connection to the SQLite database with dictionary-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
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
            prevention_tips TEXT, -- JSON array
            commands TEXT,        -- JSON array
            beginner_explanation TEXT,
            mentor_guidance TEXT, -- JSON object
            is_beginner_mode INTEGER DEFAULT 0,
            is_mentor_mode INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()

def save_analysis(
    language: str,
    error_message: str,
    code_snippet: Optional[str],
    report: Dict[str, Any],
    beginner_mode: bool = False,
    mentor_mode: bool = False
) -> int:
    """Saves a structured debugging report into the SQLite database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    cursor.execute('''
        INSERT INTO error_history (
            timestamp, language, error_message, code_snippet,
            error_name, category, severity, confidence,
            what_happened, root_cause, why_it_happened,
            recommended_solution, corrected_code, explanation,
            prevention_tips, commands, beginner_explanation,
            mentor_guidance, is_beginner_mode, is_mentor_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        timestamp,
        language,
        error_message,
        code_snippet or '',
        report.get('error_name', 'Unknown Error'),
        report.get('category', 'Runtime'),
        report.get('severity', 'Medium'),
        int(report.get('confidence', 90)),
        report.get('what_happened', ''),
        report.get('root_cause', ''),
        report.get('why_it_happened', ''),
        report.get('recommended_solution', ''),
        report.get('corrected_code', ''),
        report.get('explanation', ''),
        json.dumps(report.get('prevention_tips', [])),
        json.dumps(report.get('commands', [])),
        report.get('beginner_explanation', ''),
        json.dumps(report.get('mentor_guidance', {})),
        1 if beginner_mode else 0,
        1 if mentor_mode else 0
    ))
    
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_all_history() -> List[Dict[str, Any]]:
    """Fetches summary list of all stored debugging reports."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, timestamp, language, error_name, category, severity, confidence, what_happened, is_beginner_mode, is_mentor_mode
        FROM error_history
        ORDER BY id DESC
    ''')
    
    rows = cursor.fetchall()
    history = [dict(row) for row in rows]
    conn.close()
    return history

def get_analysis_by_id(record_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves full details for a single debug report."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM error_history WHERE id = ?', (record_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    data = dict(row)
    # Parse stored JSON fields
    try:
        data['prevention_tips'] = json.loads(data.get('prevention_tips') or '[]')
    except Exception:
        data['prevention_tips'] = []
    
    try:
        data['commands'] = json.loads(data.get('commands') or '[]')
    except Exception:
        data['commands'] = []
        
    try:
        data['mentor_guidance'] = json.loads(data.get('mentor_guidance') or '{}')
    except Exception:
        data['mentor_guidance'] = {}

    return data

def delete_history_item(record_id: int) -> bool:
    """Deletes a specific history record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM error_history WHERE id = ?', (record_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def clear_all_history() -> None:
    """Wipes all analysis history from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM error_history')
    conn.commit()
    conn.close()
