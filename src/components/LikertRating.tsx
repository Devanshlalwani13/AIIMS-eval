
import React, { useState, useRef } from 'react';
import { EVAL_CRITERIA } from '@/types';

// Likert scale definition matching CSS
const LIKERT_SCALE = [
    { value: -2, label: "-2", colorClass: "likert-btn-red" },
    { value: -1, label: "-1", colorClass: "likert-btn-orange" },
    { value: 0, label: "0", colorClass: "likert-btn-gray" },
    { value: 1, label: "1", colorClass: "likert-btn-lime" },
    { value: 2, label: "2", colorClass: "likert-btn-green" }
];

interface LikertRatingProps {
    criterion: typeof EVAL_CRITERIA[0];
    value: number;
    onChange: (key: string, value: number) => void;
}

export function LikertRating({ criterion, value, onChange }: LikertRatingProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowTooltip(false);
        }, 100);
    };

    return (
        <div className={`likert-row ${criterion.highlighted ? 'highlighted' : ''}`}>
            <div
                className="likert-label tooltip-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {criterion.label}
                {showTooltip && (
                    <div className="tooltip">
                        <p>{criterion.description}</p>
                    </div>
                )}
            </div>
            <div className="likert-buttons">
                {LIKERT_SCALE.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(criterion.key, option.value)}
                        className={`likert-btn ${value === option.value
                                ? `${option.colorClass} selected`
                                : 'likert-btn-default'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
