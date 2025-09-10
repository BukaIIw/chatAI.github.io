let editor;

// === Инициализация Monaco Editor ===
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: 'class Main {\n    public static void main(String[] args) {\n        System.out.printn("Привет!")\n    }\n}',
    language: 'java',
    theme: 'vs-dark',
    automaticLayout: true
  });

  // === AUTOCOMPLETION (как IntelliJ подсказки) ===
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: () => {
      const suggestions = [
        {
          label: 'psvm',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public static void main(String[] args) {\n    $0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Точка входа в Java программу'
        },
        {
          label: 'sout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'System.out.println($0);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Вывод в консоль'
        }
      ];
      return { suggestions: suggestions };
    }
  });
});

// === Проверка кода (псевдо-компилятор) ===
function checkCode() {
  const code = editor.getValue();
  const lines = code.split("\n");
  let errors = [];
  let fixes = [];

  lines.forEach((line, i) => {
    const num = i + 1;

    // Ошибка: println без ;
    if (line.includes("System.out.print") && !line.trim().endsWith(";")) {
      errors.push({ line: num, message: "println без ;" });
      fixes.push({ line: num, fix: () => fixSemicolon(num) });
    }

    // Ошибка: "System" написано с ошибкой
    if (/Syst\w*\.out/.test(line) && !line.includes("System.out")) {
      errors.push({ line: num, message: "Опечатка в 'System'" });
      fixes.push({ line: num, fix: () => fixSystemWord(num) });
    }

    // Отсутствует main()
    if (/class\s+\w+/.test(code) && !/public\s+static\s+void\s+main\s*KATEX_INLINE_OPEN/.test(code)) {
      errors.push({ line: 1, message: "Нет метода main" });
      fixes.push({ line: 1, fix: () => insertMainStub() });
    }
  });

  showErrors(errors);

  // Сохраняем исправления на потом
  window._fixes = fixes;
}

// === Автоправки ===
function applyAutoFixes() {
  if (!window._fixes) return;
  window._fixes.forEach(f => f.fix());
  checkCode();
}

// === Локальные функции автоправки ===
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

// === Вывод ошибок в консоль + маркеры в редакторе ===
function showErrors(errors) {
  const consoleBox = document.getElementById("console");
  if (errors.length === 0) {
    consoleBox.textContent = "[Compilation successful] ✅ Ошибок нет";
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
