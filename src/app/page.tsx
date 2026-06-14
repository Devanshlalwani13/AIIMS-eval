'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CaseViewer } from '@/components/CaseViewer';
import { OutputPanel } from '@/components/OutputPanel';
import { Dashboard } from '@/components/Dashboard';
import { ConsentGate } from '@/components/ConsentGate';
import { Evaluation, Rater } from '@/types';
import casesData from '@/data/cases.json';
import { SUBMIT_ENDPOINT } from '@/config';
import * as XLSX from 'xlsx';
import { Download, Send } from 'lucide-react';

// Force type assertion for cases data as importing JSON directly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CASES = casesData as any[];

const CRITERIA = ['correct_diagnosis', 'clarity_instruction', 'completeness', 'safety', 'uncertainty_management'];

export default function App() {
    const [currentView, setCurrentView] = useState('review');
    const [currentCaseIndex, setCurrentCaseIndex] = useState(0);

    const [ratings, setRatings] = useState<Evaluation>({});
    const [comments, setComments] = useState<Record<string, Record<string, string>>>({});
    const [showGoldLabel, setShowGoldLabel] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [rater, setRater] = useState<Rater | null>(null);
    const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
    const [submitMsg, setSubmitMsg] = useState('');

    // Load from localStorage on mount
    useEffect(() => {
        setIsClient(true);
        const savedRater = localStorage.getItem('hpla_rater');
        if (savedRater) {
            try { setRater(JSON.parse(savedRater)); } catch (e) { console.error("Failed to load rater", e); }
        }
        const saved = localStorage.getItem('clinical_eval_ratings');
        if (saved) {
            try { setRatings(JSON.parse(saved)); } catch (e) { console.error("Failed to load ratings", e); }
        }
        const savedComments = localStorage.getItem('clinical_eval_comments');
        if (savedComments) {
            try { setComments(JSON.parse(savedComments)); } catch (e) { console.error("Failed to load comments", e); }
        }
    }, []);

    // Persist
    useEffect(() => {
        if (isClient && Object.keys(ratings).length > 0) {
            localStorage.setItem('clinical_eval_ratings', JSON.stringify(ratings));
        }
    }, [ratings, isClient]);
    useEffect(() => {
        if (isClient && Object.keys(comments).length > 0) {
            localStorage.setItem('clinical_eval_comments', JSON.stringify(comments));
        }
    }, [comments, isClient]);

    const currentCase = CASES[currentCaseIndex];
    // Blinded display order of models for this case -> Output 1, Output 2, ...
    const outputModels: string[] = (currentCase?.outputOrder && currentCase.outputOrder.length)
        ? currentCase.outputOrder
        : Object.keys(currentCase?.llmResponses || {});

    const handleRatingChange = (model: string, criterion: string, value: number) => {
        setRatings(prev => {
            const caseRatings = prev[currentCase.id] || {};
            const modelRatings = caseRatings[model] || {};
            return {
                ...prev,
                [currentCase.id]: {
                    ...caseRatings,
                    [model]: { ...modelRatings, [criterion]: value }
                }
            };
        });
    };

    const handleCommentChange = (model: string, value: string) => {
        setComments(prev => ({
            ...prev,
            [currentCase.id]: { ...(prev[currentCase.id] || {}), [model]: value }
        }));
    };

    // Shared row builder for both Excel export and direct submission.
    const buildRows = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = [];
        CASES.forEach(c => {
            const models: string[] = (c.outputOrder && c.outputOrder.length) ? c.outputOrder : Object.keys(c.llmResponses || {});
            models.forEach((m, idx) => {
                const r = ratings[c.id]?.[m] || {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const row: any = {
                    Email: rater?.email ?? '',
                    Rater: rater?.name ?? '',
                    CaseID: c.id,
                    CaseTitle: c.title,
                    Section: c.section,
                    OutputLabel: `Output ${idx + 1}`,  // what the evaluator saw
                    Model: m,                            // de-anonymized real model
                };
                CRITERIA.forEach(k => { row[k] = (r as Record<string, number>)[k] ?? ''; });
                row.Comments = comments[c.id]?.[m] || '';
                rows.push(row);
            });
        });
        return rows;
    };

    const ratedCount = () => buildRows().filter(r => CRITERIA.some(k => r[k] !== '' && r[k] !== undefined)).length;

    const handleDownload = () => {
        const rows = buildRows();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluations");
        XLSX.writeFile(workbook, "Clinical_Evaluations.xlsx");
    };

    const handleSubmit = async () => {
        if (!rater) return;
        const rows = buildRows();
        const n = ratedCount();
        if (SUBMIT_ENDPOINT.includes('YOUR_FORM_ID')) {
            setSubmitState('error');
            setSubmitMsg('Submission endpoint is not configured yet. Please use "Download Results" and send the file, or ask the study owner to set SUBMIT_ENDPOINT.');
            return;
        }
        setSubmitState('sending');
        setSubmitMsg(`Submitting ${n} rated outputs for ${rater.email}...`);
        try {
            const res = await fetch(SUBMIT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    rater: { email: rater.email, name: rater.name || '' },
                    submittedAt: new Date().toISOString(),
                    app: 'HPLA-100',
                    rows,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setSubmitState('ok');
            setSubmitMsg(`Thank you. ${n} rated outputs submitted for ${rater.email}.`);
        } catch (e) {
            console.error(e);
            setSubmitState('error');
            setSubmitMsg('Submission failed (network or endpoint error). Please use "Download Results" as a backup.');
        }
    };

    const switchRater = () => {
        localStorage.removeItem('hpla_rater');
        setRater(null);
        setSubmitState('idle');
        setSubmitMsg('');
    };

    if (!isClient) return null; // Avoid hydration mismatch
    if (!rater) return <ConsentGate onConsent={setRater} />;

    const progressPercent = Math.round((currentCaseIndex / CASES.length) * 100);
    const scoredOutputs = outputModels.filter(m => {
        const r = ratings[currentCase.id]?.[m];
        return r && Object.keys(r).length > 0;
    }).length;

    return (
        <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

            {currentView === 'dashboard' && <Dashboard cases={CASES} ratings={ratings} />}

            {currentView === 'review' && (
                <div className="main-content flex flex-col h-full">
                    <div className="container flex-1 flex flex-col">
                        {/* Rater bar */}
                        <div className="rater-bar">
                            <span className="rater-id">Signed in as <strong>{rater.email}</strong></span>
                            <button onClick={switchRater} className="switch-rater-link">Switch rater</button>
                        </div>

                        {/* Progress bar */}
                        <div className="card shrink-0">
                            <div className="progress-container">
                                <div className="progress-header">
                                    <span className="progress-text">
                                        Case {currentCaseIndex + 1} of {CASES.length}
                                    </span>
                                    <span className="progress-text flex items-center gap-4">
                                        <span className="progress-percent">{progressPercent}% complete</span>
                                        <button onClick={handleSubmit} disabled={submitState === 'sending'} className="submit-btn flex items-center gap-1 text-sm font-medium">
                                            <Send size={16} /> Submit Evaluations
                                        </button>
                                        <button onClick={handleDownload} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
                                            <Download size={16} /> Download (backup)
                                        </button>
                                    </span>
                                </div>
                                {submitMsg && (
                                    <div className={`submit-msg ${submitState === 'ok' ? 'submit-ok' : submitState === 'error' ? 'submit-error' : ''}`}>
                                        {submitMsg}
                                    </div>
                                )}
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <CaseViewer caseData={currentCase} />

                            {/* Gold label toggle */}
                            <div className="mb-6">
                                <button onClick={() => setShowGoldLabel(!showGoldLabel)} className="gold-label-toggle">
                                    {showGoldLabel ? 'Hide' : 'Show'} Gold Standard
                                </button>
                                {showGoldLabel && (
                                    <div className="gold-label-box">
                                        <span>Gold Label: </span>
                                        <span>{currentCase.goldLabel}</span>
                                    </div>
                                )}
                            </div>

                            {/* All model outputs for this case — blinded & collapsible */}
                            <div className="outputs-header">
                                <h3 className="section-title">Model Outputs ({outputModels.length}) — blinded</h3>
                                <span className="outputs-progress">{scoredOutputs}/{outputModels.length} evaluated</span>
                            </div>

                            {outputModels.map((model, idx) => (
                                <OutputPanel
                                    key={model}
                                    label={`Output ${idx + 1}`}
                                    response={currentCase.llmResponses[model]}
                                    currentRatings={ratings[currentCase.id]?.[model] || {}}
                                    onRatingChange={(criterion, value) => handleRatingChange(model, criterion, value)}
                                    comment={comments[currentCase.id]?.[model] || ''}
                                    onCommentChange={(value) => handleCommentChange(model, value)}
                                />
                            ))}
                        </div>

                        {/* Navigation — per case */}
                        <div className="card shrink-0 mt-4">
                            <div className="nav-footer">
                                <button
                                    onClick={() => { if (currentCaseIndex > 0) setCurrentCaseIndex(currentCaseIndex - 1); }}
                                    disabled={currentCaseIndex === 0}
                                    className="nav-btn-secondary"
                                >
                                    ← Previous Case
                                </button>

                                <div className="model-indicators">
                                    <span className="progress-text">{scoredOutputs}/{outputModels.length} outputs scored</span>
                                </div>

                                <button
                                    onClick={() => { if (currentCaseIndex < CASES.length - 1) setCurrentCaseIndex(currentCaseIndex + 1); }}
                                    disabled={currentCaseIndex === CASES.length - 1}
                                    className="nav-btn-primary"
                                >
                                    {currentCaseIndex < CASES.length - 1 ? 'Next Case →' : 'Complete ✓'}
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
