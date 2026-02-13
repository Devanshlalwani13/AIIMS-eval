
import React, { useState } from 'react';
import { LikertRating } from './LikertRating';
import { EVAL_CRITERIA } from '@/types';
import { Info } from 'lucide-react';

interface ResponseEvaluatorProps {
    modelName: string;
    response: string;
    currentRatings: Record<string, number>;
    onRatingChange: (criterion: string, value: number) => void;
}

export function ResponseEvaluator({ modelName, response, currentRatings, onRatingChange }: ResponseEvaluatorProps) {
    const [comment, setComment] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    return (
        <div className="card">
            <div className="card-header">
                <div className="evaluator-header">
                    <h3 className="evaluator-title">Evaluate: {modelName}</h3>
                    <button className="info-btn" title="Info"><Info size={16} /></button>
                </div>

                <div className="response-box">
                    <p className="response-text">{response}</p>
                </div>

                <div className="upload-section">
                    <label className="upload-label">Upload supporting image (optional)</label>
                    <div className="upload-row">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setUploadedImage(URL.createObjectURL(e.target.files[0]));
                                }
                            }}
                            className="upload-input"
                        />
                        {uploadedImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={uploadedImage} alt="Uploaded" className="upload-preview" />
                        )}
                    </div>
                </div>
            </div>

            <div className="card-body">
                <div className="scale-legend">
                    <span>Scale:</span>
                    <div className="scale-item">
                        <span className="scale-dot scale-dot-red"></span>
                        <span>-2 Strong disagree</span>
                    </div>
                    <div className="scale-item">
                        <span className="scale-dot scale-dot-gray"></span>
                        <span>0 Neutral</span>
                    </div>
                    <div className="scale-item">
                        <span className="scale-dot scale-dot-green"></span>
                        <span>+2 Strong agree</span>
                    </div>
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
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Any specific observations about this response..."
                        className="comments-textarea"
                    />
                </div>
            </div>
        </div>
    );
}
