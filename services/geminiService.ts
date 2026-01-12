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
  mode: ResultMode
): AsyncGenerator<string, void, unknown> {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);

  // Core formatting: No hashtags. Double asterisks for bolding. Hierarchical numbers.
  let systemInstruction = "CRITICAL FORMATTING RULE: NEVER use hashtags (#). For headers, use hierarchical numbering (1.0, 1.1). Use double asterisks (e.g., **important text**) to BOLD key points, names, titles, years, specific events, and critical terms. Visual emphasis is mandatory for all key information.";

  if (mode === ResultMode.SOLVE) {
    systemInstruction += ` You are an Intelligent Exam Solver. Solve questions based on the provided material with maximum detail and deep academic reasoning. BOLD all key terms, years, names, and specific answers.`;
  } else if (mode === ResultMode.REVIEW) {
    // FlashDoc: Exhaustive coverage, small bits, straight to point.
    systemInstruction += ` You are a FlashCard Doc Generator (FlashDoc). Your goal is to provide EXHAUSTIVE coverage of the source material. You MUST cover EVERY SINGLE topic, sub-topic, definition, and concept found in the document—no matter how small. Provide an extremely high volume of content consisting of many small, direct Questions and Answers. HOWEVER, keep each entry extremely CONCISE and STRAIGHT TO THE POINT. Focus: Rapid recall and memorization. BOLD every key term, name, date, and the direct answer part using **. If the document is long, produce a very long list of entries to ensure 100% material coverage. Do not skip details; turn every detail into a small flash-point.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += ` You are an Expert Academic Simplifier. Breakdown every topic in extreme detail. For every topic, provide: 1. Deep Definition, 2. Contextual Explanation (be verbose), 3. Features, 4. Types, 5. Advantages/Disadvantages. BOLD key concepts, names, and events throughout.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    const modePrompt = mode === ResultMode.SUMMARY 
      ? "Provide an extremely long and detailed summary." 
      : "Provide an EXHAUSTIVE FlashDoc: Generate hundreds of small, straight-to-the-point Q&A pairs if necessary to cover every single sentence and concept of the text. BOLD all key info. Maximize volume and coverage.";
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Analyze this material and generate a ${mode} mode response. ${modePrompt} NO hashtags. Use ** for bolding.` }
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
        temperature: 0.1, // Lower temperature for more consistent, factual extraction
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}