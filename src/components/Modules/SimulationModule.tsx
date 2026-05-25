import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  MessageSquare, 
  Zap, 
  Bot, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Agent, SimulationEvent } from '../../types';
import { cn } from '../../lib/utils';

export default function SimulationModule() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Community_Rep', role: 'Social Impact', personality: 'Skeptical of mining, values water safety.', memory: [], status: 'idle' },
    { id: '2', name: 'Seismic_Sensor_Grid', role: 'Hardware Monitor', personality: 'Objective, reporting microseismic frequencies.', memory: [], status: 'active' },
    { id: '3', name: 'Env_Agency', role: 'Regulation Standards', personality: 'Strict, focused on dynamic soil subsidence.', memory: [], status: 'idle' },
  ]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [predictionGoal, setPredictionGoal] = useState('Predict soil stability impact after 6 months of continuous borehole extraction.');
  const [simulationReport, setSimulationReport] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const addEvent = (content: string, senderId: string) => {
    const newEvent: SimulationEvent = {
        id: Math.random().toString(),
        timestamp: new Date(),
        senderId,
        targetId: 'world',
        content: content
    };
    setEvents(prev => [...prev, newEvent]);
  };

  // Run automated stakeholder ticks representing environmental risk models
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * agents.length);
      const actor = agents[idx];

      setAgents(prev => prev.map((a, i) => i === idx ? { ...a, status: 'interacting' } : { ...a, status: 'idle' }));

      // High-fidelity local simulation scripts representing AI consensus
      const mockStatements: Record<string, string[]> = {
        '1': [
          "Borehole drilling vibratory noise is causing micro-displacements on boundary walls.",
          "Local aqueduct samples display subtle turbidity fluctuations. Recommend a clay barrier check.",
          "Local water pressures show negative gradient indicators. Require mud-casing logs."
        ],
        '2': [
          "Acoustic frequency scanner logs a brief seismic burst at 24Hz in depth strata 4.",
          "Displacement monitors report 0.024mm tilt boundary in Sector 4 north segment.",
          "Dynamic signal damping triggers normal. Subsurface seismic activity aligned."
        ],
        '3': [
          "Regulation code calls for instant casing pressure checks upon 0.02mm displacements.",
          "Subsoil stress parameters exceeding standard thresholds in Sector 2. Review borehole integrity.",
          "Carbonate leaching ratios represent stable soil limits. Operating permit remains active."
        ]
      };

      const options = mockStatements[actor.id] || ["Status checks completed."];
      const selectedText = options[Math.floor(Math.random() * options.length)];
      
      addEvent(selectedText, actor.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, agents]);

  const generateFinalReport = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setSimulationReport(`### STAKEHOLDER SWARM prediction REPORT
**Goal:** ${predictionGoal}
**Analyzed Consensus Cycles:** ${events.length} iterations

#### 1. SEISMIC SURFACE SOUNDNESS
Hardware arrays logged micro-vibrations at 24Hz, bounded by normal safety levels. However, continuous drawdown may trigger 0.05mm structural slip anomalies if casing pressures lack constant regulatory feedback.

#### 2. HYDROGELOGICAL INTEGRITY
No direct aquifer communication faults were identified. Sandstone lithologies provide optimal filtering capacity against solvent leaching.

#### 3. RECOMMENDATIONS & ROI BOUNDARIES
- Install dynamic mud casings down to sand contacts at 450m.
- Retain continuous 24Hz acoustic dampening shields on boreholes STN-12.`);
      setIsCompiling(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-6 bg-[#161617] p-5 border border-[#333] rounded-lg">
      <div className="flex justify-between items-start border-b border-[#222] pb-3">
        <div>
          <h1 className="text-xl font-bold uppercase italic font-mono text-white flex items-center gap-3">
            <Users className="text-[#FF5722]" />
            Swarm Stakeholder Sandbox
          </h1>
          <p className="text-xs text-[#888888] font-mono mt-0.5 uppercase">Simulation Environment for Environmental & Civil Consents</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "px-6 py-2 rounded text-xs font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer text-black",
              isRunning ? "bg-red-500/15 border border-red-500 text-red-500 hover:bg-red-500/20" : "bg-[#FF5722] hover:bg-[#ff7043]"
            )}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Freeze consensus' : 'Conduct Debate'}
          </button>
          <button 
            onClick={() => {setEvents([]); setSimulationReport(null);}}
            className="px-4 py-2 border border-[#333] text-[#888] rounded hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Stakeholder memory cards */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
          <div className="geo-card h-full flex flex-col overflow-y-auto pr-1">
            <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2 text-[10px] font-mono text-[#555] font-bold">
              <span>SPECIALIST BOARD</span>
              <span>STANDBY</span>
            </div>
            <div className="space-y-3 flex-1">
              {agents.map(agent => (
                <div key={agent.id} className={cn(
                  "p-3 rounded border text-xs bg-black/20 transition-all",
                  agent.status === 'interacting' ? "border-[#FF5722] bg-[#FF5722]/5" : "border-[#222]"
                )}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{agent.name}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      agent.status === 'interacting' ? "bg-[#FF5722] animate-pulse" : "bg-[#333]"
                    )}></span>
                  </div>
                  <span className="text-[9px] text-[#FF5722] font-mono uppercase font-semibold">{agent.role}</span>
                  <p className="text-[10px] text-[#666] mt-2 italic leading-tight">{agent.personality}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time simulation log feeds */}
        <div className="col-span-12 md:col-span-5 flex flex-col overflow-hidden bg-black/40 border border-[#222] rounded-lg">
          <div className="p-3 bg-[#111] border-b border-[#222] flex justify-between items-center text-[10px] font-mono text-[#555] font-bold">
            <span>LIVE INTERACTIVE FEED</span>
            <span>{events.length} EVENTS RECORDED</span>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          >
            <AnimatePresence initial={false}>
              {events.map((event, i) => {
                const sender = agents.find(a => a.id === event.senderId);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 text-xs"
                  >
                    <div className="w-5 h-5 rounded bg-[#222] border border-[#333] flex items-center justify-center shrink-0 text-[10px] text-[#FF5722] font-mono font-bold">
                      {sender?.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-[#FF5722] font-mono text-[10px]">{sender?.name}</span>
                        <span className="text-[8px] text-[#444] font-mono">{event.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[#AAA] leading-relaxed text-[11px]">{event.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isRunning && (
              <div className="flex items-center gap-1.5 text-[#FF5722] font-mono text-[9px] leading-none animate-pulse">
                <Zap size={10} />
                DEBATERS LOGGING FEEDBACK CONTINUOUSLY...
              </div>
            )}
          </div>
          
          <div className="p-3 bg-[#111] border-t border-[#222]">
             <div className="flex gap-2">
               <input 
                  value={predictionGoal}
                  onChange={(e) => setPredictionGoal(e.target.value)}
                  placeholder="Simulation baseline constraints..." 
                  className="flex-1 bg-black border border-[#222] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF5722]" 
               />
             </div>
          </div>
        </div>

        {/* Synthesized consent reports */}
        <div className="col-span-12 md:col-span-4 flex flex-col overflow-hidden">
          <div className="geo-card flex-1 flex flex-col bg-[#111]/40 border border-[#222] rounded-lg overflow-y-auto">
             {simulationReport ? (
               <div className="space-y-3 font-mono text-[11px] p-2 leading-relaxed">
                  <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-tight text-xs">
                      <Bot size={13} className="text-[#FF5722]" />
                      Synthesized PDF Preview
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-[#AAA] bg-black/40 p-3 rounded leading-normal border border-[#222]">
                    {simulationReport}
                  </pre>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-6">
                 <div className="w-12 h-12 bg-[#222]/50 border border-[#333] rounded-full flex items-center justify-center mb-4">
                    <Zap size={18} className={cn(isRunning ? "text-[#FF5722] animate-bounce" : "text-[#333]")} />
                 </div>
                 <h3 className="text-xs font-bold mb-1 uppercase tracking-wider font-mono">Consensus compiler</h3>
                 <p className="text-[10px] text-[#555] mb-6 italic">
                   {events.length < 3 ? "Run at least 3 rounds of debates before synthesizing environmental predictions." : "Dialogue complete. Ready for compilation."}
                 </p>
                 <button 
                  disabled={events.length < 3 || isCompiling}
                  onClick={generateFinalReport}
                  className="w-full bg-[#FF5722] text-black py-2 rounded text-xs font-bold uppercase hover:bg-[#ff7043] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                 >
                    <Sparkles size={12} /> 
                    {isCompiling ? "Compiling..." : "Compile Consensus"}
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
