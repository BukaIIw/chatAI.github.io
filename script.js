let editor;

// === Инициализация Monaco ===
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: 'class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    language: 'java',
    theme: 'vs-dark',
    automaticLayout: true
  });

  // Автодополнения (sout, psvm)
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: () => {
      const suggestions = [
        {
          label: 'psvm',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public static void main(String[] args) {\n    $0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Точка входа'
        },
        {
          label: 'sout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'System.out.println($0);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Вывести в консоль'
        }
      ];
      return { suggestions };
    }
  });
});

// === Проверка кода (псевдокомпилятор) ===
function checkCode() {
  const code = editor.getValue();
  const lines = code.split("\n");
  let errors = [];
  let fixes = [];

  let openBraces = 0, openParentheses = 0, quoteToggle = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const num = i + 1;

    // println без ;
    if (trimmed.includes("System.out.print") && !trimmed.endsWith(";")) {
      errors.push({ line: num, message: "println без ;" });
      fixes.push({ line: num, fix: () => fixSemicolon(num) });
    }

    // System с ошибкой (e.g. Syst1245em)
    if (/Syst\w*\.out/.test(trimmed) && !trimmed.includes("System.out")) {
      errors.push({ line: num, message: "Опечатка в 'System'" });
      fixes.push({ line: num, fix: () => fixSystemWord(num) });
    }

    // Баланс скобок
    if (trimmed.includes("{")) openBraces++;
    if (trimmed.includes("}")) openBraces--;
    openParentheses += (trimmed.match(/KATEX_INLINE_OPEN/g) || []).length;
    openParentheses -= (trimmed.match(/KATEX_INLINE_CLOSE/g) || []).length;

    // Кавычки
    for (const c of trimmed) {
      if (c === '"') quoteToggle = !quoteToggle;
    }

    // Лишние символы после }
    if (/}\s*\w+/.test(trimmed)) {
      errors.push({ line: num, message: "Лишние символы после }" });
    }

    // Подозрительные строки без ;
    if (
      trimmed.length > 0 &&
      !/[;{}]$/.test(trimmed) &&
      !/^(class|import|public|if|for|while|else|switch|try|catch|}|package)/.test(trimmed)
    ) {
      errors.push({ line: num, message: "Возможно пропущена ';'" });
    }
  });

  // Глобальные проверки
  if (!/class\s+\w+/.test(code)) {
    errors.push({ line: 1, message: "Нет объявления класса" });
  }

  // Проверка корректного метода main
  if (!/public\s+static\s+void\s+main\s*KATEX_INLINE_OPEN\s*String(```math
```|\s+\.\.\.)\s+\w+\s*KATEX_INLINE_CLOSE/.test(code)) {
    errors.push({ line: 1, message: "Нет корректного метода main(String[] args)" });
    fixes.push({ line: 1, fix: () => insertMainStub() });
  }

  if (openBraces !== 0) errors.push({ line: 1, message: "Несбалансированные { }" });
  if (openParentheses !== 0) errors.push({ line: 1, message: "Несбалансированные ( )" });
  if (quoteToggle) errors.push({ line: 1, message: "Незакрытые кавычки \" \"" });

  showErrors(errors);

  // сохраним исправления
  window._fixes = fixes;
}

// === Автофикс всех ошибок ===
function applyAutoFixes() {
  if (!window._fixes) return;
  window._fixes.forEach(f => f.fix());
  checkCode();
}

// === Автоисправления ===
function fixSemicolon(lineNum) {
  const code = editor.getValue().split("\n");
  code[lineNum - 1] = code[lineNum - 1] + ";";
  editor.setValue(code.join("\n"));
}
function fixSystemWord(lineNum) {
  const code = editor.getValue().split("\n");
  code[lineNum - 1] = code[lineNum - 1].replace(/Syst\w*\.out/, "System.out");
  editor.setValue(code.join("\n"));
}
function insertMainStub() {
  const code = editor.getValue().split("\n");
  code.splice(1, 0, "    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }");
  editor.setValue(code.join("\n"));
}

// === Вывод ошибок + подсветка маркерами ===
function showErrors(errors) {
  const consoleBox = document.getElementById("console");
  if (errors.length === 0) {
    consoleBox.textContent = "[Compilation successful]\n✅ Ошибок не найдено!";
    consoleBox.style.color = "#4caf50";
  } else {
    consoleBox.textContent = "[Compilation failed]\n" + errors.map(e => "❌ Строка " + e.line + ": " + e.message).join("\n");
    consoleBox.style.color = "#ff4444";
  }

  monaco.editor.setModelMarkers(editor.getModel(), "owner", errors.map(err => ({
    startLineNumber: err.line,
    startColumn: 1,
    endLineNumber: err.line,
    endColumn: 200,
    message: err.message,
    severity: monaco.MarkerSeverity.Error
  })));
}

// === Форматирование ===
function formatCode() {
  const code = editor.getValue().trim();
  editor.setValue(code);
}
