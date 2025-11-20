import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, LabReportData, FileInput } from "../types";

// ---------------------------------------------------------
// 1️⃣ Initialize Gemini With VITE API KEY
// ---------------------------------------------------------
if (!import.meta.env.VITE_API_KEY) {
  throw new Error("❌ VITE_API_KEY is missing. Add it in .env");
}

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY,
});

// Model
const model = "gemini-2.5-flash";

// ---------------------------------------------------------
// 2️⃣ Convert base64 → Generative Part
// ---------------------------------------------------------
function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64.replace(/^data:.*;base64,/, ""),
      mimeType,
    },
  };
}

// ---------------------------------------------------------
// 3️⃣ Clean Model Output JSON
// ---------------------------------------------------------
const cleanResponseText = (text: string | undefined): string => {
  if (!text) return "{}";

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }

  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// ---------------------------------------------------------
// 4️⃣ Prescription Schema
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
// 5️⃣ Lab Report Schema
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
// 6️⃣ Analyze Prescription
// ---------------------------------------------------------
export const analyzePrescription = async (
  files: FileInput[]
): Promise<PrescriptionData> => {
  const parts = files.map((f) => fileToGenerativePart(f.data, f.mimeType));

  const prompt = `
You are a multilingual medical prescription expert.
Determine if the upload is a REAL medical prescription.

If valid:
- classify as PRESCRIPTION
- extract disease
- extract medicines with name, dosage, timing, frequency
- normalize frequency
- calculate time_gap_hours

If invalid:
- is_document_valid = false
- document_type = OTHER
- return empty values
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...parts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
        temperature: 0,
      },
    });

    const json = cleanResponseText(response.text);
    const parsed = JSON.parse(json);

    return {
      is_document_valid: parsed.is_document_valid ?? false,
      document_type: parsed.document_type || "OTHER",
      disease: parsed.disease || "",
      medicines: parsed.medicines || [],
    };
  } catch (err) {
    console.error("Prescription Error:", err);
    throw err;
  }
};

// ---------------------------------------------------------
// 7️⃣ Analyze Lab Report
// ---------------------------------------------------------
export const analyzeLabReport = async (
  files: FileInput[]
): Promise<LabReportData> => {
  const parts = files.map((f) => fileToGenerativePart(f.data, f.mimeType));

  const prompt = `
You are a lab diagnostics expert.
If file is a lab report:
- extract all test results
- classify values
- give medical interpretation
- give food & lifestyle recommendations

If not a lab report:
- is_document_valid = false
- return empty results and recommendations
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...parts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: labReportSchema,
        temperature: 0,
      },
    });

    const json = cleanResponseText(response.text);
    const parsed = JSON.parse(json);

    return {
      is_document_valid: parsed.is_document_valid ?? false,
      document_type: parsed.document_type || "OTHER",
      results: parsed.results || [],
      recommendations: parsed.recommendations || { food: [], lifestyle: [] },
    };
  } catch (err) {
    console.error("Lab Report Error:", err);
    throw err;
  }
};
