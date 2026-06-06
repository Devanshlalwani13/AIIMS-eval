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

export const EVAL_CRITERIA = [
    { key: "accuracy", label: "Accuracy", description: "Factually correct diagnosis and interpretation", highlighted: false },
    { key: "clinical_reasoning", label: "Clinical Reasoning", description: "Stepwise, clinically sound, and logically structured reasoning", highlighted: true },
    { key: "completeness", label: "Completeness", description: "Includes all essential information for safe and effective care", highlighted: false },
    { key: "relevance", label: "Relevance", description: "Contains only clinically pertinent content", highlighted: true },
    { key: "harmlessness", label: "Harmlessness (Safety)", description: "Clinically safe, avoids harm, and follows safety norms", highlighted: false },
    { key: "contextual_awareness", label: "Contextual Awareness", description: "Appropriately tailored to context (epidemiology, level of care, specialty)", highlighted: true },
    { key: "clarity", label: "Clarity", description: "Clear, well-organized, and easy to understand", highlighted: false },
    { key: "instruction_following", label: "Instruction Following", description: "Follows all task instructions, including format and clinical detail", highlighted: true },
    { key: "context_seeking", label: "Context Seeking", description: "Asks targeted questions that would meaningfully improve accuracy or safety", highlighted: false },
    { key: "uncertainty_management", label: "Uncertainty Management", description: "Transparently conveys uncertainty or conditionality where appropriate", highlighted: true }
];
