import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '5mb' }));

// Ensure data directory for persistent history
const DATA_DIR = path.resolve(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

function loadHistory(): AnalysisRecord[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('Error reading history file:', err);
  }
  return [];
}

function saveHistory(records: AnalysisRecord[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing history file:', err);
  }
}

// Initialize history with sample seed data if empty
let historyStore: AnalysisRecord[] = loadHistory();
if (historyStore.length === 0) {
  historyStore = [
    {
      id: 'demo-py-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      language: 'Python',
      errorMessage: 'IndexError: list index out of range',
      codeSnippet: 'items = [10, 20, 30]\nfor i in range(len(items) + 1):\n    print(items[i])',
      beginnerMode: true,
      mentorMode: false,
      result: {
        error_name: 'IndexError: list index out of range',
        category: 'Runtime',
        severity: 'Medium',
        confidence: 98,
        what_happened: 'The program tried to access an item at an index that does not exist in the list.',
        root_cause: 'The loop condition `range(len(items) + 1)` iterates up to index 3, but the 3-element list only has indices 0, 1, and 2.',
        why_it_happened: 'In Python, lists are 0-indexed. With 3 items, valid indices are 0, 1, and 2. Attempting to access index 3 causes Python to raise an IndexError.',
        recommended_solution: 'Iterate directly over the elements using `for item in items:` or use `range(len(items))` without adding 1.',
        corrected_code: 'items = [10, 20, 30]\n# Direct iteration (Pythonic)\nfor item in items:\n    print(item)\n\n# Or using standard index range:\n# for i in range(len(items)):\n#     print(items[i])',
        explanation: 'Iterating directly over items avoids manual index calculation and prevents off-by-one errors completely.',
        prevention_tips: [
          'Prefer direct iteration `for item in collection:` over index-based loops.',
          'If you need indices, use Python built-in `enumerate(items)`.',
          'Remember list indices stop at `len - 1` because indexing starts at 0.'
        ],
        commands: ['python3 main.py'],
        beginner_explanation: 'Imagine a shelf with 3 boxes labeled #0, #1, and #2. The program asked for box #3, which does not exist, so Python stopped and sounded an alarm.',
        mentor_guidance: {
          guiding_question: 'How many items are in the list, and what are their index numbers starting from 0?',
          hint_1: 'Check how many times your loop runs compared to the list length.',
          hint_2: 'Notice `len(items)` is 3. What values does `range(len(items) + 1)` generate?',
          hint_3: '`range(4)` gives 0, 1, 2, 3. Index 3 is out of bounds.',
          checkpoint_task: 'Try removing `+ 1` or changing the loop to `for item in items:` and re-run.'
        }
      }
    }
  ];
  saveHistory(historyStore);
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CodeFix AI API',
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.get('/api/history', (_req: Request, res: Response) => {
  res.json({
    success: true,
    history: historyStore.map(h => ({
      id: h.id,
      timestamp: h.timestamp,
      language: h.language,
      error_name: h.result.error_name,
      category: h.result.category,
      severity: h.result.severity,
      confidence: h.result.confidence,
      what_happened: h.result.what_happened,
      beginnerMode: h.beginnerMode,
      mentorMode: h.mentorMode
    }))
  });
});

app.get('/api/history/:id', (req: Request, res: Response) => {
  const item = historyStore.find(h => h.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'History item not found' });
  }
  return res.json({ success: true, item });
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  historyStore = historyStore.filter(h => h.id !== req.params.id);
  saveHistory(historyStore);
  res.json({ success: true, message: 'Deleted history record' });
});

app.delete('/api/history', (_req: Request, res: Response) => {
  historyStore = [];
  saveHistory(historyStore);
  res.json({ success: true, message: 'Cleared all history' });
});

