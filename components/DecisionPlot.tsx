import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Forest, DataPoint, CLASS_BG_COLORS, CLASS_COLORS, CLASS_NAMES } from '../types';
import { majorityVote } from '../services/randomForest';
import { BASE_DATA, GRID_CONFIG } from '../constants';

interface DecisionPlotProps {
  forest: Forest;
  testPoint: DataPoint;
}

const DecisionPlot: React.FC<DecisionPlotProps> = ({ forest, testPoint }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  // Calculate scales
  const scales = useMemo(() => {
    const xs = BASE_DATA.map(d => d.inc);
    const ys = BASE_DATA.map(d => d.score);
    const xMin = Math.min(...xs) - GRID_CONFIG.padInc;
    const xMax = Math.max(...xs) + GRID_CONFIG.padInc;
    const yMin = Math.min(...ys) - GRID_CONFIG.padScore;
    const yMax = Math.max(...ys) + GRID_CONFIG.padScore;

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, dimensions.width]);
    // Invert Y for standard coordinate system
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([dimensions.height, 0]);

    return { xScale, yScale, xMin, xMax, yMin, yMax };
  }, [dimensions]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.min(entry.contentRect.width * 0.75, 500) // 4:3 aspect ratio, max height 500
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw Heatmap (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas actual size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const { xScale, yScale, xMin, xMax, yMin, yMax } = scales;
    
    // Grid generation and classification
    const { rows, cols } = GRID_CONFIG;
    const cellWidth = Math.ceil(dimensions.width / cols);
    const cellHeight = Math.ceil(dimensions.height / rows);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Center of the grid cell in data coordinates
        const x = xMin + (xMax - xMin) * (j / (cols - 1));
        const y = yMin + (yMax - yMin) * (i / (rows - 1));
        
        const result = majorityVote(forest, { inc: x, score: y });
        
        ctx.fillStyle = CLASS_BG_COLORS[result.class as keyof typeof CLASS_BG_COLORS];
        
        // Calculate position
        // We manually project here because d3 scales might be sub-pixel precise, but we want grid blocks
        const px = (j / cols) * dimensions.width;
        // Invert Y index for drawing because canvas 0,0 is top-left
        const py = dimensions.height - ((i + 1) / rows) * dimensions.height;

        ctx.fillRect(Math.floor(px), Math.floor(py), cellWidth, cellHeight);
      }
    }

  }, [forest, dimensions, scales]);

  // Draw Axes and Points (SVG)
  const svgContent = useMemo(() => {
    const { xScale, yScale } = scales;
    
    // Generate Ticks
    const xTicks = xScale.ticks(5).map(val => ({ val, pos: xScale(val) }));
    const yTicks = yScale.ticks(5).map(val => ({ val, pos: yScale(val) }));

    return (
      <>
        {/* Grid Lines & Ticks */}
        <g className="text-slate-300">
          {xTicks.map(t => (
            <g key={`x-${t.val}`} transform={`translate(${t.pos}, 0)`}>
              <line y1={0} y2={dimensions.height} stroke="currentColor" strokeDasharray="4" opacity={0.5} />
              <text y={dimensions.height + 15} textAnchor="middle" className="text-xs font-medium fill-slate-500">{t.val}</text>
            </g>
          ))}
          {yTicks.map(t => (
            <g key={`y-${t.val}`} transform={`translate(0, ${t.pos})`}>
              <line x1={0} x2={dimensions.width} stroke="currentColor" strokeDasharray="4" opacity={0.5} />
              <text x={-10} dy={4} textAnchor="end" className="text-xs font-medium fill-slate-500">{t.val}</text>
            </g>
          ))}
        </g>

        {/* Base Data Points */}
        {BASE_DATA.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.inc)}
            cy={yScale(d.score)}
            r={6}
            fill={CLASS_COLORS[d.c as keyof typeof CLASS_COLORS]}
            stroke="white"
            strokeWidth={2}
            className="transition-all duration-300"
          />
        ))}

        {/* Test Point (Crosshair) */}
        <g transform={`translate(${xScale(testPoint.inc)}, ${yScale(testPoint.score)})`} className="transition-transform duration-100 ease-out">
            <line x1={-12} y1={-12} x2={12} y2={12} stroke="black" strokeWidth={3} strokeLinecap="round" className="drop-shadow-sm"/>
            <line x1={12} y1={-12} x2={-12} y2={12} stroke="black" strokeWidth={3} strokeLinecap="round" className="drop-shadow-sm"/>
            <circle r={14} fill="none" stroke="black" strokeWidth={2} strokeDasharray="4" className="animate-spin-slow origin-center"/>
        </g>
      </>
    );
  }, [scales, dimensions, testPoint]);

  return (
    <div className="relative w-full p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
           Decision Regions
           <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Income vs Score</span>
        </h3>
        <div className="flex gap-2 text-xs font-medium">
            {CLASS_NAMES.map((name, i) => (
                <div key={name} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[i as keyof typeof CLASS_COLORS] }}></span>
                    {name}
                </div>
            ))}
        </div>
      </div>

      <div ref={containerRef} className="relative w-full" style={{ height: dimensions.height + 40, paddingLeft: 40, paddingBottom: 20 }}>
        {/* Render Canvas for background heatmap */}
        <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-10 pointer-events-none rounded-lg"
            style={{ width: dimensions.width, height: dimensions.height }}
        />
        
        {/* Render SVG for interactive elements/overlays */}
        <svg 
            width={dimensions.width} 
            height={dimensions.height} 
            className="absolute top-0 left-10 overflow-visible"
        >
            {svgContent}
        </svg>

        {/* Labels */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-500 tracking-wide origin-center">
            Credit Score
        </div>
        <div className="absolute bottom-0 left-10 w-full text-center text-xs font-semibold text-slate-500 tracking-wide">
            Annual Income (k€)
        </div>
      </div>
    </div>
  );
};

export default DecisionPlot;
