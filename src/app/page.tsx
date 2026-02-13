'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CaseViewer } from '@/components/CaseViewer';
import { ResponseEvaluator } from '@/components/ResponseEvaluator';
import { Dashboard } from '@/components/Dashboard';
import { Evaluation } from '@/types';
import casesData from '@/data/cases.json';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

// Force type assertion for cases data as importing JSON directly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CASES = casesData as any[];

export default function App() {
    const [currentView, setCurrentView] = useState('review');
    const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
    // Flatten all model responses to find unique model names across all cases (or just take 1st case)
    const modelNames = CASES.length > 0 ? Object.keys(CASES[0].llmResponses || {}) : [];
    const [currentModelIndex, setCurrentModelIndex] = useState(0);

    const [ratings, setRatings] = useState<Evaluation>({});
    const [showGoldLabel, setShowGoldLabel] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsClient(true);
        const saved = localStorage.getItem('clinical_eval_ratings');
        if (saved) {
            try {
                setRatings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load ratings", e);
            }
        }
    }, []);

    // Save to localStorage whenever ratings change
    useEffect(() => {
        if (isClient && Object.keys(ratings).length > 0) {
            localStorage.setItem('clinical_eval_ratings', JSON.stringify(ratings));
        }
    }, [ratings, isClient]);

    const currentCase = CASES[currentCaseIndex];
    const currentModel = modelNames[currentModelIndex];

    const handleRatingChange = (criterion: string, value: number) => {
        setRatings(prev => {
            const caseRatings = prev[currentCase.id] || {};
            const modelRatings = caseRatings[currentModel] || {};

            return {
                ...prev,
                [currentCase.id]: {
                    ...caseRatings,
                    [currentModel]: {
                        ...modelRatings,
                        [criterion]: value
                    }
                }
            };
        });
    };

    const handleDownload = () => {
        // Flatten data for Excel
        const rows: any[] = [];

        CASES.forEach(c => {
            modelNames.forEach(m => {
                const r = ratings[c.id]?.[m] || {};
                rows.push({
                    CaseID: c.id,
                    CaseTitle: c.title,
                    Model: m,
                    ...r // Spreads accuracy: 2, clarity: 1, etc.
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluations");
        XLSX.writeFile(workbook, "Clinical_Evaluations.xlsx");
    };

    if (!isClient) return null; // Avoid hydration mismatch

    // Calculate Progress
    const progressPercent = Math.round((((currentCaseIndex * modelNames.length) + currentModelIndex) / (CASES.length * modelNames.length)) * 100);

    return (
        <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

            {currentView === 'dashboard' && <Dashboard cases={CASES} ratings={ratings} />}

            {currentView === 'review' && (
                <div className="main-content flex flex-col h-full">
                    <div className="container flex-1 flex flex-col">
                        {/* Progress bar */}
                        <div className="card shrink-0">
                            <div className="progress-container">
                                <div className="progress-header">
                                    <span className="progress-text">
                                        Case {currentCaseIndex + 1} of {CASES.length} | Model {currentModelIndex + 1} of {modelNames.length}
                                    </span>
                                    <span className="progress-text flex items-center gap-4">
                                        <span className="progress-percent">{progressPercent}% complete</span>
                                        <button onClick={handleDownload} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
                                            <Download size={16} /> Download Results
                                        </button>
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <CaseViewer caseData={currentCase} />

                            {/* Gold label toggle */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowGoldLabel(!showGoldLabel)}
                                    className="gold-label-toggle"
                                >
                                    {showGoldLabel ? 'Hide' : 'Show'} Gold Standard
                                </button>
                                {showGoldLabel && (
                                    <div className="gold-label-box">
                                        <span>Gold Label: </span>
                                        <span>{currentCase.goldLabel}</span>
                                    </div>
                                )}
                            </div>

                            {/* Evaluator */}
                            <ResponseEvaluator
                                modelName={`Model ${String.fromCharCode(65 + currentModelIndex)}`}
                                response={currentCase.llmResponses[currentModel]}
                                currentRatings={ratings[currentCase.id]?.[currentModel] || {}}
                                onRatingChange={handleRatingChange}
                            />

                        </div>

                        {/* Navigation */}
                        <div className="card shrink-0 mt-4">
                            <div className="nav-footer">
                                <button
                                    onClick={() => {
                                        if (currentModelIndex > 0) {
                                            setCurrentModelIndex(currentModelIndex - 1);
                                        } else if (currentCaseIndex > 0) {
                                            setCurrentCaseIndex(currentCaseIndex - 1);
                                            setCurrentModelIndex(modelNames.length - 1);
                                        }
                                    }}
                                    disabled={currentCaseIndex === 0 && currentModelIndex === 0}
                                    className="nav-btn-secondary"
                                >
                                    ← Previous
                                </button>

                                <div className="model-indicators">
                                    {modelNames.map((model, idx) => {
                                        // Check if scored
                                        const isScored = ratings[currentCase.id]?.[model] && Object.keys(ratings[currentCase.id][model]).length > 0;
                                        return (
                                            <button
                                                key={model}
                                                onClick={() => setCurrentModelIndex(idx)}
                                                className={`model-dot ${idx === currentModelIndex
                                                    ? 'model-dot-active'
                                                    : isScored
                                                        ? 'model-dot-complete'
                                                        : 'model-dot-pending'
                                                    }`}
                                            >
                                                {String.fromCharCode(65 + idx)}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => {
                                        if (currentModelIndex < modelNames.length - 1) {
                                            setCurrentModelIndex(currentModelIndex + 1);
                                        } else if (currentCaseIndex < CASES.length - 1) {
                                            setCurrentCaseIndex(currentCaseIndex + 1);
                                            setCurrentModelIndex(0);
                                        }
                                    }}
                                    className="nav-btn-primary"
                                >
                                    {currentModelIndex < modelNames.length - 1 ? 'Next Model →' :
                                        currentCaseIndex < CASES.length - 1 ? 'Next Case →' : 'Complete ✓'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'contribute' && (
                <div className="main-content flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-4xl mb-4">📝</p>
                        <h2 className="text-xl font-bold">Contribute Cases</h2>
                        <p className="text-gray-500">Feature coming soon.</p>
                    </div>
                </div>
            )}
            {currentView === 'organization' && (
                <div className="main-content flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-4xl mb-4">🏢</p>
                        <h2 className="text-xl font-bold">Organization</h2>
                        <p className="text-gray-500">Feature coming soon.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
