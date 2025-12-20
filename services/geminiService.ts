import { GoogleGenAI } from "@google/genai";
import { Topic, CATEGORY_NAMES } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTopicVeracity = async (topic: Topic): Promise<string> => {
  try {
    const categoryName = CATEGORY_NAMES[topic.category];
    const prompt = `
      你是一個「TruthCircle」社群的客觀事實查核員。
      請根據現有的知識，分析以下陳述/主題的真實性。
      請務必使用 **繁體中文 (Traditional Chinese)** 回答。
      
      主題: "${topic.title}"
      背景/描述: "${topic.description}"
      分類: "${categoryName}"

      請提供一個簡潔的分析（最多 150 字）。
      請以明確的結論開頭（例如：「真實」、「錯誤」、「誤導」、「有爭議/複雜」），然後說明理由。
      如果適用，請引用具體的科學原理、歷史記錄或經濟理論。
      如果事實清楚，請不要模稜兩可。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Low temperature for more factual responses
      }
    });

    return response.text || "目前無法產生分析。";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "錯誤：無法取得 AI 分析。請稍後再試。";
  }
};