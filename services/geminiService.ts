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
    2. QUESTION EXTRACTION: Identify questions from the 'Past Questions' files. Look for dates or years in filenames or document headers to identify when questions appeared.
    3. DEDUPLICATION: If a question appears multiple times, list it ONLY ONCE, but track the years and count.
    4. FORMATTING REQUIREMENTS (Strictly follow this structure with BOLDING):
    
    UNIT [Number/Name if identifiable]
    
    **[Number]. [Question Text]?** (Years: [List years found e.g. 2021, 2023], Frequency: [Number of times] times)
    [Detailed Answer: Provide a comprehensive explanation found in the notes.]
    
    **[Number]. [Next Question]?** (Years: [e.g. 2022], Frequency: 1 time)
    [Detailed Answer...]
    `;

    prompt = `Analyze the attached PAST QUESTIONS and COURSE MATERIAL. Generate a comprehensive solution document. Identify unique questions and provide detailed answers based on the material. Ensure Question texts are bolded using ** markers. You MUST append the Years and Frequency at the end of every bolded question text.`;

  } else if (mode === ResultMode.REVIEW) {
    // REVIEW MODE (Flashcards)
    systemInstruction = `You are a Flashcard Generator.
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

    prompt = `Create a Flashcard Q&A list. Keep answers very short and simple. Use **Q:** and **A:** markers for bolding.`;
  } else if (mode === ResultMode.SUMMARY) {
    // SUMMARY MODE
    systemInstruction = `You are an Expert Academic Simplifier.
    Your absolute priority is to explain the uploaded document in the SIMPLEST, MOST ACCESSIBLE language possible.
    Imagine you are teaching a beginner who has zero prior knowledge of the subject.
    
    CRITICAL INSTRUCTIONS:
    1. **EXTREME SIMPLICITY**: Use plain English. Short sentences. No academic jargon. If a technical term is necessary, define it immediately in simple words.
    2. **Explain Like I'm 5**: Your goal is clarity. Make concepts sound easy and friendly.
    3. **Topic-by-Topic Breakdown**: Go through the document section by section.
    4. **Content**: For EACH major topic, you MUST provide these details (if applicable) and BOLD the labels using **:
       - **Definition**: A crystal-clear, easy-to-read definition.
       - **Simple Explanation**: A conversational paragraph explaining what this really means in everyday life.
       - **Key Features**: The main characteristics, listed simply.
       - **Types**: Kinds or categories, explained simply.
       - **Advantages**: The good parts (pros).
       - **Disadvantages**: The bad parts (cons).

    FORMATTING REQUIREMENTS:
    
    **[Document Title]**
    
    **Executive Overview**
    [A very simple summary of the whole document.]
    
    ---
    
    **TOPIC: [Topic Name]**
    
    *   **Definition**: [The simplest definition possible]
    *   **Simple Explanation**: [A paragraph that makes it click for a beginner]
    *   **Key Features**:
        *   [Feature 1]
        *   [Feature 2]
    *   **Types**:
        *   **[Type Name]**: [Simple Description]
    *   **Advantages**:
        *   [Advantage 1]
    *   **Disadvantages**:
        *   [Disadvantage 1]
    
    ---
    
    (Repeat for all major topics)
    
    **Conclusion**
    [Final wrap-up]
    `;
    
    prompt = `Analyze the attached document. Break it down topic by topic. For every topic, provide a Definition, Simple Explanation, Features, Types, Advantages, and Disadvantages. Use **bold markers** for headers. CRITICAL: Your output MUST be extremely easy to read. Simplify everything for a beginner.`;
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