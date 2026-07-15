import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 環境変数が設定されていません。AI StudioのSettingsまたはSecretsからAPIキーを設定してください。");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, meds, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAI();

    const medsContext = meds && meds.length > 0 
      ? JSON.stringify(meds.map((m: any) => ({
          name: m.name,
          dosageQty: m.dosageQty,
          dosageUnit: m.dosageUnit,
          stock: m.stock,
          timing: m.timing,
          memo: m.memo || "特になし"
        })), null, 2)
      : "登録されたお薬はありません。";

    const historyContext = history 
      ? JSON.stringify(history, null, 2)
      : "履歴はありません。";

    const systemInstruction = `あなたは親切でプロフェッショナルな「AIお薬アシスタント（薬剤師キャラ）」です。
患者（ユーザー）からの質問に対して、登録されているお薬情報と服薬履歴をふまえて、優しく丁寧、かつ適切に日本語でアドバイスしてください。

【現在の登録お薬（残量情報を含む）】
${medsContext}

【直近の服薬履歴（服用したかどうかのログ）】
${historyContext}

【指示事項】
1. 残量が少なくなっているお薬（例えば残り5回分以下など、1回の服用量(dosageQty) × 5 以下のストック）がある場合は、優しく注意を促し、早めの受診や薬局での処方箋手続きを勧めてください。
2. 飲み合わせ、副作用、飲み忘れの対処方法、お薬に関する疑問などについて、医学・薬学的知識に基づいて分かりやすく解説してください。
3. 文末には必ず「※このアドバイスは一般的な情報提供であり、医師や薬剤師の診断の代わりにはなりません。重要な判断や体調不良の際は、必ず主治医や薬剤師にご相談ください。」という免責事項を優しく含めてください。
4. 返答は丁寧な日本語（「〜です」「〜ます」調）で、読みやすくマークダウン形式（太字など）を適度に使って整理して返してください。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Setup Vite development server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
