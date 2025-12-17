import React, { useMemo } from 'react';
import { VoteResult, CLASS_NAMES, CLASS_COLORS, Node } from '../types';
import { getSurrogateRules } from '../services/randomForest';
import { CheckCircle2, AlertCircle, XCircle, FileText, BarChart3 } from 'lucide-react';

interface AnalysisPanelProps {
  voteResult: VoteResult;
  surrogateRoot: Node;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ voteResult, surrogateRoot }) => {
  
  const rules = useMemo(() => {
    return getSurrogateRules(surrogateRoot).map(r => r.replace(/ AND $/, ''));
  }, [surrogateRoot]);

  const totalVotes = (Object.values(voteResult.votes) as number[]).reduce((a, b) => a + b, 0);
  
  const getIcon = (cls: number) => {
    switch(cls) {
        case 0: return <CheckCircle2 className="text-emerald-500" size={24} />;
        case 1: return <AlertCircle className="text-amber-500" size={24} />;
        case 2: return <XCircle className="text-red-500" size={24} />;
        default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Voting Result Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-slate-400" size={20} />
            Forest Voting
        </h3>
        
        <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
                <div className="text-sm text-slate-500 mb-1">Final Decision</div>
                <div className="text-2xl font-bold flex items-center gap-2" style={{ color: CLASS_COLORS[voteResult.class as keyof typeof CLASS_COLORS] }}>
                    {getIcon(voteResult.class)}
                    {CLASS_NAMES[voteResult.class]}
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm text-slate-500 mb-1">Confidence</div>
                <div className="text-2xl font-bold text-slate-700">
                    {totalVotes > 0 ? Math.round(((voteResult.votes[voteResult.class] || 0) / totalVotes) * 100) : 0}%
                </div>
            </div>
        </div>

        <div className="space-y-3">
            {CLASS_NAMES.map((name, idx) => {
                const votes = voteResult.votes[idx] || 0;
                const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                return (
                    <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">{name}</span>
                            <span className="text-slate-500">{votes} votes ({Math.round(percent)}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ 
                                    width: `${percent}%`, 
                                    backgroundColor: CLASS_COLORS[idx as keyof typeof CLASS_COLORS] 
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Surrogate Rules Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="text-slate-400" size={20} />
            Surrogate Rules
        </h3>
        <p className="text-xs text-slate-500 mb-4">
            A single "surrogate" decision tree is trained to approximate the complex Random Forest, producing human-readable logic rules.
        </p>
        
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 font-mono text-xs text-slate-700 leading-relaxed overflow-x-auto">
            {rules.map((rule, i) => (
                <div key={i} className="mb-2 last:mb-0 flex gap-2">
                    <span className="text-indigo-400 select-none">•</span>
                    <span>
                        {rule.split(' ').map((word, wIdx) => {
                           if (['IF', 'THEN', 'AND'].includes(word)) return <span key={wIdx} className="font-bold text-indigo-600">{word} </span>;
                           if (['class', '='].includes(word)) return <span key={wIdx} className="text-slate-400">{word} </span>;
                           if (CLASS_NAMES.map(c => String(CLASS_NAMES.indexOf(c))).includes(word)) {
                               return <span key={wIdx} className="font-bold" style={{ color: CLASS_COLORS[parseInt(word) as keyof typeof CLASS_COLORS] }}>{CLASS_NAMES[parseInt(word)]}</span>;
                           }
                           return <span key={wIdx}>{word} </span>;
                        })}
                    </span>
                </div>
            ))}
            {rules.length === 0 && <div className="text-slate-400 italic">No rules generated.</div>}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;