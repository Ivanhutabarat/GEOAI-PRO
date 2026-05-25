import React, { useState } from 'react';
import { 
  Activity, 
  Settings2, 
  Download, 
  BarChart, 
  Ruler, 
  Database,
  Search,
  Filter,
  Maximize2,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../../lib/utils';

import UniversalIngestionPort from '../Shared/UniversalIngestionPort';

// Mock Well Data
const generateLogData = () => {
    const data = [];
    for (let i = 0; i < 500; i++) {
        const depth = 2000 + i * 2;
        data.push({
            depth,
            gamma: 20 + Math.random() * 80 + (i > 100 && i < 200 ? 50 : 0),
            resistivity: Math.log10(1 + Math.random() * 10 + (i > 150 ? 5 : 0)),
            density: 2.1 + Math.random() * 0.4 + (i > 300 ? -0.2 : 0),
            neutron: 0.1 + Math.random() * 0.3
        });
    }
    return data;
};

export default function WellLoggingModule() {
  const [data] = useState(generateLogData());
  const [selectedLogs, setSelectedLogs] = useState(['gamma', 'resistivity', 'density']);

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden">
        {/* Module Toolbar */}
        <div className="h-12 border-b border-[#333333] flex items-center justify-between px-4 bg-[#222222]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#03A9F4]" />
                    <span className="text-xs font-bold uppercase font-mono tracking-tight text-white">Exploration_Well_01.las // Well Log View</span>
                </div>
                <div className="h-4 w-px bg-[#333333]"></div>
                <div className="flex items-center gap-2 text-[10px] text-[#888888]">
                    <span className="bg-[#03A9F4] px-1.5 py-0.5 rounded text-white font-bold">NORMALIZED</span>
                    <span>MD: 2,000m - 3,000m // STEP: 2m</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#888888] hover:text-white">
                    <Filter size={12} />
                    Auto-Alias
                </button>
                <div className="h-4 w-px bg-[#333333]"></div>
                <button className="p-2 hover:bg-white/5 text-[#888888] rounded"><Download size={14} /></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Log Track Selector */}
            <div className="w-48 border-r border-[#333333] p-4 bg-[#111111]/50 space-y-4">
                <UniversalIngestionPort 
                  moduleName="wellLoggingData" 
                  contextKey="wellLoggingData" 
                  onParsed={(p) => console.log('parsed', p)} 
                />
                
                <h4 className="text-[10px] font-bold uppercase text-[#555555] tracking-widest mb-4 mt-6">Available Curves</h4>
                <div className="space-y-1">
                    <CurveToggle label="Gamma Ray (GR)" color="#FF5722" active={selectedLogs.includes('gamma')} onClick={() => toggleLog('gamma')} />
                    <CurveToggle label="Resistivity (RES)" color="#4CAF50" active={selectedLogs.includes('resistivity')} onClick={() => toggleLog('resistivity')} />
                    <CurveToggle label="Density (RHOB)" color="#03A9F4" active={selectedLogs.includes('density')} onClick={() => toggleLog('density')} />
                    <CurveToggle label="Neutron (NPHI)" color="#FFEB3B" active={selectedLogs.includes('neutron')} onClick={() => toggleLog('neutron')} />
                    <CurveToggle label="Sonic (DT)" color="#9C27B0" active={false} />
                    <CurveToggle label="Caliper (CAL)" color="#607D8B" active={false} />
                </div>

                <div className="pt-6">
                    <h4 className="text-[10px] font-bold uppercase text-[#555555] tracking-widest mb-4">Depth Control</h4>
                    <div className="space-y-4">
                        <div className="bg-black/20 border border-[#333333] p-2 rounded">
                            <span className="text-[10px] text-[#555555] block mb-1">Center Depth</span>
                            <span className="text-xl font-mono font-bold text-white tracking-tighter">2,450.0m</span>
                        </div>
                        <input type="range" className="w-full accent-[#03A9F4]" />
                    </div>
                </div>
            </div>

            {/* Log Display */}
            <div className="flex-1 bg-black p-4 flex gap-4 overflow-x-auto relative">
                {/* Track 1: Gamma Ray */}
                {selectedLogs.includes('gamma') && (
                    <LogTrack label="Gamma Ray" unit="GAPI" color="#FF5722">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                <XAxis type="number" hide domain={[0, 150]} />
                                <YAxis dataKey="depth" type="number" hide domain={['auto', 'auto']} reversed />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="gamma" stroke="#FF5722" fill="#FF572233" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </LogTrack>
                )}

                {/* Track 2: Resistivity */}
                {selectedLogs.includes('resistivity') && (
                    <LogTrack label="Resistivity" unit="OHMM" color="#4CAF50">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                <XAxis type="number" scale="log" hide domain={[0.1, 100]} />
                                <YAxis dataKey="depth" type="number" hide domain={['auto', 'auto']} reversed />
                                <Line type="monotone" dataKey="resistivity" stroke="#4CAF50" dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </LogTrack>
                )}

                {/* Track 3: Density */}
                {selectedLogs.includes('density') && (
                    <LogTrack label="Density" unit="G/CC" color="#03A9F4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                <XAxis type="number" hide domain={[2.0, 3.0]} />
                                <YAxis dataKey="depth" type="number" hide domain={['auto', 'auto']} reversed />
                                <Line type="monotone" dataKey="density" stroke="#03A9F4" dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </LogTrack>
                )}
            </div>

            {/* Interpretation Pane */}
            <div className="w-64 border-l border-[#333333] p-4 bg-[#111111]/50 space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-[#888888] mb-4 flex items-center gap-2">
                    <BarChart size={12} className="text-[#03A9F4]" />
                    Auto-Lithology
                </h4>
                <div className="space-y-2">
                    <LithologyZone color="bg-yellow-500" label="Sandstone" depth="2400-2440m" confidence={92} />
                    <LithologyZone color="bg-gray-500" label="Shale" depth="2440-2480m" confidence={88} />
                    <LithologyZone color="bg-blue-300" label="Carbonate" depth="2480-2550m" confidence={75} />
                </div>

                <div className="pt-6">
                    <h4 className="text-[10px] font-bold uppercase text-[#888888] mb-4 flex items-center gap-2">
                        <Search size={12} className="text-[#03A9F4]" />
                        Fluid Identification
                    </h4>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Crossover Detected</p>
                        <p className="text-[11px] text-[#888888] leading-tight">Potential GAS show indicated by NPHI-RHOB separation at 2450m.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  function toggleLog(log: string) {
    if (selectedLogs.includes(log)) {
        setSelectedLogs(selectedLogs.filter(l => l !== log));
    } else {
        setSelectedLogs([...selectedLogs, log]);
    }
  }
}

