"""
app.py - Main Flask Application for CodeFix AI
Routes for web interface, error analysis, and history management.
"""

import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from database.database import (
    init_db, save_analysis, get_all_history, 
    get_analysis_by_id, delete_history_item, clear_all_history
)
from services.ai_service import analyze_error_with_gemini

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "codefix-ai-hackathon-secret-key-2026")

# Supported programming languages
SUPPORTED_LANGUAGES = [
    "Python",
    "JavaScript",
    "Java",
    "C",
    "C++",
    "HTML/CSS",
    "TypeScript",
    "Go",
    "Rust",
    "SQL"
]

# Initialize database schema on startup
with app.app_context():
    init_db()

@app.route('/')
def index():
    """Renders the main debugging submission page."""
    return render_template('index.html', languages=SUPPORTED_LANGUAGES)

@app.route('/analyze', methods=['POST'])
def analyze():
    """Processes user submission and calls Gemini AI."""
    language = request.form.get('language', '').strip()
    error_message = request.form.get('error_message', '').strip()
    code_snippet = request.form.get('code_snippet', '').strip()
    beginner_mode = bool(request.form.get('beginner_mode'))
    mentor_mode = bool(request.form.get('mentor_mode'))

    # Validation
    if not language or language not in SUPPORTED_LANGUAGES:
        flash("Please select a valid programming language.", "error")
        return redirect(url_for('index'))

    if not error_message:
        flash("Please enter or paste an error message.", "error")
        return redirect(url_for('index'))

    # Call AI Service
    success, report, error_detail = analyze_error_with_gemini(
        language=language,
        error_message=error_message,
        code_snippet=code_snippet,
        beginner_mode=beginner_mode,
        mentor_mode=mentor_mode
    )

    if not success:
        flash(f"Error during analysis: {error_detail}", "error")
        return render_template(
            'index.html',
            languages=SUPPORTED_LANGUAGES,
            selected_language=language,
            error_message=error_message,
            code_snippet=code_snippet,
            beginner_mode=beginner_mode,
            mentor_mode=mentor_mode
        )

    # Save to SQLite database
    record_id = save_analysis(
        language=language,
        error_message=error_message,
        code_snippet=code_snippet,
        report=report,
        beginner_mode=beginner_mode,
        mentor_mode=mentor_mode
    )

    return redirect(url_for('result', record_id=record_id))

@app.route('/result/<int:record_id>')
def result(record_id):
    """Displays a single debugging report from SQLite."""
    record = get_analysis_by_id(record_id)
    if not record:
        flash("Analysis record not found.", "error")
        return redirect(url_for('history'))

    return render_template('result.html', record=record)

@app.route('/history')
def history():
    """Lists past debug sessions from SQLite."""
    records = get_all_history()
    return render_template('history.html', records=records)

@app.route('/history/delete/<int:record_id>', methods=['POST'])
def delete_record(record_id):
    """Deletes a single history record."""
    delete_history_item(record_id)
    flash("Record removed from history.", "info")
    return redirect(url_for('history'))

@app.route('/history/clear', methods=['POST'])
def clear_history():
    """Clears all history records."""
    clear_all_history()
    flash("All history cleared.", "info")
    return redirect(url_for('history'))

# JSON API Endpoints for headless or AJAX consumers
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """API endpoint accepting JSON payload."""
    data = request.get_json() or {}
    language = data.get('language', '').strip()
    error_message = data.get('error_message', '').strip()
    code_snippet = data.get('code_snippet', '').strip()
    beginner_mode = bool(data.get('beginner_mode'))
    mentor_mode = bool(data.get('mentor_mode'))

    if not language:
        return jsonify({"success": False, "error": "Language is required"}), 400
    if not error_message:
        return jsonify({"success": False, "error": "Error message is required"}), 400

    success, report, error_detail = analyze_error_with_gemini(
        language=language,
        error_message=error_message,
        code_snippet=code_snippet,
        beginner_mode=beginner_mode,
        mentor_mode=mentor_mode
    )

    if not success:
        return jsonify({"success": False, "error": error_detail}), 500

    record_id = save_analysis(language, error_message, code_snippet, report, beginner_mode, mentor_mode)
    report['record_id'] = record_id
    return jsonify({"success": True, "data": report})

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
