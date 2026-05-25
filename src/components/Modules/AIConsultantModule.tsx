import React, { useState } from 'react';
import { Bot, Users, Sparkles, Shield, Cpu, Play, CheckCircle2, Globe2, Activity } from 'lucide-react';
import { useGlobalGeoContext } from '../../context/GlobalGeoContext';

export default function MasterGeoSynthesizer() {
  const [activeTab, setActiveTab] = useState<'roster' | 'parameters' | 'context'>('roster');
  const { rawPayloads } = useGlobalGeoContext();

  const specialists = [
    {
      name: "Dr. Marcus Vance",
      avatar: "GV",
      role: "Senior Geophysicist",
      model: "Inversion Engine // gemini-2.5-flash",
      personality: "Precise, mathematical, focused entirely on anomaly values, RMS residuals, and noise filtration waveforms.",
      focus: "Seismic wiggles interpolation, magnetic dipoles inversion, ground radar hyperbola envelope fitting."
    },
    {
      name: "Dr. Elena Rostova",
      avatar: "GR",
      role: "Senior Structural Geologist",
      model: "Stratigraphy Core // gemini-2.5-flash",
      personality: "Mineral-focused, qualitative, relies on stratigraphic layers, synclines, and bedrock sedimentary matrices.",
      focus: "Horizon picking validation, geochemical ternary sandstone profiling, core mineral analysis."
    },
    {
      name: "Mr. Kenji Takahashi",
      avatar: "KT",
      role: "Lead Resource Economist",
      model: "Financial Model // gemini-2.5-flash",
      personality: "Practical, statistical, risk-avoiding, focused entirely on drilling profitability, environmental costs, and ROI matrices.",
      focus: "Exploration return margins, operating cost models, drilling safety hazard assessments."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold uppercase italic font-mono text-white flex items-center gap-3">
            <Globe2 className="text-[#FF5722]" />
            Master Geo-Synthesizer Core
          </h1>
          <p className="text-xs text-[#888888] font-mono mt-1 uppercase">Global Context Manager & Swarm Persona Cognitive Routing Parameters</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-black/40 border border-[#33] px-3 py-1.5 rounded text-[#888] font-mono">
          <Cpu className="text-green-500 animate-pulse" size={14} />
          <span>SWARM_LINK: ACTIVE (3 NODES)</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          <div className="geo-card">
            <div className="flex justify-between items-center mb-6 border-b border-[#222] pb-3">
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#888] flex items-center gap-1.5">
                <Users size={14} className="text-[#FF5722]" />
                ACTIVE SPECIALIST DEBATERS ROSTER
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('roster')}
                  className={`px-3 py-1 text-[10px] font-mono rounded ${activeTab === 'roster' ? 'bg-[#FF5722] text-black font-bold' : 'bg-white/5 text-[#888]'}`}
                >
                  Roster Profiles
                </button>
                <button 
                  onClick={() => setActiveTab('parameters')}
                  className={`px-3 py-1 text-[10px] font-mono rounded ${activeTab === 'parameters' ? 'bg-[#FF5722] text-black font-bold' : 'bg-white/5 text-[#888]'}`}
                >
                  System Instructions
                </button>
                <button 
                  onClick={() => setActiveTab('context')}
                  className={`px-3 py-1 text-[10px] font-mono rounded border border-[#FF5722]/30 flex items-center gap-1 ${activeTab === 'context' ? 'bg-[#FF5722] text-black font-bold' : 'bg-black text-[#FF5722]'}`}
                >
                  <Activity size={10} />
                  Global Context
                </button>
              </div>
            </div>

            {activeTab === 'roster' && (
              <div className="space-y-4">
                {specialists.map((sp) => (
                  <div key={sp.name} className="p-4 bg-black/40 border border-[#222] rounded-lg relative overflow-hidden flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#111] border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722] font-mono font-black text-sm shrink-0">
                      {sp.avatar}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white">{sp.name}</span>
                        <span className="bg-[#FF5722]/10 border border-[#FF5722]/25 px-2 py-0.5 rounded text-[8.5px] font-mono text-[#FF5722] uppercase font-bold">{sp.role}</span>
                      </div>
                      <p className="text-xs text-[#888888] font-mono">{sp.personality}</p>
                      <div className="text-[10px] text-[#555] font-mono flex items-center gap-1.5 pt-1">
                        <Sparkles size={11} className="text-orange-400" />
                        Focus Area: {sp.focus}
                      </div>
                    </div>
                    <div className="absolute right-3 top-3 text-[8.5px] font-mono text-[#444]">{sp.model}</div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'parameters' && (
              <div className="space-y-4 font-mono text-[11px] leading-relaxed text-[#888] p-2">
                <div className="p-4 bg-black/40 border border-[#222] rounded-lg">
                  <span className="font-bold text-white block mb-2 uppercase text-xs">Dr. Marcus Vance (Geophysics Engine)</span>
                  <pre className="whitespace-pre-wrap text-[10px] bg-black/80 p-3 rounded text-[#aaa] border border-[#111]">
                    {`System instruction: You are acting as Dr. Marcus Vance, a rigorous Senior Geophysicist. 
Analyze all inputs specifically for acoustic wiggles, RMS residual noise levels, dipoles inversions, 
and hyperbola reflectors. Keep replies brief, fully technical, and highly precise.`}
                  </pre>
                </div>

                <div className="p-4 bg-black/40 border border-[#222] rounded-lg">
                  <span className="font-bold text-white block mb-2 uppercase text-xs">Dr. Elena Rostova (Stratigraphy Core)</span>
                  <pre className="whitespace-pre-wrap text-[10px] bg-black/80 p-3 rounded text-[#aaa] border border-[#111]">
                    {`System instruction: You are Dr. Elena Rostova, an elite Structural Geologist.
Correlate geophysics anomalies directly back with stratigraphic rock horizons, syncline formations, 
and sand/sandy-clay core parameters. Focus on mineral classifications.`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-4 font-mono text-[11px] leading-relaxed text-[#888] p-2">
                <p className="text-xs">
                  The Master Consultant reads data across all modules simultaneously to generate synthesized insights (e.g., cross-referencing gravity high anomalies with electrical low-resistivity anomalies to flag sulphide deposits).
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(rawPayloads).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} className="p-3 bg-black/40 border border-[#FF5722]/30 rounded-lg">
                        <span className="font-bold text-[#FF5722] block mb-2 uppercase text-[10px]">{key} <span className="text-[#888]">({value.length} chars)</span></span>
                        <div className="h-20 overflow-y-auto text-[9px] text-[#777] bg-black p-2 border border-[#222] rounded">
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {Object.values(rawPayloads).every(v => !v) && (
                  <div className="p-4 border border-dashed border-[#444] rounded text-center text-gray-500">
                    No global module data ingested yet. Paste raw data into any module to populate the Swarm Context.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cognitive coordination guidelines */}
        <div className="col-span-4 space-y-4">
          <div className="geo-card block">
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#888] mb-4">DYNAMIC COORDINATION</h3>
            <div className="space-y-3 text-xs leading-normal">
              <p className="text-[#888]">
                Master Geo-Synthesizer handles automated orchestration of global inquiries. It evaluates the combined data of all active modules via GlobalGeoContext.
              </p>
              <div className="p-3 bg-white/5 border border-[#333] rounded text-[10px] font-mono text-[#aaa]">
                <span className="font-bold text-[#FF5722] block mb-1">GLOBAL SYNTHESIS INJECTION:</span>
                Raw arrays from Electrical, Gravity, and Spatial modules are injected into Swarm memory automatically.
              </div>
              <div className="flex items-center gap-2 text-xs text-green-500 font-mono">
                <CheckCircle2 size={13} />
                <span>Context Inverted: Global Multi-discipline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
