
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
  const model = mode === ResultMode.SOLVE ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);

  let systemInstruction = `CRITICAL ACADEMIC INSTRUCTIONS:
1. FULL DOCUMENT ANALYSIS: Comprehensively analyze all text, explanations, diagrams, drawings, formulas, equations, and calculations.
2. VISUAL DATA INTERPRETATION (DEEP ANALYSIS): If the document contains visuals (diagrams, charts, graphs, or drawings):
   - Infer and explain exactly what they represent in clear, technical language.
   - Provide a step-by-step explanation of how to interpret the visual data.
   - For mathematical or scientific charts, explain axes, units, symbols, and trends shown.
3. CALCULATIONS & FORMULAS: If calculations or formulas are present, explain:
   - What the calculation is intended to solve.
   - How it works (provide a step-by-step verbal walkthrough of the logic).
   - The physical or mathematical meaning of the final result.
4. BOLD FORMATTING RULES (STRICT ADHERENCE):
   - Bold all **Topic Headings** and **Section Titles**.
   - Bold **Key Terms**, **Important Phrases**, and **Critical Insights**.
   - DEFINITION FORMAT: Bold the term BEFORE a colon (:) or semicolon (;). DO NOT bold the explanation that follows.
     Example: "**Newton's First Law**: An object at rest stays at rest..."
5. CLARITY & EMPHASIS: Use bold only for clarity. Highlight assumptions and conclusions. NO italics or decorative styling.
6. STRUCTURE: Use hierarchical numbering (1.0, 1.1). Write in full, flowing academic paragraphs. Complete sentences line-by-line. Let text wrap naturally unless starting a new sub-topic.
7. NO ASTERISKS: Do not use asterisks (*) for lists. Use numbers (1., 2.). Only use double asterisks (**) for the required bolding.`;

  if (mode === ResultMode.SOLVE) {
    systemInstruction += `\nROLE: Senior Academic Engine. Solve problems with full transparency. Bold the specific subject before the colon.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += `\nROLE: Expert Study Pack Creator. Provide exhaustive deconstruction of concepts. Bold core terms before colons.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += `\nROLE: Master Academic Summarizer. Do not oversimplify. Provide detailed step-by-step interpretations of all visuals and math. Bold terms strictly before colons.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Synthesize an EXHAUSTIVE ACADEMIC SUMMARY. If there are any diagrams, charts, or visual data, provide a step-by-step explanation of how to interpret them. Explain all formulas step-by-step in words. Bold terms strictly before colons. No italics.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve with maximum academic rigor. Provide a full verbal interpretation of all visual or mathematical data in the questions. Bold concepts before colons." }
    ];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: { parts: contentsParts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    for await (const chunk of responseStream) {
      if (signal?.aborted) break;
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) return;
    throw new Error(error.message || "Synthesis failed.");
  }
}
