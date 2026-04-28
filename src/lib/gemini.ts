import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "GEMINI_API_KEY is not set. Add it to .env.local at the project root and restart `npm run dev`."
  );
}

const ai = new GoogleGenAI({ apiKey: apiKey ?? "" });

export type ParsedFood = {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export async function parseFoodInput(
  text?: string,
  imageBlob?: Blob
): Promise<ParsedFood[]> {
  const parts: any[] = [];
  
  if (text) {
    parts.push({ text: `Analyze this food input and provide nutritional estimates. Input: "${text}"` });
  } else if (imageBlob) {
     parts.push({ text: "Analyze the provided food image and provide nutritional estimates for what you see." });
  }

  if (imageBlob) {
    const base64EncodeString = await blobToBase64(imageBlob);
    parts.push({
      inlineData: {
        mimeType: imageBlob.type,
        data: base64EncodeString.split(',')[1] || base64EncodeString, // remove data prefix if present
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "You are an expert nutritionist. Analyze the requested food items and return a JSON list of identified foods with their estimated nutritional values per serving. If multiple distinct items are present, return multiple objects. Be as accurate as possible. If the input is vague, make a reasonable estimate.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Name of the food item along with portion size (e.g., 'Paneer Rice (0.5 cup)')",
              },
              calories: {
                type: Type.NUMBER,
                description: "Estimated total calories",
              },
              carbs: {
                type: Type.NUMBER,
                description: "Estimated carbohydrates in grams",
              },
              protein: {
                type: Type.NUMBER,
                description: "Estimated protein in grams",
              },
              fat: {
                type: Type.NUMBER,
                description: "Estimated fat in grams",
              },
            },
            required: ["name", "calories", "carbs", "protein", "fat"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as ParsedFood[];
  } catch (error) {
    console.error("Error parsing food:", error);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      apiKey
        ? `Failed to analyze food: ${detail}`
        : "Failed to analyze food: GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
}

export type UserProfile = {
  gender: string;
  age: number;
  weight: number;
  height: number;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
  goal: 'lose' | 'maintain' | 'gain';
  targetWeight?: number;
  speed?: 'mild' | 'moderate' | 'aggressive'; 
};

export async function calculateMacros(profile: UserProfile): Promise<{calories: number, carbs: number, protein: number, fat: number}> {
  const prompt = `
    Based on the following user profile, calculate the recommended daily macros for their goal:
    Gender: ${profile.gender}
    Age: ${profile.age}
    Weight: ${profile.weight} ${profile.weightUnit}
    Height: ${profile.height} ${profile.heightUnit}
    Goal: ${profile.goal} ${profile.goal !== 'maintain' ? `(Target Weight: ${profile.targetWeight} ${profile.weightUnit}, Speed: ${profile.speed})` : ''}

    Return ONLY a JSON object with the following keys:
    "calories" (number), "carbs" (number, in grams), "protein" (number, in grams), "fat" (number, in grams).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
          required: ["calories", "carbs", "protein", "fat"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    const result = JSON.parse(jsonStr);
    return {
      calories: result.calories || 2000,
      carbs: result.carbs || 250,
      protein: result.protein || 50,
      fat: result.fat || 70,
    };
  } catch (error) {
    console.error("Error calculating macros:", error);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      apiKey
        ? `Failed to calculate macros: ${detail}`
        : "Failed to calculate macros: GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
