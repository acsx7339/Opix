import { GoogleGenAI } from "@google/genai";
import { Topic, CATEGORY_NAMES } from "../types";

// Lazy initialization to prevent app crash if API_KEY is missing during build/runtime
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    // Safe check for API Key
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.warn("Gemini API Key is missing!");
      return null;
    }
    try {
      aiClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error("Failed to initialize Gemini Client:", e);
      return null;
    }
  }
  return aiClient;
};

export const analyzeTopicVeracity = async (topic: Topic): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return "系統提示：目前無法連接 AI 服務 (API Key 未設定)。請聯繫管理員。";
    }

    const categoryName = CATEGORY_NAMES[topic.category];

    // Aggregate comments for AI analysis
    const commentSummary = topic.comments.length > 0
      ? topic.comments.map(c => `- [${c.stance === 'support' ? '支持' : c.stance === 'oppose' ? '反對' : '中立'} / ${c.type === 'supplement' ? '補充' : c.type === 'refutation' ? '反駁' : '一般'}] ${c.authorName}: ${c.content}`).join('\n')
      : "目前尚無使用者評論。";

    const prompt = `
      你是一個「Opix」社群的智慧分析師。
      請根據主題本身以及使用者的討論內容，進行綜合分析與歸納。
      請務必使用 **繁體中文 (Traditional Chinese)** 回答。
      
      【主題資訊】
      主題: "${topic.title}"
      背景: "${topic.description}"
      分類: "${categoryName}"

      【使用者討論摘要】
      ${commentSummary}

      【任務要求】
      1. **真實性驗證**：簡要分析主題本身的真實性（如：真實、錯誤、有爭議）。
      2. **社群觀點歸納**：總結使用者們的主要觀點。請指出支持方與反對方的主要論點是什麼？有哪些補充的重要事實？
      3. **結論**：綜合上述資訊，給出一個客觀的總結。

      請保持回答簡潔（約 200-300 字），結構清晰。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text || "目前無法產生分析。";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "錯誤：無法取得 AI 分析。請稍後再試。";
  }
};