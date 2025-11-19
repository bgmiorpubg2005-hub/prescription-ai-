import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, LabReportData } from '../types';

// ❌ REMOVE this check (process.env does NOT work in Vite)
// if (!process.env.API_KEY) {
//     throw new Error("API_KEY environment variable is not set");
// }

// ✅ Use Vite environment variable
if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY
});


const cleanResponseText = (text: string | undefined): string => {
    if (!text) return "{}";
    
    // Find the first opening brace and the last closing brace
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }

    // Fallback: Remove markdown if the brace search failed (unlikely for valid JSON)
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const prescriptionSchema = {
    type: Type.OBJECT,
    properties: {
        is_document_valid: {
            type: Type.BOOLEAN,
            description: "Set to true if the image is a medical prescription, false otherwise."
        },
        document_type: {
            type: Type.STRING,
            enum: ['PRESCRIPTION', 'OTHER'],
            description: "The type of document identified in the image."
        },
        disease: {
            type: Type.STRING,
            description: "The primary disease or diagnosis. Should be an empty string if not a valid prescription."
        },
        medicines: {
            type: Type.ARRAY,
            description: "A list of all prescribed medicines. Should be an empty array if not a valid prescription.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the medicine." },
                    dosage: { type: Type.STRING, description: "Dosage of the medicine (e.g., '500mg', '1 tablet')." },
                    frequency: { type: Type.STRING, description: "How often to take the medicine (e.g., 'Twice a day', '1-0-1'). Standardize this output." },
                    timing: { type: Type.STRING, description: "Specific timing instructions (e.g., 'After food', 'Before breakfast')." },
                    reason: { type: Type.STRING, description: "A short reason why the medicine is prescribed (e.g., 'For fever', 'Antibiotic'). If not present, infer it or return an empty string." },
                    time_gap_hours: { type: Type.NUMBER, description: "The recommended time gap in hours between doses, calculated from the frequency. E.g., for 'Thrice a day', this should be 8. For 'Twice a day', 12. If the frequency is 'every 6 hours', this should be 6. Default to 4 if unsure." },
                },
                required: ["name", "dosage", "frequency", "timing", "time_gap_hours"],
            },
        },
    },
    required: ["is_document_valid", "document_type", "disease", "medicines"],
};


const labReportSchema = {
    type: Type.OBJECT,
    properties: {
        is_document_valid: {
            type: Type.BOOLEAN,
            description: "Set to true if the image is a medical lab report, false otherwise."
        },
        document_type: {
            type: Type.STRING,
            enum: ['LAB_REPORT', 'OTHER'],
            description: "The type of document identified in the image."
        },
        results: {
            type: Type.ARRAY,
            description: "List of all lab test results. Should be an empty array if not a valid lab report.",
            items: {
                type: Type.OBJECT,
                properties: {
                    testName: { type: Type.STRING, description: "Name of the lab test." },
                    value: { type: Type.STRING, description: "The patient's value for the test." },
                    unit: { type: Type.STRING, description: "Unit of measurement for the value." },
                    referenceRange: { type: Type.STRING, description: "The standard reference range for the test." },
                    status: {
                        type: Type.STRING,
                        enum: ['Normal', 'Slightly Low', 'Low', 'Very Low', 'Slightly High', 'High', 'Very High'],
                        description: "Classification of the value compared to the reference range."
                    },
                    interpretation: { type: Type.STRING, description: "A brief interpretation of what the result might indicate." }
                },
                required: ["testName", "value", "unit", "referenceRange", "status", "interpretation"],
            }
        },
        recommendations: {
            type: Type.OBJECT,
            description: "Recommendations based on results. Should be an object with empty arrays if not a valid lab report.",
            properties: {
                food: {
                    type: Type.ARRAY,
                    description: "List of food recommendations.",
                    items: { type: Type.STRING }
                },
                lifestyle: {
                    type: Type.ARRAY,
                    description: "List of lifestyle recommendations.",
                    items: { type: Type.STRING }
                }
            },
            required: ["food", "lifestyle"]
        }
    },
    required: ["is_document_valid", "document_type", "results", "recommendations"],
};


export const analyzePrescription = async (imageData: string, mimeType: string): Promise<PrescriptionData> => {
  const imagePart = fileToGenerativePart(imageData, mimeType);
  const prompt = `You are an expert, multilingual medical assistant. Analyze the provided image.
First, determine if it is a medical prescription.
- If it IS a prescription:
  1. Set 'is_document_valid' to true and 'document_type' to 'PRESCRIPTION'.
  2. Extract the primary diagnosis.
  3. Extract all medicines. For each medicine, provide: name, dosage, frequency, timing, and a short reason (infer if not present, or use empty string).
  4. VERY IMPORTANTLY: Read the frequency carefully, even if it's in regional languages like Malayalam (e.g., 'രാവിലെ, രാത്രി' means 'morning, night'). Standardize the frequency (e.g., 'Twice a day').
  5. Based on the standardized frequency, calculate 'time_gap_hours'. For 'Once a day', use 24. 'Twice a day' is 12. 'Thrice a day' is 8. If it says 'every 6 hours', use 6. If unsure, default to a safe value of 4.
- If it is NOT a prescription:
  1. Set 'is_document_valid' to false and 'document_type' to 'OTHER'.
  2. Return empty strings/arrays for all other fields.
Return only the structured JSON object.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: prescriptionSchema,
            temperature: 0, // Strict generation
        }
    });

    const jsonString = cleanResponseText(response.text);
    const parsed = JSON.parse(jsonString);

    // Ensure the returned object has all required fields to prevent UI crashes
    return {
        is_document_valid: parsed.is_document_valid ?? false,
        document_type: parsed.document_type || 'OTHER',
        disease: parsed.disease || '',
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines : []
    };
  } catch (error) {
      console.error("Error analyzing prescription:", error);
      throw error; 
  }
};

export const analyzeLabReport = async (imageData: string, mimeType: string): Promise<LabReportData> => {
  const imagePart = fileToGenerativePart(imageData, mimeType);
  const prompt = `You are an expert medical lab report analyst. First, determine if the provided image is a medical lab report.
- If it IS a lab report, set 'is_document_valid' to true, 'document_type' to 'LAB_REPORT', extract each test result, classify it using one of: 'Normal', 'Slightly Low', 'Low', 'Very Low', 'Slightly High', 'High', 'Very High', provide interpretation, and generate diet/lifestyle recommendations based on any abnormal values.
- If it is NOT a lab report, set 'is_document_valid' to false, 'document_type' to 'OTHER', and return empty arrays/objects for the other fields.
Return all information in a structured JSON format according to the schema. The output must be only the JSON object.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: labReportSchema,
            temperature: 0, // Strict generation
        }
    });

    const jsonString = cleanResponseText(response.text);
    const parsed = JSON.parse(jsonString);

    // Ensure the returned object has all required fields to prevent UI crashes
    return {
        is_document_valid: parsed.is_document_valid ?? false,
        document_type: parsed.document_type || 'OTHER',
        results: Array.isArray(parsed.results) ? parsed.results : [],
        recommendations: parsed.recommendations || { food: [], lifestyle: [] }
    };
  } catch (error) {
      console.error("Error analyzing lab report:", error);
      throw error;
  }
};
