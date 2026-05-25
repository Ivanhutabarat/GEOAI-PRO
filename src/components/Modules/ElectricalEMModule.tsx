import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Sliders, 
  RefreshCw, 
  BatteryCharging, 
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import UniversalIngestionPort from '../Shared/UniversalIngestionPort';

export default function ElectricalEMModule() {
  const [currentInjection, setCurrentInjection] = useState<number>(500); // in mA
  const [frequency, setFrequency] = useState<number>(32); // in Hz
  const [electrodeSpacing, setElectrodeSpacing] = useState<number>(10); // in m

  // Sounding resistivities state (soundingData)
  const [soundingData, setSoundingData] = useState([
    { spacing: 1.5, resistivity: 145, conductivity: 6.9, phase: -4.5 },
    { spacing: 3, resistivity: 120, conductivity: 8.3, phase: -5.8 },
    { spacing: 5, resistivity: 75, conductivity: 13.3, phase: -8.1 },
    { spacing: 10, resistivity: 38, conductivity: 26.3, phase: -11.2 },
    { spacing: 20, resistivity: 55, conductivity: 18.2, phase: -9.4 },
    { spacing: 40, resistivity: 110, conductivity: 9.1, phase: -6.0 },
    { spacing: 80, resistivity: 240, conductivity: 4.2, phase: -2.8 },
    { spacing: 150, resistivity: 410, conductivity: 2.4, phase: -1.2 },
  ]);

  // Apparent resistivity pseudo-section matrix state
  const [resistivityMatrix, setResistivityMatrix] = useState([
    [120, 115, 130, 140, 145, 150, 240, 290, 310, 180, 140, 120],
    [105, 95, 80, 55, 42, 35, 65, 110, 195, 230, 210, 140],
    [98, 85, 45, 12, 8, 14, 25, 68, 140, 180, 190, 150],
    [115, 98, 70, 35, 15, 22, 48, 92, 160, 210, 240, 180],
    [145, 180, 220, 240, 280, 310, 340, 390, 420, 380, 310, 240]
  ]);

  const gridColumns = 12;
  const gridRows = 5;

  const presetSoundingLog = `# Schlumberger Resistivity Sounding Log
1.5,   210,   4.7,   -3.5
3.0,   185,   5.4,   -4.2
5.0,   130,   7.6,   -6.5
10.0,  50,    20.0,  -9.8
20.0,  25,    40.0,  -12.4
40.0,  70,    14.2,  -8.1
80.0,  190,   5.2,   -4.5
150.0, 330,   3.0,   -2.1`;

  const presetMatrixLog = `# Bedrock Pseudo-Section Target 2D
150, 142, 138, 144, 155, 180, 290, 310, 340, 210, 160, 135
120, 110, 95,  72,  58,  38,  82,  134, 220, 260, 230, 165
110, 98,  62,  18,  12,  28,  42,  88,  162, 210, 220, 180
130, 115, 85,  48,  32,  45,  72,  115, 190, 240, 270, 210
160, 195, 240, 270, 310, 350, 380, 420, 450, 410, 340, 280`;

  const getResistivityColor = (val: number) => {
    if (val < 15) return '#003366';
    if (val < 40) return '#0066cc';
    if (val < 80) return '#009966';
    if (val < 130) return '#66cc99';
    if (val < 200) return '#ffcc00';
    if (val < 300) return '#ff6600';
    return '#cc0033';
  };

  const handleParsedData = (parsedData: any[]) => {
    const parsedSoundings: any[] = [];
    const parsedMatrix: number[][] = [];

    for (let parts of parsedData) {
      if (parts.length >= 12) {
        parsedMatrix.push(parts.slice(0, 12));
      } else if (parts.length >= 2) {
        parsedSoundings.push({
          spacing: parts[0] || 0,
          resistivity: parts[1] || 0,
          conductivity: parts[2] !== undefined ? parts[2] : (parts[1] ? Number((1000 / parts[1]).toFixed(1)) : 0),
          phase: parts[3] !== undefined ? parts[3] : -5.0
        });
      }
    }

    if (parsedSoundings.length > 0) setSoundingData(parsedSoundings);
    if (parsedMatrix.length > 0) {
      const formattedMatrix = parsedMatrix.slice(0, 5).map(row => {
        if (row.length < 12) return [...row, ...Array(12 - row.length).fill(100)];
        return row;
      });
      while (formattedMatrix.length < 5) formattedMatrix.push(Array(12).fill(100));
      setResistivityMatrix(formattedMatrix);
    }
  };

  return (
    <div className="space-y-6 md:p-1 max-w-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold uppercase italic font-mono text-white flex items-center gap-3">
            <Zap className="text-[#FF5722]" />
            Electrical & EM Imaging Array
          </h1>
          <p className="text-xs text-[#888888] font-mono mt-1 uppercase">Wenner & Schlumberger Pseudo-section Profiler // .ohm .txt</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-black/40 border border-[#333] px-3 py-1.5 rounded text-[#888]">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-mono">NVIDIA A100 // ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Ingestion & Setup Sidebar */}
        <div className="col-span-4 space-y-4">
          
          <UniversalIngestionPort 
            moduleName="electrical"
            contextKey="electricalData"
            onParsed={handleParsedData}
            presetLog={presetSoundingLog}
            presetMatrix={presetMatrixLog}
          />


          {/* 2. Range controls */}
          <div className="geo-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#888]">IP Transmitter Setup</h3>
              <BatteryCharging size={16} className="text-[#FF5722]" />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-white mb-1">
                  <span>Current Injection</span>
                  <span className="text-[#FF5722]">{currentInjection} mA</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="2000" 
                  step="50"
                  value={currentInjection} 
                  onChange={(e) => setCurrentInjection(Number(e.target.value))}
                  className="w-full accent-[#FF5722] bg-[#222] h-1 rounded text-[#FF5722]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-white mb-1">
                  <span>EM Operating Frequency</span>
                  <span className="text-[#FF5722]">{frequency} Hz</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="128" 
                  step="0.5"
                  value={frequency} 
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full accent-[#FF5722] bg-[#222] h-1 rounded text-[#FF5722]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-white mb-1">
                  <span>Unit Electrode Spacing (a)</span>
                  <span className="text-[#FF5722]">{electrodeSpacing} m</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  step="1"
                  value={electrodeSpacing} 
                  onChange={(e) => setElectrodeSpacing(Number(e.target.value))}
                  className="w-full accent-[#FF5722] bg-[#222] h-1 rounded text-[#FF5722]"
                />
              </div>
            </div>
          </div>

          {/* 3. Array status */}
          <div className="geo-card block">
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#888] mb-4">Electrode Array Status</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-[#222] pb-1">
                <span className="text-[#555]">ARRAY GEOMETRY</span>
                <span>WENNER D-ALPHA</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-1">
                <span className="text-[#555]">CONTACT IMPEDANCE</span>
                <span className="text-green-500">124 Ω (OPTIMAL)</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-1">
                <span className="text-[#555]">IP PHASE CHARGE</span>
                <span>-8.4 mrad</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-[#555]">RECEIVER V_PP</span>
                <span className="text-yellow-500">22.4 Volts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Dash Panels */}
        <div className="col-span-8 space-y-6">
          {/* Subsurface Resistivity Section map */}
          <div className="geo-card relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                Inverted Bedrock Resistivity Pseudo-Section (State-backed)
              </h3>
              <div className="flex gap-2 text-[9px] font-mono">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#003366] rounded-sm"></span> Brine</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#009966] rounded-sm"></span> Clay</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ffcc00] rounded-sm"></span> Sand</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#cc0033] rounded-sm"></span> Bedrock</div>
              </div>
            </div>

            <div className="w-full bg-[#111111] p-4 border border-[#222] rounded overflow-hidden">
              <div className="grid grid-cols-12 gap-1 bg-[#151515] p-2 rounded">
                {resistivityMatrix.map((row, rIdx) => (
                  row.map((val, cIdx) => (
                    <div 
                      key={`${rIdx}-${cIdx}`}
                      style={{ backgroundColor: getResistivityColor(val + (currentInjection / 150)) }}
                      className="aspect-video relative rounded-sm group cursor-pointer transition-transform hover:scale-105"
                    >
                      <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 bg-black border border-[#333] text-[9px] text-[#fff] px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap z-30 font-mono">
                        N:{(rIdx+1)* electrodeSpacing}m, V:{val}Ωm
                      </span>
                    </div>
                  ))
                ))}
              </div>

              <div className="flex justify-between text-[9px] font-mono text-[#555] mt-2 px-1">
                <span>CHAINAGE 0.0m</span>
                <span>CENTRAL SCAN AREA</span>
                <span>CHAINAGE {gridColumns * electrodeSpacing}m</span>
              </div>
            </div>
          </div>

          {/* VES sounding curve graph */}
          <div className="geo-card">
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-[#888] mb-4">Schlumberger VES sounding profile (Real-time curve plotter)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={soundingData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="spacing" label={{ value: 'AB/2 spacing (m)', position: 'insideBottom', offset: -5, fill: '#555', fontSize: 9 }} stroke="#555" fontSize={10} />
                  <YAxis scale="log" domain={['auto', 'auto']} label={{ value: 'Apparent Resistivity (Ω-m)', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 9 }} stroke="#555" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                  <Legend verticalAlign="top" height={24} />
                  <Line type="monotone" dataKey="resistivity" stroke="#FF5722" activeDot={{ r: 6 }} name="Apparent Resistivity (Ω-m)" strokeWidth={2} />
                  <Line type="monotone" dataKey="phase" stroke="#00B4FF" name="Chargeability Phase (mrad)" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
