import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Difficulty, PuzzleData } from "../types";
import { FALLBACK_PUZZLES } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const puzzleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    word: {
      type: Type.STRING,
      description: "The word to spell. Must be a simple noun suitable for children.",
    },
    missingIndices: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
      description: "Indices of the letters to hide (0-based).",
    },
    hint: {
      type: Type.STRING,
      description: "A simple, child-friendly description of the word.",
    },
  },
  required: ["word", "missingIndices", "hint"],
};

const CATEGORIES = [
  "Animals", "Food & Drink", "Household Objects", "Nature", "Vehicles", 
  "Clothing", "Toys", "Body Parts", "Colors", "Shapes", "Space", "Ocean"
];

export const generatePuzzle = async (difficulty: Difficulty): Promise<PuzzleData> => {
  // Fallback if no key provided to prevent crash in preview environments without env vars
  if (!apiKey) {
    console.warn("No API Key found, using fallback data.");
    const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
    return fallback;
  }

  try {
    const modelId = 'gemini-2.5-flash';
    // Pick a random category to force variety
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    
    let prompt = "";
    
    if (difficulty === Difficulty.EASY) {
      prompt = `Generate a spelling puzzle for a child (age 4-5) using a word from the category '${category}'. The word must be 3-4 letters long. Hide exactly 1 letter. Return JSON.`;
    } else {
      prompt = `Generate a spelling puzzle for a child (age 6-7) using a word from the category '${category}'. The word must be 4-6 letters long. Hide exactly 2 letters. Return JSON.`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: puzzleSchema,
        temperature: 1.2, // Increased temperature for more randomness
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as PuzzleData;
      // Validate indices
      data.word = data.word.toUpperCase();
      data.missingIndices = data.missingIndices.filter(i => i >= 0 && i < data.word.length);
      return data;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Failed to generate puzzle:", error);
    return FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
  }
};

export const generatePuzzleImage = async (word: string): Promise<string | null> => {
  if (!apiKey) return `https://picsum.photos/seed/${word}/500/500`;

  try {
    // Try to use Imagen
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A cute, colorful, 3D cartoon style illustration of a ${word}, white background, cheerful, high quality, vector art style, for children's educational game`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.warn("Imagen generation failed, trying Flash Image fallback...", error);
    // Fallback to Flash Image if Imagen fails (e.g. permissions)
    try {
       // NOTE: We can't strictly use 'generateImages' for Flash Image in the same way for some SDK versions,
       // but strictly speaking for @google/genai, image generation is specific.
       // If Imagen fails, we might just use a placeholder to avoid breaking the flow.
       return `https://picsum.photos/seed/${word}/500/500`;
    } catch (e) {
       return `https://picsum.photos/seed/${word}/500/500`;
    }
  }
};