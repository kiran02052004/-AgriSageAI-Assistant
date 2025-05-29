
import { GoogleGenAI, GenerateContentResponse, Part, GroundingChunk as GenAIGroundingChunk } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_VISION_MODEL, IS_API_KEY_CONFIGURED } from '../constants';
import type { GroundingChunk } from '../types'; // Use import type for types

// Ensure API_KEY is handled correctly as per instructions
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (IS_API_KEY_CONFIGURED && API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("Gemini API key not configured. AI services will be disabled.");
}

// Custom error class for JSON parsing issues
export class JsonParsingError extends Error {
  constructor(message: string, public rawResponse?: string, public attemptedParseString?: string) {
    super(message);
    this.name = "JsonParsingError";
  }
}

const parseGeminiResponseText = (responseText: string): string => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};

export const generateText = async (prompt: string): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!ai) {
    console.warn("API key not configured. Cannot connect to AI service during generateText.");
    return { text: "API key not configured. Cannot connect to AI service." };
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    return { text: response.text };
  } catch (error) {
    console.error("Gemini text generation error:", error);
    return { text: `Error generating text: ${(error as Error).message}` };
  }
};

export const generateTextWithGoogleSearch = async (prompt: string): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!ai) {
    console.warn("API key not configured. Cannot connect to AI service during generateTextWithGoogleSearch.");
    return { text: "API key not configured. Cannot connect to AI service." };
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, // or appropriate model that supports tools
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      }
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    let parsedGroundingChunks: GroundingChunk[] | undefined = undefined;

    if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
      parsedGroundingChunks = (groundingMetadata.groundingChunks as GenAIGroundingChunk[]).map(chunk => ({
        web: {
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'Untitled',
        }
      }));
    }
    
    return { text: response.text, groundingChunks: parsedGroundingChunks };
  } catch (error) {
    console.error("Gemini text generation with Google Search error:", error);
    return { text: `Error generating text with Google Search: ${(error as Error).message}` };
  }
};


export const analyzeImageWithText = async (base64ImageData: string, mimeType: string, prompt: string): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!ai) {
    console.warn("API key not configured. Cannot connect to AI service during analyzeImageWithText.");
    return { text: "API key not configured. Cannot connect to AI service." };
  }
  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    const textPart: Part = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_VISION_MODEL, // Vision model
      contents: { parts: [imagePart, textPart] },
    });
    return { text: response.text };
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return { text: `Error analyzing image: ${(error as Error).message}` };
  }
};

export const generateJson = async <T>(prompt: string, systemInstruction?: string): Promise<T> => {
  if (!ai) {
    console.error("Gemini API key not configured. Cannot connect to AI service for JSON generation.");
    // Throw an error to be handled by the caller, consistent with other error handling.
    throw new Error("API key not configured. Cannot connect to AI service.");
  }
  
  let rawResponseText: string | undefined;
  let jsonStrToParse: string = ""; 

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        ...(systemInstruction && { systemInstruction }),
      },
    });

    rawResponseText = response.text;
    // console.log("[AgriSage DEBUG] Raw Gemini response for JSON:", rawResponseText); 
    
    jsonStrToParse = parseGeminiResponseText(rawResponseText);
    // console.log("[AgriSage DEBUG] Attempting to parse JSON string (after fence removal):", jsonStrToParse);

    return JSON.parse(jsonStrToParse) as T;

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    const parseErrorMessage = `Failed to parse JSON response from AI. Original error: ${errorMessage}. Check browser console for "[AgriSage DEBUG]" logs to see the problematic string.`;
    
    console.error("Gemini JSON generation error:", error); // Log the original error object
    console.error("[AgriSage DEBUG] Raw Gemini response for JSON:", rawResponseText ?? "N/A (GenerateContent might have failed or text was undefined)");
    console.error("[AgriSage DEBUG] String that failed JSON.parse:", jsonStrToParse || "N/A (String was empty or parsing failed before this point)");
        
    throw new JsonParsingError(parseErrorMessage, rawResponseText, jsonStrToParse);
  }
};
