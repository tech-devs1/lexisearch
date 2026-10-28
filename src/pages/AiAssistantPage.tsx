import React from 'react';
import { Sparkles } from 'lucide-react';
import { LegalAiPanel } from '../components/ai/LegalAiPanel';
import { useCase } from '../context/CaseContext';

export const AiAssistantPage: React.FC = () => {
  const { activeCase, evidenceList } = useCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">
            Evidentiary AI Question Answering & Synthesis
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Active Case: <span className="font-semibold text-gray-900 font-mono">{activeCase?.caseNumber}</span> — {activeCase?.title} ({evidenceList.length} indexed files)
        </p>
      </div>

      <LegalAiPanel />
    </div>
  );
};
