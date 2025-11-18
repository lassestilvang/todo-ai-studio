import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestedTask, Priority } from "../types";

// Initialize Gemini AI
// NOTE: In a real environment, this key must be in process.env. 
// The system prompt guarantees process.env.API_KEY availability.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseTaskWithGemini = async (input: string): Promise<AISuggestedTask | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract task details from the following natural language input: "${input}". 
      Infer the due date relative to now. 
      Today is ${new Date().toISOString()}.
      If no priority is mentioned, assume None.
      Return a clean JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string or null" },
            priority: { type: Type.STRING, enum: ["None", "Low", "Medium", "High"] },
            estimate: { type: Type.STRING, description: "Estimated time format HH:mm or null" }
          },
          required: ["title", "priority"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AISuggestedTask;
  } catch (error) {
    console.error("Error parsing task with Gemini:", error);
    return null;
  }
};

export const suggestPrioritization = async (tasks: string[]): Promise<string[]> => {
  // Stretch: Suggest which tasks to do first based on names
  // Placeholder for future implementation
  return tasks;
};
