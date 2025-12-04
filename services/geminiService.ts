import { GoogleGenAI } from "@google/genai";
import { UploadedFile, ResultMode } from "../types";

// Helper to convert base64 part for Gemini
const fileToPart = (file: UploadedFile) => {
  return {
    inlineData: {
      data: file.data.split(',')[1], // Remove "data:application/pdf;base64," prefix
      mimeType: file.type
    }
  };
};

export const generateExamSolution = async (
  courseFiles: UploadedFile[],
  questionFiles: UploadedFile[],
  mode: ResultMode
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  // Create new instance per request to ensure fresh config if needed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const modelName = 'gemini-2.5-flash'; // Good balance of speed and context window for docs

  const courseParts = courseFiles.map(fileToPart);
  const questionParts = questionFiles.map(fileToPart);

  let systemInstruction = "";
  let prompt = "";

  if (mode === ResultMode.SOLVE) {
    systemInstruction = `You are an expert academic tutor and exam solver. 
    Your goal is to solve past exam questions strictly based on the provided course material.
    
    RULES:
    1. STRICTLY use the provided Course Material to answer.
    2. Identify all questions from the 'Past Questions' files.
    3. If a question appears multiple times, solve it only ONCE (deduplicate).
    4. Format the output clearly. Use Bold for Questions.
    5. Provide detailed, well-explained answers.
    6. If the answer is not in the material, state that it cannot be found in the provided notes.
    `;

    prompt = `
    Using the attached COURSE MATERIAL, please solve the questions found in the attached PAST QUESTIONS files.
    
    Output Format Goal:
    
    1. Question Text? (Year/Marks if available)
    [Detailed Answer Paragraphs...]

    2. Next Question?
    [Detailed Answer Paragraphs...]
    `;

  } else {
    // REVIEW MODE (Flashcard/Q&A style)
    systemInstruction = `You are a study assistant creating a Quick Review sheet.
    
    RULES:
    1. Extract questions from the 'Past Questions' files.
    2. Answer them using the 'Course Material'.
    3. Keep answers concise, punchy, and easy to memorize.
    4. Deduplicate similar questions.
    5. STRICTLY follow the "Q: ... A: ..." format.
    `;

    prompt = `
    Create a Quick Review Q&A list based on the attached files.
    
    Output Format strictly like this:
    
    Q: [Question text]
    A: [Concise answer]
    
    Q: [Question text]
    A: [Concise answer]
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: "--- COURSE MATERIAL FILES ---" },
            ...courseParts,
            { text: "--- PAST QUESTION FILES ---" },
            ...questionParts,
            { text: prompt }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more factual/consistent answers
      }
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
};
