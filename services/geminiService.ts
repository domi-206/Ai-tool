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

export async function* generateContentStream(
  filesA: UploadedFile[],
  filesB: UploadedFile[], // Optional for Summary mode
  mode: ResultMode
): AsyncGenerator<string, void, unknown> {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  // Create new instance per request
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Using flash model for speed
  const modelName = 'gemini-2.5-flash'; 

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);
  
  const allParts = [...partsA, ...partsB];

  let systemInstruction = "";
  let prompt = "";

  if (mode === ResultMode.SOLVE) {
    systemInstruction = `You are an Intelligent Exam Solver and Academic Tutor.
    Your goal is to solve past exam questions strictly based on the provided Course Material.
    
    CRITICAL INSTRUCTIONS:
    1. SOURCE MATERIAL: Use ONLY the provided 'Course Material' to derive answers.
    2. QUESTION EXTRACTION: Identify questions from the 'Past Questions' files.
    3. DEDUPLICATION: If a question appears multiple times, list it ONLY ONCE.
    4. FORMATTING REQUIREMENTS (Strictly follow this structure with BOLDING):
    
    UNIT [Number/Name if identifiable]
    
    **[Number]. [Question Text]?** ([Frequency/Marks])
    [Detailed Answer: Provide a comprehensive explanation found in the notes.]
    
    **[Number]. [Next Question]?**
    [Detailed Answer...]
    `;

    prompt = `Analyze the attached PAST QUESTIONS and COURSE MATERIAL. Generate a comprehensive solution document. Identify unique questions and provide detailed answers based on the material. Ensure Question texts are bolded using ** markers.`;

  } else if (mode === ResultMode.REVIEW) {
    // REVIEW MODE (Q&A style)
    systemInstruction = `You are a Quick Review Study Assistant.
    Your goal is to create a rapid-fire Q&A study sheet.
    
    CRITICAL INSTRUCTIONS:
    1. Extract questions from 'Past Questions'.
    2. Answer using 'Course Material'.
    3. EXTREMELY IMPORTANT: Answers must be SHORT, CONCISE, and EASY TO UNDERSTAND.
    4. Deduplicate questions.
    5. FORMAT: Strictly use the "**Q:** ... **A:** ..." format.
    
    FORMATTING:
    **Q:** [Question?]
    **A:** [Short, punchy answer.]
    `;

    prompt = `Create a Quick Review Q&A list. Keep answers very short and simple. Use **Q:** and **A:** markers for bolding.`;
  } else if (mode === ResultMode.SUMMARY) {
    // SUMMARY MODE
    systemInstruction = `You are an Expert Academic Simplifier.
    Your goal is to provide a comprehensive summary of the uploaded document, analyzing it Topic by Topic, but using VERY SIMPLE, PLAIN, and EASY-TO-UNDERSTAND language.
    
    CRITICAL INSTRUCTIONS:
    1. **Simplicity**: Write as if explaining to a beginner or high school student. Avoid complex jargon or explain it immediately in simple terms.
    2. **Structure**: Break down the document into logical **Topics/Sections**.
    3. **Content**: For EACH major topic or concept identified, you MUST provide the following details where applicable and BOLD the labels using **:
       - **Definition**: A simple, easy-to-grasp definition of the concept.
       - **Key Features**: Key attributes described simply.
       - **Types/Classifications**: Different types with simple descriptions.
       - **Advantages**: Benefits or strengths (simplified).
       - **Disadvantages**: Limitations or weaknesses (simplified).
       - **Simple Explanation**: A clear, conversational paragraph explaining what this concept means in plain English.
    
    FORMATTING REQUIREMENTS:
    
    **[Document Title]**
    
    **Executive Overview**
    [A simple high-level summary of what this document is about.]
    
    ---
    
    **TOPIC: [Topic Name]**
    
    *   **Definition**: [Simple definition]
    *   **Key Features**:
        *   [Feature 1]
        *   [Feature 2]
    *   **Types**:
        *   **[Type Name]**: [Simple Description]
    *   **Advantages**:
        *   [Advantage 1]
    *   **Disadvantages**:
        *   [Disadvantage 1]
    *   **Simple Explanation**:
        [A paragraph explaining the concept simply.]
    
    ---
    
    (Repeat for all major topics)
    
    **Conclusion**
    [Final simple summary]
    `;
    
    prompt = `Perform a topic-by-topic analysis of the attached document. Include definitions, types, features, advantages, and disadvantages. Use **bold markers** for headers. CRITICAL: Make all text, definitions, and explanations EXTREMELY EASY TO READ and UNDERSTAND.`;
  }

  // Construct content parts based on mode
  let contentsParts: any[] = [];
  
  if (mode === ResultMode.SUMMARY) {
    // For summary, we only expect 'filesA' (the document to summarize)
    contentsParts = [
      { text: "--- DOCUMENT TO SUMMARIZE ---" },
      ...partsA,
      { text: prompt }
    ];
  } else {
    // For Solve/Review, we expect both course material (A) and past questions (B)
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
      model: modelName,
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
      if (text) {
        yield text;
      }
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}