import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, LabReportData } from "../types";

// ✅ Ensure environment variable exists
if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY is not set in environment variables");
}

// ✅ Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY,
});

// ✅ Define model name
const model = "gemini-2.5-flash";


// ---------------------------------------------------------
// ⭐ Utility: Convert base64 → Generative Part for Gemini
// ---------------------------------------------------------
function fileToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data.replace(/^data:.*;base64,/, ""),
      mimeType,
    },
  };
}


// ---------------------------------------------------------
// ⭐ Utility: Clean JSON from model output
// ---------------------------------------------------------
const cleanResponseText = (text: string | undefined): string => {
  if (!text) return "{}";

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};


// ---------------------------------------------------------
// ⭐ Prescription Schema
// ---------------------------------------------------------
const prescriptionSchema = {
  type: Type.OBJECT,
  properties: {
    is_document_valid: { type: Type.BOOLEAN },
    document_type: { type: Type.STRING, enum: ["PRESCRIPTION", "OTHER"] },
    disease: { type: Type.STRING },
    medicines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          frequency: { type: Type.STRING },
          timing: { type: Type.STRING },
          reason: { type: Type.STRING },
          time_gap_hours: { type: Type.NUMBER },
        },
        required: [
          "name",
          "dosage",
          "frequency",
          "timing",
          "time_gap_hours",
        ],
      },
    },
  },
  required: ["is_document_valid", "document_type", "disease", "medicines"],
};


// ---------------------------------------------------------
// ⭐ Lab Report Schema
// ---------------------------------------------------------
const labReportSchema = {
  type: Type.OBJECT,
  properties: {
    is_document_valid: { type: Type.BOOLEAN },
    document_type: { type: Type.STRING, enum: ["LAB_REPORT", "OTHER"] },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testName: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          referenceRange: { type: Type.STRING },
          status: {
            type: Type.STRING,
            enum: [
              "Normal",
              "Slightly Low",
              "Low",
              "Very Low",
              "Slightly High",
              "High",
              "Very High",
            ],
          },
          interpretation: { type: Type.STRING },
        },
        required: [
          "testName",
          "value",
          "unit",
          "referenceRange",
          "status",
          "interpretation",
        ],
      },
    },
    recommendations: {
      type: Type.OBJECT,
      properties: {
        food: { type: Type.ARRAY, items: { type: Type.STRING } },
        lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["food", "lifestyle"],
    },
  },
  required: ["is_document_valid", "document_type", "results", "recommendations"],
};


// ---------------------------------------------------------
// ⭐ Analyze Prescription
// ---------------------------------------------------------
export const analyzePrescription = async (
  imageData: string,
  mimeType: string
): Promise<PrescriptionData> => {
  const imagePart = fileToGenerativePart(imageData, mimeType);

  const prompt = `
You are a multilingual medical prescription expert.
Determine if the image is a valid prescription.

IF VALID:
- is_document_valid = true
- document_type = PRESCRIPTION
- extract disease
- extract medicines with: name, dosage, frequency, timing, reason
- convert frequency to standard form (e.g., Twice a day)
- calculate time_gap_hours (Twice a day = 12, Thrice a day = 8, etc.)

IF NOT VALID:
- is_document_valid = false
- document_type = OTHER
- return empty values
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
        temperature: 0,
      },
    });

    const parsed = JSON.parse(cleanResponseText(response.text));

    return {
      is_document_valid: parsed.is_document_valid ?? false,
      document_type: parsed.document_type || "OTHER",
      disease: parsed.disease || "",
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
    };
  } catch (error) {
    console.error("Error analyzing prescription:", error);
    throw error;
  }
};


// ---------------------------------------------------------
// ⭐ Analyze Lab Report
// ---------------------------------------------------------
export const analyzeLabReport = async (
  imageData: string,
  mimeType: string
): Promise<LabReportData> => {
  const imagePart = fileToGenerativePart(imageData, mimeType);

  const prompt = `
You are a medical lab report expert.
Determine if the image is a valid lab report.

IF VALID:
- extract test results
- classify values
- generate diet + lifestyle recommendations

IF NOT:
- is_document_valid = false
- document_type = OTHER
- return empty structures
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: labReportSchema,
        temperature: 0,
      },
    });

    const parsed = JSON.parse(cleanResponseText(response.text));

    return {
      is_document_valid: parsed.is_document_valid ?? false,
      document_type: parsed.document_type || "OTHER",
      results: Array.isArray(parsed.results) ? parsed.results : [],
      recommendations: parsed.recommendations || { food: [], lifestyle: [] },
    };
  } catch (error) {
    console.error("Error analyzing lab report:", error);
    throw error;
  }
};
