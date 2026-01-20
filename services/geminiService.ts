
import { GoogleGenAI } from "@google/genai";
import { UploadedFile, ResultMode } from "../types";

const fileToPart = (file: UploadedFile) => {
  return {
    inlineData: {
      data: file.data.split(',')[1],
      mimeType: file.type
    }
  };
};

export async function* generateContentStream(
  filesA: UploadedFile[],
  filesB: UploadedFile[],
  mode: ResultMode,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key not detected. Ensure 'process.env.API_KEY' is configured in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);

  let systemInstruction = `CRITICAL FORMATTING RULES:
1. NEVER use hashtags (#) for formatting.
2. Use hierarchical numbering for subheadings (e.g., 1.0, 1.1, 2.0). 
3. Start major sections with 'TOPIC: [Topic Name]' to identify high-level themes.
4. Use double asterisks (**text**) to BOLD all of the following: 
   - Important Names and Titles
   - Dates and Specific Years
   - Key Answers and Specific Figures
   - Technical Terms and Core Definitions
   - Crucial Conclusions
5. Aim for HIGH visual density of bold text to enable rapid "speed-reading".`;

  if (mode === ResultMode.SOLVE) {
    systemInstruction += `\nROLE: Intelligent Exam Solver. Provide deep academic reasoning. BOLD every final answer and the names of theories/scholars mentioned.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += `\nROLE: FlashCard Generator. Provide direct Q&A pairs. BOLD the entire 'Answer' part of every card for maximum visibility.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += `\nROLE: Academic Simplifier. Use numbered lists. BOLD all key takeaways and definitions.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Perform a deep ${mode} analysis. Adhere to all BOLDING and TOPIC rules. Identify every key date and name.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve with academic precision. Ensure every single key term, date, and name is BOLDED." }
    ];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: [{ role: 'user', parts: contentsParts }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    }, { signal });

    for await (const chunk of responseStream) {
      if (signal?.aborted) break;
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) return;
    throw new Error(error.message || "Failed to generate content.");
  }
}
