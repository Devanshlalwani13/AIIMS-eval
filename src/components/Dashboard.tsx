
import React from 'react';
import { Case, Evaluation } from '@/types';

interface DashboardProps {
    cases: Case[];
    ratings: Evaluation;
}

export function Dashboard({ cases, ratings }: DashboardProps) {
    const totalCases = cases.length;
    // Assumes all cases have same number of models
    const modelNames = cases.length > 0 ? Object.keys(cases[0].llmResponses) : [];
    const totalModels = modelNames.length;

    // Calculate completion
    // Total slots = cases * models
    // Filled slots = count of (caseId -> modelName) entries in ratings
    let completedEvaluations = 0;

    cases.forEach(c => {
        modelNames.forEach(m => {
            const hasRating = ratings[c.id]?.[m] && Object.keys(ratings[c.id][m]).length > 0;
            if (hasRating) completedEvaluations++;
        });
    });

    const totalEvaluationsNeeded = totalCases * totalModels;
    const percentage = totalEvaluationsNeeded > 0 ? Math.round((completedEvaluations / totalEvaluationsNeeded) * 100) : 0;

    return (
        <div className="main-content">
            <div className="container">
                <h1 className="dashboard-title">Dashboard</h1>

                <div className="stats-grid">
                    <div className="stat-card">
                        <p className="stat-label">Total Cases</p>
                        <p className="stat-value">{totalCases}</p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-label">LLMs Tested</p>
                        <p className="stat-value">{totalModels}</p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-label">Evaluations</p>
                        <p className="stat-value">{completedEvaluations} <span className="text-sm text-gray-500 font-normal">/ {totalEvaluationsNeeded}</span></p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-label">Progress</p>
                        <p className={`stat-value ${percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>{percentage}%</p>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-body">
                        <h2 className="card-title">Case Distribution</h2>
                        <div className="section-grid">
                            <div className="section-card section-card-blue">
                                <p className="section-value section-value-blue">{cases.filter(c => c.section === 'A').length}</p>
                                <p className="section-label">Section A</p>
                            </div>
                            <div className="section-card section-card-purple">
                                <p className="section-value section-value-purple">{cases.filter(c => c.section === 'B').length}</p>
                                <p className="section-label">Section B</p>
                            </div>
                            <div className="section-card section-card-red">
                                <p className="section-value section-value-red">{cases.filter(c => c.section === 'C').length}</p>
                                <p className="section-label">Section C</p>
                            </div>
                            <div className="section-card section-card-green">
                                <p className="section-value section-value-green">{cases.filter(c => c.section === 'D').length}</p>
                                <p className="section-label">Section D</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title">LLMs Under Evaluation</h2>
                        <div className="llm-list">
                            {modelNames.map((llm, idx) => (
                                <div key={llm} className="llm-item">
                                    <div className="llm-info">
                                        <span className="llm-badge">{String.fromCharCode(65 + idx)}</span>
                                        <span className="llm-name">{llm}</span>
                                    </div>
                                    <span className="llm-anon">Anonymized as Model {String.fromCharCode(65 + idx)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
