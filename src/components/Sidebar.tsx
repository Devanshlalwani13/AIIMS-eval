
import React from 'react';
import { Plus, FileText, BarChart2, Building } from 'lucide-react';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1>CONTEXT-AI-PATH</h1>
                <p>LLM Validation Platform</p>
            </div>

            <nav className="sidebar-nav">
                <button
                    onClick={() => setCurrentView('contribute')}
                    className={`nav-btn ${currentView === 'contribute' ? 'active' : ''}`}
                >
                    <span className="nav-btn-icon"><Plus size={18} /></span>
                    <span>Contribute</span>
                </button>

                <button
                    onClick={() => setCurrentView('review')}
                    className={`nav-btn ${currentView === 'review' ? 'active' : ''}`}
                >
                    <span className="nav-btn-icon"><FileText size={18} /></span>
                    <span>Review</span>
                </button>

                <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                >
                    <span className="nav-btn-icon"><BarChart2 size={18} /></span>
                    <span>Dashboard</span>
                </button>

                <button
                    onClick={() => setCurrentView('organization')}
                    className={`nav-btn ${currentView === 'organization' ? 'active' : ''}`}
                >
                    <span className="nav-btn-icon"><Building size={18} /></span>
                    <span>Organization</span>
                </button>
            </nav>
        </div>
    );
}
