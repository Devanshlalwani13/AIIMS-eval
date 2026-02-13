
import React, { useState } from 'react';
import { Case } from '@/types';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';

interface CaseViewerProps {
    caseData: Case;
}

export function CaseViewer({ caseData }: CaseViewerProps) {
    const [imageZoom, setImageZoom] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = caseData.images || [];
    const hasMultipleImages = images.length > 1;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="card">
            <div className="card-body">
                <div className="mb-4">
                    <span className="tag tag-blue">{caseData.id}</span>
                    <span className="tag tag-purple">{caseData.stage}</span>
                    <span className="tag tag-gray">{caseData.subsection}</span>
                </div>

                <h2 className="case-title">{caseData.title}</h2>

                <div className="case-grid">
                    <div>
                        <div className="mb-4">
                            <h3 className="section-title">Clinical History</h3>
                            <p className="section-content">{caseData.clinical}</p>
                        </div>

                        <div className="mb-4">
                            <h3 className="section-title">Histopathology</h3>
                            <p className="section-content">{caseData.histology}</p>
                        </div>

                        <div>
                            <h3 className="section-title">Immunohistochemistry</h3>
                            <p className="ihc-content">{caseData.ihc}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="section-title">Microscopy Images ({images.length})</h3>
                        <div
                            className={`image-container ${imageZoom ? 'image-fullscreen' : ''}`}
                            onClick={() => setImageZoom(!imageZoom)}
                        >
                            {images.length > 0 ? (
                                <>
                                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={images[currentImageIndex]}
                                            alt={`Slide ${currentImageIndex + 1}`}
                                            className="case-image object-contain w-full h-full max-h-[500px]"
                                        />

                                        {imageZoom && (
                                            <button
                                                className="fixed top-6 right-6 bg-white/80 p-2 rounded-full hover:bg-white text-black z-[60] shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageZoom(false);
                                                }}
                                            >
                                                <X size={24} />
                                            </button>
                                        )}

                                        {!imageZoom && (
                                            <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded">
                                                <ZoomIn size={16} />
                                            </div>
                                        )}
                                    </div>

                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full hover:bg-white text-black"
                                                onClick={prevImage}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full hover:bg-white text-black"
                                                onClick={nextImage}
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                                                {currentImageIndex + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="case-image flex items-center justify-center bg-gray-100 text-gray-400 h-64">
                                    No Images Available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
