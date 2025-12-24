import { GoogleGenAI } from "@google/genai";

export interface MerchantData {
  upiId: string;
  shopName?: string;
  category?: 'tea_shop' | 'grocery' | 'restaurant' | 'pharmacy' | 'other';
}

export const extractMerchantData = async (base64Image: string): Promise<MerchantData | null> => {
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
            text: `Analyze this image of a UPI QR code standee or sticker. Extract the following details in JSON format:
            {
              "upi_id": "The VPA/UPI ID found (e.g. name@bank)",
              "shop_name": "The name of the shop/merchant if visible",
              "category": "One of: 'tea_shop', 'grocery', 'restaurant', 'pharmacy', 'other'. Infer this from the shop name or image context."
            }
            If no UPI ID is found, return null. Return ONLY raw JSON.` 
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    
    const data = JSON.parse(text);

    if (!data.upi_id) return null;
    
    // Basic validation to check if it looks like a UPI ID
    if (!data.upi_id.includes('@')) {
      return null;
    }
    
    return {
      upiId: data.upi_id,
      shopName: data.shop_name,
      category: data.category
    };
  } catch (error) {
    console.error("Gemini extraction failed", error);
    return null;
  }
};