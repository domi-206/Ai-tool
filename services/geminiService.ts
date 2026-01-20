
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

  let systemInstruction = "CRITICAL FORMATTING RULE: NEVER use hashtags (#). For headers, use hierarchical numbering (1.0, 1.1). Use double asterisks (e.g., **important text**) to BOLD key points, names, titles, years, specific events, and critical terms. Visual emphasis is mandatory.";

  if (mode === ResultMode.SOLVE) {
    systemInstruction += ` You are an Intelligent Exam Solver. Solve questions based on the provided material with maximum detail and deep academic reasoning. BOLD all key terms, years, names, and specific answers.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += ` You are a FlashCard Doc Generator (FlashDoc). Provide EXHAUSTIVE coverage. Generate many small, direct Q&A pairs. BOLD every key term and direct answer using **.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += ` You are an Expert Academic Simplifier. Provide Deep Definition, Contextual Explanation, Features, and Types. BOLD key concepts throughout.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Analyze this material and generate a ${mode} mode response. NO hashtags. Use ** for bolding.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve all questions in depth. BOLD key years, names, and concepts. NO hashtags." }
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
