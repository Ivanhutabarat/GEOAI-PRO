import React, { useRef, useEffect, useState } from 'react';
import { 
  Waves, 
  Settings2, 
  Maximize2, 
  Download, 
  Plus, 
  Minus, 
  Trash2, 
  Zap, 
  BarChart2,
  Box
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export default function SeismicViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gain, setGain] = useState(5);
  const [offset, setOffset] = useState(0);
  const [showWiggles, setShowWiggles] = useState(true);
  const [showDensity, setShowDensity] = useState(true);

  // Generate mock seismic data
  const generateTraces = () => {
    const traces = [];
    for (let i = 0; i < 50; i++) {
        const samples = [];
        for (let j = 0; j < 400; j++) {
            // Simulated seismic wavelet with horizons
            const val = 
                Math.sin(j * 0.1 + i * 0.05) * 0.5 + 
                Math.sin(j * 0.05 + i * 0.1) * 0.3 + 
                (Math.random() - 0.5) * 0.1;
            samples.push(val);
        }
        traces.push(samples);
    }
    return traces;
  };

  const [data] = useState(generateTraces());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const traceSpacing = (canvas.width - 40) / data.length;
    const sampleSpacing = canvas.height / data[0].length;

    data.forEach((trace, i) => {
        const x = 20 + i * traceSpacing;

        // Draw Density
        if (showDensity) {
            trace.forEach((val, j) => {
                const y = j * sampleSpacing;
                const alpha = Math.min(Math.abs(val) * gain, 1);
                ctx.fillStyle = val > 0 ? `rgba(255, 87, 34, ${alpha})` : `rgba(33, 150, 243, ${alpha})`;
                ctx.fillRect(x - traceSpacing / 2, y, traceSpacing, sampleSpacing);
            });
        }

        // Draw Wiggle
        if (showWiggles) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5;
            trace.forEach((val, j) => {
                const y = j * sampleSpacing;
                const wx = x + (val * gain * 5);
                if (j === 0) ctx.moveTo(wx, y);
                else ctx.lineTo(wx, y);
            });
            ctx.stroke();

            // Fill positive lobes
            ctx.beginPath();
            ctx.fillStyle = '#ffffff33';
            trace.forEach((val, j) => {
                const y = j * sampleSpacing;
                const wx = x + (val * gain * 5);
                if (val > 0) {
                    ctx.lineTo(wx, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.lineTo(x, canvas.height);
            ctx.lineTo(x, 0);
            ctx.fill();
        }
    });

    // Draw Grid / Axis
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for(let i=0; i<10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        ctx.fillStyle = '#555555';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${i*100}ms`, 5, y + 10);
    }

  }, [data, gain, showWiggles, showDensity]);

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden">
      {/* Module Toolbar */}
      <div className="h-12 border-b border-[#333333] flex items-center justify-between px-4 bg-[#222222]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Waves size={16} className="text-[#FF5722]" />
            <span className="text-xs font-bold uppercase font-mono tracking-tight text-white">Line_A24.sgy // Seismic Viewer</span>
          </div>
          <div className="h-4 w-px bg-[#333333]"></div>
          <div className="flex items-center gap-2 text-[10px] text-[#888888]">
            <span className="bg-[#333333] px-1.5 py-0.5 rounded text-white font-bold">RAW</span>
            <span>4,200 Traces // 500ms</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-[#333333] rounded overflow-hidden p-0.5 bg-black/40">
            <button 
              onClick={() => setShowWiggles(!showWiggles)}
              className={cn("px-2 py-1 text-[9px] font-bold uppercase transition-colors", showWiggles ? "bg-[#FF5722] text-black" : "text-[#555555]")}
            >
              Wiggles
            </button>
            <button 
              onClick={() => setShowDensity(!showDensity)}
              className={cn("px-2 py-1 text-[9px] font-bold uppercase transition-colors", showDensity ? "bg-[#FF5722] text-black" : "text-[#555555]")}
            >
              Density
            </button>
          </div>
          <div className="h-4 w-px bg-[#333333]"></div>
          <button className="p-2 hover:bg-white/5 text-[#888888] rounded"><Download size={14} /></button>
          <button className="p-2 hover:bg-white/5 text-[#888888] rounded"><Maximize2 size={14} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Visualizer */}
        <div className="flex-1 relative bg-black p-4">
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                className="w-full h-full object-contain cursor-crosshair"
            />
            
            {/* Legend Overlay */}
            <div className="absolute right-8 top-8 bg-black/80 backdrop-blur-md p-4 border border-[#333333] rounded">
                <h4 className="text-[10px] font-bold uppercase text-[#888888] mb-2 tracking-widest">Interpretation Layers</h4>
                <div className="space-y-2">
                    <LegendItem color="bg-red-500" label="Horizon Alpha (Salt)" />
                    <LegendItem color="bg-blue-500" label="Horizon Beta (Gas)" />
                    <LegendItem color="bg-green-500" label="Unconformity G" />
                </div>
            </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-52 border-l border-[#333333] p-4 space-y-6 flex flex-col">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-[#888888] mb-4 flex items-center gap-2">
                <Settings2 size={12} />
                Parameters
            </h4>
            <div className="space-y-4">
                <ControlSlider label="Trace Gain" value={gain} onChange={setGain} min={1} max={20} />
                <ControlSlider label="Display Offset" value={offset} onChange={setOffset} min={-100} max={100} />
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-4">
            <h4 className="text-[10px] font-bold uppercase text-[#888888] mb-4 flex items-center gap-2">
                <Zap size={12} />
                Quick Actions
            </h4>
            <div className="space-y-2">
                <ActionButton icon={Zap} label="Auto-Denoise" color="text-[#FF5722]" />
                <ActionButton icon={BarChart2} label="Spectrum Analysis" />
                <ActionButton icon={Box} label="Generate 3D" />
                <ActionButton icon={Trash2} label="Clear Picking" color="text-red-500" />
            </div>
          </div>

          <div className="p-3 bg-[#FF5722]/5 border border-[#FF5722]/20 rounded">
            <p className="text-[9px] text-[#FF5722] uppercase font-bold mb-1">AI Recommendation</p>
            <p className="text-[10px] text-[#888888] leading-tight">High attenuation detected below 300ms. Suggesting low-pass filter (25Hz cutoff).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", color)}></div>
            <span className="text-xs text-[#AAAAAA]">{label}</span>
        </div>
    );
}

function ControlSlider({ label, value, onChange, min, max }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono uppercase text-[#555555]">
                <span>{label}</span>
                <span className="text-[#FF5722]">{value}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full bg-[#333333] h-1 rounded-full appearance-none cursor-pointer accent-[#FF5722]"
            />
        </div>
    );
}

function ActionButton({ icon: Icon, label, color = "text-[#888888]" }: any) {
    return (
        <button className="w-full flex items-center gap-3 p-2 bg-[#222222] border border-[#333333] rounded hover:border-[#FF5722] group transition-all">
            <Icon size={12} className={cn("transition-colors", color)} />
            <span className="text-[10px] font-bold uppercase text-[#AAAAAA] group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}
