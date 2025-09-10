// server.js
import express from "express";
import fetch from "node-fetch";   // в Node 18+ можно удалить и использовать глобальный fetch
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

// Подключаем JSON body
app.use(bodyParser.json());

// Разрешаем CORS (чтобы фронт на http://localhost:5500 или 5173 имел доступ)
app.use(cors());

// --- ПРОКСИ ЭНДПОИНТ ---
// Фронт будет дергать -> http://localhost:3000/api/chat
app.post("/api/chat", async (req, res) => {
  try {
    // Весь контент (например prompt) из запроса фронта
    const payload = req.body;

    // ⚠️ Здесь укажи настоящий endpoint LM Arena (узнай в их дев-консоли/сети).
    // В Chrome DevTools -> Network, посмотри, куда уходит запрос, когда ты чатишь в LM Arena.
    const response = await fetch("https://lmarena.ai/backend/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ключевая часть: твои куки из браузера.
        // Их берешь вручную: DevTools -> Application -> Cookies -> скопировать.
        // Тут вставляешь строкой:
        "Cookie": "sessionid=ТВОЙ_SESSION_ID; anothercookie=VALUE"
      },
      body: JSON.stringify(payload)
    });

    // Ответ с сервера LM Arena
    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Ошибка при запросе к LM Arena:", err);
    res.status(500).json({ error: "Прокси не смог достучаться до LM Arena" });
  }
});

// старт
app.listen(PORT, () => {
  console.log(`🚀 Proxy запущен на http://localhost:${PORT}`);
});
