const runBtn = document.getElementById("run-btn");
const output = document.getElementById("output");

runBtn.addEventListener("click", async () => {
  const code = document.getElementById("code-editor").value;

  output.textContent = "⏳ Проверка и компиляция кода...";

  try {
    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: code,
        language: "java",
        versionIndex: "3",      // Java 11
        clientId: "ТВОЙ_REAL_ID",       // <--- твои ключи!
        clientSecret: "ТВОЙ_REAL_SECRET"
      })
    });

    const data = await response.json();
    output.textContent = data.output || "Ответа нет";
  } catch (err) {
    console.error(err);
    output.textContent = "🚨 Ошибка соединения";
  }
});
