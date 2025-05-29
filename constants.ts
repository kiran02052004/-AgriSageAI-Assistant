
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_VISION_MODEL = 'gemini-2.5-flash-preview-04-17'; // Gemini 1.5 Flash supports vision

export const APP_TITLE = "AgriSage AI Assistant";

// Placeholder for API_KEY check. In a real app, this would be more robust.
export const IS_API_KEY_CONFIGURED = process.env.API_KEY && process.env.API_KEY !== "YOUR_API_KEY_HERE" && process.env.API_KEY.length > 10;