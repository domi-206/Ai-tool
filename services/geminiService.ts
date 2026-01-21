
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
1. ANALYSIS: Fully analyze all text, explanations, diagrams, drawings, formulas, and calculations.
2. VISUALS: If diagrams/drawings exist, infer and describe their purpose and components in detail.
3. CALCULATIONS: For any math/formulas, explain:
   - The purpose of the calculation.
   - Step-by-step logic (expressed in words).
   - Significance of the final result.
4. BOLDING RULES (STRICT ADHERENCE):
   - Bold all **Topic Headings** and **Section Titles**.
   - Bold **Key Terms**, **Critical Insights**, and **Assumptions**.
   - DEFINITION FORMAT: Bold the term BEFORE a colon (:) or semicolon (;). DO NOT bold the explanation following it. 
     Example: "**Photosynthesis**: The process by which plants..."
5. FORMATTING: Use bold text ONLY for clarity/emphasis. NO italics. NO decorative formatting.
6. STRUCTURE: Use hierarchical numbering (1.0, 1.1). Write in full, flowing academic paragraphs. Avoid bullet points unless listing specific sequential steps.
7. LINE COMPLETION: Complete sentences line-by-line. Do not force manual line breaks; allow text to wrap naturally unless starting a new major sub-topic.
8. NO ASTERISKS: The only allowed asterisks are double markers (**) for bolding. These will be stripped by the UI.`;

  if (mode === ResultMode.SOLVE) {
    systemInstruction += `\nROLE: Academic Engine. Solve logically. Bold the problem subject before the colon.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += `\nROLE: Study Pack Creator. Deconstruct concepts. Bold core terms before colons.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += `\nROLE: Exhaustive Academic Summarizer. Provide high-density detail. Bold terms before colons.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Synthesize an EXHAUSTIVE NARRATIVE. Analyze all visual and mathematical data. Bold terms before colons. No italics.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve with academic rigor. Include full verbal explanations of calculations. Bold concepts before colons." }
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
