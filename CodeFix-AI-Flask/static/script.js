// CodeFix AI - Frontend Client Logic

// 1. Hackathon Quick Demo Presets
const DEMO_PRESETS = {
  python: {
    language: 'Python',
    error: 'IndexError: list index out of range\n  File "main.py", line 4, in <module>\n    print(items[i])',
    code: 'items = ["alpha", "beta", "gamma"]\n# Deliberate off-by-one error\nfor i in range(len(items) + 1):\n    print(f"Item {i}: {items[i]}")',
    beginner: true,
    mentor: true
  },
  javascript: {
    language: 'JavaScript',
    error: 'TypeError: Cannot read properties of undefined (reading \'name\')\n    at getUserBadge (app.js:14:26)',
    code: 'function getUserBadge(user) {\n    // Bug: user object might be null or undefined\n    return `Badge: ${user.name.toUpperCase()}`;\n}\n\nconsole.log(getUserBadge(null));',
    beginner: true,
    mentor: true
  },
  java: {
    language: 'Java',
    error: 'Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "text" is null\n\tat StringProcessor.getLength(StringProcessor.java:8)',
    code: 'public class StringProcessor {\n    public static int getLength(String text) {\n        return text.length();\n    }\n    public static void main(String[] args) {\n        getLength(null);\n    }\n}',
    beginner: true,
    mentor: true
  },
  cpp: {
    language: 'C++',
    error: 'Segmentation fault (core dumped)\n./a.out',
    code: '#include <iostream>\n\nint main() {\n    int* ptr = nullptr;\n    // Dereferencing null pointer\n    *ptr = 42;\n    std::cout << *ptr << std::endl;\n    return 0;\n}',
    beginner: true,
    mentor: true
  }
};

function loadPreset(presetKey) {
  const preset = DEMO_PRESETS[presetKey];
  if (!preset) return;

  const langSelect = document.getElementById('language');
  const errorInput = document.getElementById('error_message');
  const codeInput = document.getElementById('code_snippet');
  const beginnerToggle = document.getElementById('beginner_mode');
  const mentorToggle = document.getElementById('mentor_mode');

  if (langSelect) langSelect.value = preset.language;
  if (errorInput) errorInput.value = preset.error;
  if (codeInput) codeInput.value = preset.code;
  if (beginnerToggle) beginnerToggle.checked = preset.beginner;
  if (mentorToggle) mentorToggle.checked = preset.mentor;
}

// 2. Copy To Clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const text = element.innerText || element.textContent;
  copyText(text);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard! 📋');
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#238636';
  toast.style.color = '#ffffff';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '6px';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
  toast.style.zIndex = '9999';
  toast.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 3. Form Submission Spinner
document.addEventListener('DOMContentLoaded', () => {
  const debugForm = document.getElementById('debugForm');
  if (debugForm) {
    debugForm.addEventListener('submit', () => {
      const submitBtn = document.getElementById('submitBtn');
      const spinner = document.getElementById('btnSpinner');
      if (submitBtn && spinner) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.8';
        spinner.style.display = 'inline-block';
      }
    });
  }
});

// 4. Live Search Filter in History
function filterHistoryTable() {
  const input = document.getElementById('historySearch');
  if (!input) return;
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll('#historyTable tbody tr');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}