function CurveToggle({ label, color, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-2 rounded text-[11px] font-bold transition-all border",
                active ? "bg-[#222] border-[#333] text-white" : "border-transparent text-[#555] hover:text-[#888]"
            )}
        >
            <div className="flex items-center gap-2">
                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span>{label}</span>
            </div>
            {active && <div className="w-1 h-1 rounded-full bg-[#03A9F4]" />}
        </button>
    );
}

function LogTrack({ label, unit, color, children }: any) {
    return (
        <div className="w-48 h-full flex flex-col border border-[#222]">
            <div className="p-2 border-b border-[#222] text-center bg-[#111]">
                <span className="text-[10px] font-bold text-white block uppercase tracking-tighter">{label}</span>
                <span className="text-[9px] text-[#555] block">{unit}</span>
            </div>
            <div className="flex-1 relative">
                {children}
            </div>
        </div>
    );
}

function LithologyZone({ color, label, depth, confidence }: any) {
    return (
        <div className="p-3 bg-black/20 border border-[#222] rounded flex items-center gap-3">
            <div className={cn("w-1.5 h-8 rounded-full", color)}></div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold text-[#AAAAAA]">{label}</span>
                    <span className="text-[10px] text-green-500 font-mono">{confidence}%</span>
                </div>
                <span className="text-[10px] text-[#555] font-mono">{depth}</span>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111] border border-[#333] p-2 text-[10px] font-mono text-white">
                <p>DEPTH: {payload[0].payload.depth}m</p>
                <p className="text-[#FF5722]">VAL: {payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};
