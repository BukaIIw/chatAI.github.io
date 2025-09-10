let editor;

// Инициализация Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: 'class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
    language: 'java',
    theme: 'vs-dark',
    automaticLayout: true
  });
});

// ====== Проверка кода ======
function checkCode() {
  const code = editor.getValue();
  const lines = code.split("\n");
  let errors = [];
  let openBraces = 0, openParentheses = 0, quoteToggle = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const num = i + 1;

    // println без ; в конце
    if (trimmed.includes(".out.println") && !trimmed.endsWith(";")) {
      errors.push({ line: num, message: "'println' должна заканчиваться на ;" });
    }

    // System опечатки
    if (/\w+\.out\.println/.test(trimmed) && !/^System/.test(trimmed)) {
      errors.push({ line: num, message: "Ошибка в имени 'System'" });
    }

    // Скобки
    if (trimmed.includes("{")) openBraces++;
    if (trimmed.includes("}")) openBraces--;
    openParentheses += (trimmed.match(/KATEX_INLINE_OPEN/g) || []).length;
    openParentheses -= (trimmed.match(/KATEX_INLINE_CLOSE/g) || []).length;

    // Кавычки
    for (const c of trimmed) {
      if (c === '"') quoteToggle = !quoteToggle;
    }

    // Подозрительные строки без ;
    if (
      trimmed.length > 0 &&
      !/[;{}]$/.test(trimmed) &&
      !/^(class|import|public|if|for|while|else|switch|try|catch|})/.test(trimmed)
    ) {
      errors.push({ line: num, message: "Возможно пропущена ';'" });
    }

    // Лишние символы после }
    if (/}\s*\w+/.test(trimmed)) {
      errors.push({ line: num, message: "Лишние символы после закрывающей скобки }" });
    }
  });

  // Глобальные проверки
  if (!/class\s+\w+/.test(code)) errors.push({ line: 1, message: "Нет объявления класса" });
  if (!/void\s+main\s*KATEX_INLINE_OPEN/.test(code)) errors.push({ line: 1, message: "Нет метода main()" });
  if (openBraces !== 0) errors.push({ line: 1, message: "Несбалансированные фигурные скобки { }" });
  if (openParentheses !== 0) errors.push({ line: 1, message: "Несбалансированные круглые скобки ( )" });
  if (quoteToggle) errors.push({ line: 1, message: "Незакрытые кавычки \" \"" });

  // Выводим в консоль
  const consoleBox = document.getElementById("console");
  if (errors.length === 0) {
    consoleBox.textContent = "[Compilation successful]\n✅ Ошибок не найдено!";
    consoleBox.style.color = "#4caf50";
  } else {
    consoleBox.textContent = "[Compilation failed]\n" + errors.map(e => "❌ Строка " + e.line + ": " + e.message).join("\n");
    consoleBox.style.color = "#ff4444";
  }

  // Подсветка ошибок в редакторе (красные «огоньки» слева, как в IntelliJ)
  monaco.editor.setModelMarkers(editor.getModel(), "owner", errors.map(err => ({
    startLineNumber: err.line,
    startColumn: 1,
    endLineNumber: err.line,
    endColumn: 200,
    message: err.message,
    severity: monaco.MarkerSeverity.Error
  })));
}

// ====== Форматирование кода ======
function formatCode() {
  const code = editor.getValue().trim();
  editor.setValue(code);
}
