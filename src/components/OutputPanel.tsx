import React, { useState } from 'react';
import { LikertRating } from './LikertRating';
import { EVAL_CRITERIA } from '@/types';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OutputPanelProps {
    label: string;                                   // e.g. "Output 1"
    response: string;
    currentRatings: Record<string, number>;
    onRatingChange: (criterion: string, value: number) => void;
    comment: string;
    onCommentChange: (value: string) => void;
}

export function OutputPanel({ label, response, currentRatings, onRatingChange, comment, onCommentChange }: OutputPanelProps) {
    const [open, setOpen] = useState(false);          // collapsed by default

    const scored = EVAL_CRITERIA.filter(c => currentRatings[c.key] !== undefined).length;
    const total = EVAL_CRITERIA.length;
    const complete = scored === total;

    return (
        <div className="card output-panel">
            <button
                type="button"
                className="output-toggle"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span className="output-toggle-left">
                    {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span className="output-label">{label}</span>
                </span>
                <span className={`output-badge ${complete ? 'output-badge-done' : scored > 0 ? 'output-badge-partial' : ''}`}>
                    {complete ? <><CheckCircle2 size={14} /> Scored</> : `${scored}/${total} scored`}
                </span>
            </button>

            {open && (
                <div className="card-body">
                    <div className="response-box">
                        <p className="response-text">{response || '(no response)'}</p>
                    </div>

                    <div className="scale-legend">
                        <span>Scale:</span>
                        <div className="scale-item"><span className="scale-dot scale-dot-red"></span><span>-2 Strong disagree</span></div>
                        <div className="scale-item"><span className="scale-dot scale-dot-gray"></span><span>0 Neutral</span></div>
                        <div className="scale-item"><span className="scale-dot scale-dot-green"></span><span>+2 Strong agree</span></div>
                    </div>

                    <div>
                        {EVAL_CRITERIA.map((criterion) => (
                            <LikertRating
                                key={criterion.key}
                                criterion={criterion}
                                value={currentRatings[criterion.key]}
                                onChange={onRatingChange}
                            />
                        ))}
                    </div>

                    <div className="comments-section">
                        <label className="comments-label">Additional Comments</label>
                        <textarea
                            value={comment}
                            onChange={(e) => onCommentChange(e.target.value)}
                            placeholder="Any specific observations about this response..."
                            className="comments-textarea"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
