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
  // Using gemini-3-pro-preview for complex academic tasks as per instructions
  const model = 'gemini-3-pro-preview';

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);

  let systemInstruction = "";
  let prompt = "";

  if (mode === ResultMode.SOLVE) {
    systemInstruction = `You are an Intelligent Exam Solver and Academic Tutor. Solve past exam questions strictly based on the provided Course Material. Differentiate between unique questions and list their frequency and years. Use **Bold** for question texts.`;
    prompt = `Analyze the attached PAST QUESTIONS and COURSE MATERIAL. Generate a comprehensive solution document. Identify unique questions and provide detailed answers based on the material. Ensure Question texts are bolded using ** markers.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction = `You are a FlashCard Doc Generator. Extract critical facts, formulas, and definitions. Use **Q:** and **A:** markers.`;
    prompt = `Distill the provided COURSE MATERIAL into a high-yield FlashCard Doc. Focus on essential concepts only.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction = `You are an Expert Academic Simplifier. Priority: Explain in the SIMPLEST language possible. Breakdown topic by topic with Definition, Explanation, Features, etc. Use **Bold** for headers.`;
    prompt = `Analyze the attached document. Break it down topic by topic. For every topic, provide a Definition, Simple Explanation, Features, Types, Advantages, and Disadvantages.`;
  }

  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL FOR ${mode} ---` },
      ...partsA,
      { text: prompt }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: prompt }
    ];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: [
        {
          role: 'user',
          parts: contentsParts
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
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