
export enum AnalysisType {
  Prescription = 'PRESCRIPTION',
  LabReport = 'LAB_REPORT'
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  reason?: string;
  reminderTimes?: string[];
  time_gap_hours?: number;
}

export interface PrescriptionData {
  is_document_valid: boolean;
  document_type: 'PRESCRIPTION' | 'OTHER';
  disease: string;
  medicines: Medicine[];
}

export enum LabResultStatus {
    NORMAL = 'Normal',
    SLIGHTLY_LOW = 'Slightly Low',
    LOW = 'Low',
    VERY_LOW = 'Very Low',
    SLIGHTLY_HIGH = 'Slightly High',
    HIGH = 'High',
    VERY_HIGH = 'Very High'
}

export interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: LabResultStatus;
  interpretation: string;
}

export interface LabReportData {
  is_document_valid: boolean;
  document_type: 'LAB_REPORT' | 'OTHER';
  results: LabResult[];
  recommendations: {
    food: string[];
    lifestyle: string[];
  };
}