"""
prompt_builder.py - Prompt engineering module for CodeFix AI
Constructs structured instructions for the Google Gemini API.
"""

def build_system_prompt(language: str, beginner_mode: bool, mentor_mode: bool) -> str:
    """Builds the system instruction prompt enforcing structured output and safety rules."""
    return f"""You are CodeFix AI, an expert software debugging assistant and developer mentor.
Your task is to analyze programming errors and return a precise, structured JSON debugging report.

CRITICAL RULES:
1. Return ONLY valid, RFC 8259 compliant JSON. Do NOT wrap output with triple backtick markdown quotes.
2. If the user does not provide enough information or if the error is incomplete, explicitly state what is missing instead of hallucinating.
3. Language specified: {language}.
4. Error Category must strictly be one of:
   "Syntax", "Logic", "Runtime", "Dependency", "Type", "Memory", "Configuration", "Network", "Database", "Authentication", "Other".
5. Severity must be: "Low", "Medium", "High", or "Critical".
6. Confidence must be an integer between 0 and 100.
7. Beginner Mode is {'ENABLED' if beginner_mode else 'DISABLED'}. In "beginner_explanation", provide an intuitive, real-world analogy and explain the error in plain English without confusing jargon.
8. Debugging Mentor Mode is {'ENABLED' if mentor_mode else 'DISABLED'}. In "mentor_guidance", provide a Socratic guiding question and sequential hints that guide the user to identify the fix themselves before looking at the solution.
9. "corrected_code" must contain valid, idiomatic code that directly fixes the problem.
10. "prevention_tips" should be an array of practical best practices for avoiding this error in the future.
11. "commands" should contain any relevant terminal commands (e.g., pip install, npm install, gcc flags) if needed, or an empty array.
"""

def build_user_prompt(language: str, error_message: str, code_snippet: str, beginner_mode: bool, mentor_mode: bool) -> str:
    """Constructs the prompt containing the user's error message, optional code, and parameters."""
    code_section = f"""SOURCE CODE:
```{language}
{code_snippet.strip()}
```""" if code_snippet and code_snippet.strip() else "SOURCE CODE: None provided. Analyze the error message and provide the standard pattern fix."

    return f"""Analyze this programming error:

LANGUAGE: {language}
BEGINNER_MODE: {'YES' if beginner_mode else 'NO'}
MENTOR_MODE: {'YES' if mentor_mode else 'NO'}

ERROR MESSAGE:
```
{error_message.strip()}
```

{code_section}

Required JSON Output Schema:
{{
  "error_name": "string (e.g., IndexError: list index out of range)",
  "category": "Syntax | Logic | Runtime | Dependency | Type | Memory | Configuration | Network | Database | Authentication | Other",
  "severity": "Low | Medium | High | Critical",
  "confidence": 95,
  "what_happened": "string (what failed immediately)",
  "root_cause": "string (the exact underlying defect)",
  "why_it_happened": "string (technical reason why the language/runtime threw this)",
  "recommended_solution": "string (step-by-step instructions)",
  "corrected_code": "string (fully corrected code snippet)",
  "explanation": "string (walkthrough of the correction)",
  "prevention_tips": ["string tip 1", "string tip 2"],
  "commands": ["command 1 if any"],
  "beginner_explanation": "string (easy ELI5 analogy)",
  "mentor_guidance": {{
    "guiding_question": "string (thought-provoking question)",
    "hint_1": "string (gentle clue)",
    "hint_2": "string (deeper clue)",
    "hint_3": "string (direct clue)",
    "checkpoint_task": "string (actionable check for user)"
  }}
}}
"""
