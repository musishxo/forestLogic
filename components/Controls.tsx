import React from 'react';
import { RefreshCcw, TreeDeciduous, Layers, Activity, CreditCard } from 'lucide-react';

interface ControlsProps {
  nTrees: number;
  setNTrees: (n: number) => void;
  seed: number;
  setSeed: (n: number) => void;
  depth: number;
  setDepth: (n: number) => void;
  testInc: number;
  setTestInc: (n: number) => void;
  testScore: number;
  setTestScore: (n: number) => void;
}

const SliderControl = ({ 
  label, 
  value, 
  setValue, 
  min, 
  max, 
  step = 1,
  icon: Icon
}: { 
  label: string, 
  value: number, 
  setValue: (n: number) => void, 
  min: number, 
  max: number, 
  step?: number,
  icon?: React.ElementType 
}) => (
  <div className="mb-5 group">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
        {label}
      </label>
      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
    />
  </div>
);

const Controls: React.FC<ControlsProps> = ({
  nTrees, setNTrees,
  seed, setSeed,
  depth, setDepth,
  testInc, setTestInc,
  testScore, setTestScore
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Configuration</h2>
      
      <div className="space-y-6">
        <div>
           <div className="flex items-center justify-between mb-4">
             <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
               <RefreshCcw size={16} className="text-slate-400" />
               Random Seed
             </label>
             <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-20 px-2 py-1 text-right text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
             />
           </div>

           <SliderControl 
              label="Number of Trees" 
              value={nTrees} 
              setValue={setNTrees} 
              min={1} 
              max={300} 
              icon={TreeDeciduous}
            />
           
           <SliderControl 
              label="Surrogate Depth" 
              value={depth} 
              setValue={setDepth} 
              min={1} 
              max={5} 
              icon={Layers}
            />
        </div>

        <div className="pt-4 border-t border-slate-100">
           <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Test Applicant</h3>
           
           <SliderControl 
              label="Annual Income (k€)" 
              value={testInc} 
              setValue={setTestInc} 
              min={10} 
              max={120} 
              icon={Activity}
            />
           
           <SliderControl 
              label="Credit Score" 
              value={testScore} 
              setValue={setTestScore} 
              min={300} 
              max={850} 
              icon={CreditCard}
            />
        </div>
      </div>
    </div>
  );
};

export default Controls;