app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { language, errorMessage, codeSnippet, beginnerMode, mentorMode } = req.body;

    // Strict validation
    if (!language || typeof language !== 'string' || !language.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please select a programming language.'
      });
    }

    if (!errorMessage || typeof errorMessage !== 'string' || !errorMessage.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide an error message or description of the error.'
      });
    }

    if (errorMessage.length > 20000) {
      return res.status(400).json({
        success: false,
        error: 'Payload Too Large',
        message: 'Error message is too long (maximum 20,000 characters).'
      });
    }

    if (codeSnippet && typeof codeSnippet === 'string' && codeSnippet.length > 30000) {
      return res.status(400).json({
        success: false,
        error: 'Payload Too Large',
        message: 'Code snippet is too long (maximum 30,000 characters).'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuration Error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are CodeFix AI, an expert software debugging assistant and developer mentor.
Your job is to analyze programming errors and produce a structured, highly accurate technical diagnosis and fix.

CRITICAL RULES:
1. Return ONLY valid JSON adhering strictly to the required schema. No markdown backticks around the json, no prose outside JSON.
2. If the provided error or code does not have enough information to determine the cause with certainty, state clearly what is missing and set confidence accordingly rather than hallucinating.
3. Language specified is: "${language}".
4. Error Category must be one of: "Syntax", "Logic", "Runtime", "Dependency", "Type", "Memory", "Configuration", "Network", "Database", "Authentication", "Other".
5. Severity must be one of: "Low", "Medium", "High", "Critical".
6. Confidence must be an integer between 0 and 100.
7. If Beginner Mode is requested (${Boolean(beginnerMode)}), provide an especially clear, jargon-free analogy in "beginner_explanation".
8. If Mentor Mode is requested (${Boolean(mentorMode)}), generate Socratic debugging questions and sequential hints in "mentor_guidance" to help the developer think and learn, alongside the solution.
9. Provide working, idiomatic corrected code that directly fixes the problem when code is provided or applicable.
10. Provide practical prevention tips and any relevant terminal/CLI commands (like pip install, npm install, compilation flags, etc.).`;

    const userPrompt = `Language: ${language}
${beginnerMode ? '[User enabled: Beginner Mode / Explain Like I am a Beginner]' : ''}
${mentorMode ? '[User enabled: Debugging Mentor Mode / Socratic hints]' : ''}

ERROR MESSAGE:
\`\`\`
${errorMessage.trim()}
\`\`\`

${codeSnippet && codeSnippet.trim() ? `RELEVANT CODE:
\`\`\`${language}
${codeSnippet.trim()}
\`\`\`` : 'RELEVANT CODE: [None provided by user. Analyze the error message and provide generic snippet/fix.]'}

Output JSON schema:
{
  "error_name": "string (canonical name/type of the error, e.g. 'IndexError: list index out of range')",
  "category": "Syntax | Logic | Runtime | Dependency | Type | Memory | Configuration | Network | Database | Authentication | Other",
  "severity": "Low | Medium | High | Critical",
  "confidence": 95,
  "what_happened": "string (concise summary of the immediate failure)",
  "root_cause": "string (the exact underlying bug or condition that triggered it)",
  "why_it_happened": "string (technical explanation of language semantics or mechanics)",
  "recommended_solution": "string (step-by-step instructions to resolve)",
  "corrected_code": "string (clean, corrected code snippet with helpful comments)",
  "explanation": "string (detailed walkthrough of the fix)",
  "prevention_tips": ["string tip 1", "string tip 2", "string tip 3"],
  "commands": ["command 1 if any, e.g. pip install package"],
  "beginner_explanation": "string (friendly ELI5 analogy without dense technical jargon)",
  "mentor_guidance": {
    "guiding_question": "string (a thought-provoking question to lead them to the answer)",
    "hint_1": "string (gentle nudge)",
    "hint_2": "string (more direct clue)",
    "hint_3": "string (almost revealing the bug)",
    "checkpoint_task": "string (small verification step they can run)"
  }
}`;

    let response;
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
        if (response && response.text) {
          break; // Succeeded
        }
      } catch (err) {
        console.warn(`Model ${modelName} attempt failed, trying fallback if available...`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
        // Small delay before fallback attempt
        await new Promise(res => setTimeout(res, 800));
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All AI models unavailable. Please try again in a few moments.');
    }

    const responseText = response.text || '';
    let parsedResult: DebuggingReport;

    try {
      parsedResult = JSON.parse(responseText.trim());
    } catch {
      // Clean possible markdown code fence wrapper
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Fallbacks if some fields missing
    if (!parsedResult.error_name) parsedResult.error_name = 'Identified Error';
    if (!parsedResult.category) parsedResult.category = 'Runtime';
    if (!parsedResult.severity) parsedResult.severity = 'Medium';
    if (typeof parsedResult.confidence !== 'number') parsedResult.confidence = 85;
    if (!Array.isArray(parsedResult.prevention_tips)) parsedResult.prevention_tips = [];
    if (!Array.isArray(parsedResult.commands)) parsedResult.commands = [];

    const newRecord: AnalysisRecord = {
      id: 'fix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      language,
      errorMessage,
      codeSnippet,
      beginnerMode: Boolean(beginnerMode),
      mentorMode: Boolean(mentorMode),
      result: parsedResult
    };

    historyStore.unshift(newRecord);
    // Keep max 50 items
    if (historyStore.length > 50) {
      historyStore = historyStore.slice(0, 50);
    }
    saveHistory(historyStore);

    return res.json({
      success: true,
      data: newRecord
    });
  } catch (error: unknown) {
    console.error('Error during AI analysis:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown AI service failure';
    
    // Check for rate limit or specific API errors
    const isRateLimit = errMessage.toLowerCase().includes('quota') || errMessage.toLowerCase().includes('rate');
    
    return res.status(500).json({
      success: false,
      error: isRateLimit ? 'Rate Limit Exceeded' : 'Analysis Failed',
      message: isRateLimit
        ? 'Gemini API quota or rate limit reached. Please wait a few seconds and try again.'
        : `AI analysis encountered an error: ${errMessage}`
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeFix AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
