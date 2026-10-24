import React from 'react';
import { Sparkles, Scale, AlertCircle } from 'lucide-react';
import { LegalAiPanel } from '../components/ai/LegalAiPanel';
import { useCase } from '../context/CaseContext';

export const AiAssistantPage: React.FC = () => {
  const { activeCase, evidenceList } = useCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-4 h-4" />
          </span>
          <h1 className="text-xl lg:text-2xl font-black text-slate-100">
            Evidentiary AI Question Answering & Synthesis
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Active Case: <span className="font-semibold text-amber-400">{activeCase?.caseNumber}</span> — {activeCase?.title} ({evidenceList.length} indexed files)
        </p>
      </div>

      <LegalAiPanel />
    </div>
  );
};
