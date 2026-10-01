"""
test_app.py - Automated Unit & Integration Tests for CodeFix AI
Run with: pytest
"""

import pytest
import os
import tempfile
from app import app
from database.database import init_db, save_analysis, get_all_history, get_analysis_by_id

@pytest.fixture
def client():
    """Sets up a temporary test database and Flask test client."""
    db_fd, db_path = tempfile.mkstemp()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

    os.close(db_fd)
    os.unlink(db_path)

def test_home_page_loads(client):
    """Verifies that the home page renders with supported languages."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"CodeFix" in response.data
    assert b"Python" in response.data
    assert b"JavaScript" in response.data

def test_empty_form_submission_validation(client):
    """Submitting empty fields should be rejected and redirect to home."""
    response = client.post('/analyze', data={
        'language': '',
        'error_message': ''
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please select a valid programming language" in response.data

def test_database_persistence_and_retrieval(client):
    """Verifies inserting a mock report into SQLite and querying it."""
    mock_report = {
        'error_name': 'ZeroDivisionError: division by zero',
        'category': 'Logic',
        'severity': 'Medium',
        'confidence': 99,
        'what_happened': 'Attempted division by zero',
        'root_cause': 'Denominator evaluated to 0',
        'why_it_happened': 'Mathematical zero division is undefined',
        'recommended_solution': 'Add an if check before dividing',
        'corrected_code': 'if b != 0: return a / b',
        'explanation': 'Guards against zero values',
        'prevention_tips': ['Always validate divisors'],
        'commands': [],
        'beginner_explanation': 'You cannot slice a pizza into zero pieces.'
    }

    record_id = save_analysis(
        language='Python',
        error_message='ZeroDivisionError: division by zero',
        code_snippet='def div(a, b): return a / b',
        report=mock_report,
        beginner_mode=True,
        mentor_mode=False
    )

    assert record_id is not None
    assert record_id > 0

    record = get_analysis_by_id(record_id)
    assert record is not None
    assert record['error_name'] == 'ZeroDivisionError: division by zero'
    assert record['category'] == 'Logic'
    assert record['confidence'] == 99

def test_history_page_renders(client):
    """Checks that history page returns 200."""
    response = client.get('/history')
    assert response.status_code == 200
    assert b"Debug History" in response.data
