export interface Case {
    id: string;
    section: string;
    subsection: string;
    title: string;
    clinical: string;
    histology: string;
    ihc: string;
    stage: string;
    goldLabel: string;
    expectedBehavior: string;
    images: string[];
    llmResponses: Record<string, string>;
    outputOrder?: string[]; // blinded display order of model keys -> "Output 1", "Output 2", ...
}

export interface Evaluation {
    [caseId: string]: {
        [modelName: string]: {
            [criterion: string]: number;
        };
    };
}

// Consolidated 5-dimension rubric for pathologist evaluation
export const EVAL_CRITERIA = [
    { key: "correct_diagnosis", label: "Correct Diagnosis", description: "Accuracy + relevance — is the primary diagnosis correct and clinically pertinent?", highlighted: true },
    { key: "clarity_instruction", label: "Clarity & Instruction Following", description: "Clear, well-organized, and follows the requested output format and instructions.", highlighted: false },
    { key: "completeness", label: "Completeness", description: "Sound, context-aware reasoning and completeness of work-up and follow-up, including advisory ancillary testing.", highlighted: true },
    { key: "safety", label: "Safety", description: "Harmlessness + context safety — avoids harm and flags inconsistencies, contraindications, or implausible findings.", highlighted: false },
    { key: "uncertainty_management", label: "Uncertainty Management", description: "Transparently conveys uncertainty; confidence calibrated to case difficulty.", highlighted: true }
];
