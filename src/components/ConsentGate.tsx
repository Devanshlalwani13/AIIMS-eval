'use client';

import React, { useState } from 'react';
import { Rater } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ConsentGate({ onConsent }: { onConsent: (rater: Rater) => void }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [agreed, setAgreed] = useState(false);

    const emailValid = EMAIL_RE.test(email.trim());
    const canBegin = emailValid && agreed;

    const handleBegin = () => {
        if (!canBegin) return;
        const rater: Rater = {
            email: email.trim(),
            name: name.trim() || undefined,
            consentedAt: new Date().toISOString(),
        };
        localStorage.setItem('hpla_rater', JSON.stringify(rater));
        onConsent(rater);
    };

    return (
        <div className="consent-overlay">
            <div className="consent-card">
                <div className="card-header">
                    <h1 className="consent-title">Turo-HPLA-100 Histopathology LLM Evaluation</h1>
                </div>
                <div className="card-body">
                    <div className="consent-statement">
                        <p>
                            You are invited to take part in a research study as a qualified pathologist
                            rating anonymized AI-generated reports against a histopathology benchmark
                            (Turo-HPLA-100). Participation is entirely <strong>voluntary</strong> and you may
                            stop at any time without consequence.
                        </p>
                        <p>
                            Your ratings, comments, and email address will be collected and used in
                            <strong> anonymized, aggregate form</strong> for an academic benchmark study
                            (intended for ASDP 2026). Your email is used only to attribute and
                            de-duplicate submissions and will not be published.
                        </p>
                        <p>
                            <strong>No patient-identifiable data</strong> is involved. All cases are
                            fully de-identified.
                        </p>
                    </div>

                    <div className="consent-field">
                        <label className="consent-label" htmlFor="rater-email">
                            Email <span className="consent-required">*</span>
                        </label>
                        <input
                            id="rater-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@institution.org"
                            className={`consent-input ${email && !emailValid ? 'consent-input-error' : ''}`}
                        />
                        {email && !emailValid && (
                            <p className="consent-error-text">Please enter a valid email address.</p>
                        )}
                    </div>

                    <div className="consent-field">
                        <label className="consent-label" htmlFor="rater-name">Full name (optional)</label>
                        <input
                            id="rater-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Jane Doe"
                            className="consent-input"
                        />
                    </div>

                    <label className="consent-checkbox-row">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="consent-checkbox"
                        />
                        <span>I have read and consent to the above.</span>
                    </label>

                    <button onClick={handleBegin} disabled={!canBegin} className="consent-begin-btn">
                        Begin evaluation
                    </button>

                    <div className="consent-footer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/turocrates.png" alt="Turocrates.ai" className="consent-logo" />
                    </div>
                </div>
            </div>
        </div>
    );
}
