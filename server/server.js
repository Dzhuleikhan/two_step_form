import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname)));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Разрешаем использование json в теле запросов
app.use(express.json());

// Маршрут для проверки промокода
app.post("/check-promo", (req, res) => {
  const promoCode = req.body.code; // Получаем код из запроса

  // Читаем файл с промокодами
  fs.readFile(
    path.join(__dirname, "promo_codes.json"),
    "utf-8",
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Ошибка при чтении файла" });
      }

      const promoCodes = JSON.parse(data);

      const isValid = promoCodes.some(
        (promo) => promo.code.toLowerCase() === promoCode.toLowerCase(),
      );

      if (isValid) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false });
      }
    },
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
