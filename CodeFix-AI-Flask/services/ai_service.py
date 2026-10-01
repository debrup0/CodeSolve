"""
ai_service.py - Google Gemini API Integration for CodeFix AI
Connects to Gemini API, sends prompt, and parses the structured response.
"""

import os
import json
import re
from typing import Dict, Any, Tuple
from google import genai
from .prompt_builder import build_system_prompt, build_user_prompt

def analyze_error_with_gemini(
    language: str,
    error_message: str,
    code_snippet: str = "",
    beginner_mode: bool = False,
    mentor_mode: bool = False
) -> Tuple[bool, Dict[str, Any], str]:
    """
    Sends error and code to Google Gemini API using google-genai SDK.
    Returns:
        (success: bool, report: dict, error_message: str)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return False, {}, "GEMINI_API_KEY is not set in the environment or .env file."

    # Input length validation
    if len(error_message) > 20000:
        return False, {}, "Error message exceeds maximum limit of 20,000 characters."
    if code_snippet and len(code_snippet) > 30000:
        return False, {}, "Code snippet exceeds maximum limit of 30,000 characters."

    try:
        # Initialize Google GenAI client
        client = genai.Client(api_key=api_key)

        system_instruction = build_system_prompt(language, beginner_mode, mentor_mode)
        user_prompt = build_user_prompt(language, error_message, code_snippet, beginner_mode, mentor_mode)

        # Call Gemini 3.8 Flash model
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=f"{system_instruction}\n\n{user_prompt}",
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.2
            }
        )

        response_text = response.text or ""
        
        # Parse JSON output safely
        parsed_data = None
        try:
            parsed_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Strip markdown code blocks if model wrapped it
            cleaned = re.sub(r'^```json\s*', '', response_text, flags=re.IGNORECASE)
            cleaned = re.sub(r'```\s*$', '', cleaned).strip()
            parsed_data = json.loads(cleaned)

        # Ensure required fields have valid defaults
        parsed_data.setdefault('error_name', 'Identified Error')
        parsed_data.setdefault('category', 'Runtime')
        parsed_data.setdefault('severity', 'Medium')
        parsed_data.setdefault('confidence', 90)
        parsed_data.setdefault('prevention_tips', [])
        parsed_data.setdefault('commands', [])

        return True, parsed_data, ""

    except Exception as e:
        error_str = str(e)
        if "quota" in error_str.lower() or "rate" in error_str.lower():
            return False, {}, "Gemini API rate limit or quota exceeded. Please wait a moment and try again."
        return False, {}, f"AI service error: {error_str}"
