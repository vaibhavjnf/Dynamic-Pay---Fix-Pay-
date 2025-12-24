import { GoogleGenAI } from "@google/genai";

export const extractUPIFromImage = async (base64Image: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Clean base64 string if it has the data URL prefix
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: 'image/jpeg', 
              data: base64Data 
            } 
          },
          { 
            text: "Analyze this QR code image. If it contains a UPI payment link or VPA, extract ONLY the UPI ID (e.g., username@bank) and return it as a plain string. Do not return any JSON or markdown. If no UPI ID is found, return 'NOT_FOUND'." 
          }
        ]
      }
    });

    const text = response.text?.trim();
    if (!text || text === 'NOT_FOUND') {
      return null;
    }
    
    // Basic validation to check if it looks like a UPI ID
    if (text.includes('@')) {
      return text;
    }
    
    return null;
  } catch (error) {
    console.error("Gemini extraction failed", error);
    return null;
  }
};