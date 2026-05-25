import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Zap, 
  Waves, 
  Wind, 
  Thermometer, 
  Gem, 
  Bot, 
  Upload, 
  LayoutDashboard,
  Search,
  Cpu,
  Unplug,
  Users,
  Terminal,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { 
  GeoModule, 
  GeoFile 
} from './types';
import { cn } from './lib/utils';

// Core Imports
import SeismicModule from './components/Modules/SeismicModule';
import WellLoggingModule from './components/Modules/WellLoggingModule';
import SpatialModule from './components/Modules/SpatialModule';
import SimulationModule from './components/Modules/SimulationModule';
import SystemDiagnostics from './components/Modules/SystemDiagnostics';
import MasterGeoSynthesizer from './components/Modules/AIConsultantModule';

// Activated Spatial Modules
import GravityMagModule from './components/Modules/GravityMagModule';
import ElectricalEMModule from './components/Modules/ElectricalEMModule';
import GPRModule from './components/Modules/GPRModule';
import GeochemModule from './components/Modules/GeochemModule';
import MeteorologyModule from './components/Modules/MeteorologyModule';

// Shared Components
import SwarmRoom from './components/Shared/SwarmRoom';
import RadarWidget from './components/Shared/RadarWidget';
import FileUploader from './components/Shared/FileUploader';

// Hooks
import { useApiQueue } from './hooks/useApiQueue';

// --- Components ---
const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to
}: { 
  icon: any, 
  label: string, 
  to: string
}) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 border-l-2 text-left cursor-pointer",
      isActive 
        ? "bg-white/5 border-[#FF5722] text-white" 
        : "border-transparent text-[#888888] hover:text-white hover:bg-white/5"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon size={16} className={isActive ? "text-[#FF5722]" : ""} />
        <span className="text-xs font-semibold tracking-tight">{label}</span>
      </>
    )}
  </NavLink>
);

const ModuleHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h1 className="text-xl font-bold tracking-tight text-white mb-0.5 uppercase italic font-mono">{title}</h1>
    {subtitle && <p className="text-[11px] text-[#888888]">{subtitle}</p>}
  </div>
);

// --- App Content ---
function AppContent() {
  const location = useLocation();
  const activeModulePath = location.pathname === '/' ? GeoModule.DASHBOARD : location.pathname.slice(1) as GeoModule;

  const [files, setFiles] = useState<GeoFile[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [drillCoords, setDrillCoords] = useState<{ x: number; y: number; z: number } | null>(null);

  const [systemClock, setSystemClock] = useState("");
  useEffect(() => {
    setSystemClock(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setSystemClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { isProcessing, statusMessage, queueLength } = useApiQueue();

  const handleUpload = (newFiles: File[]) => {
    const geoFiles: GeoFile[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: f.size,
      type: f.name.split('.').pop() as any,
      module: getModuleFromExtension(f.name.split('.').pop() || ""),
      uploadedAt: new Date(),
      status: 'raw'
    }));
    setFiles(prev => [...prev, ...geoFiles]);
  };

  const getModuleFromExtension = (ext: string): GeoModule => {
    const lower = ext.toLowerCase();
    if (lower === 'sgy' || lower === 'segy') return GeoModule.SEISMIC;
    if (lower === 'las') return GeoModule.WELL_LOGGING;
    if (lower === 'shp' || lower === 'kml' || lower === 'tiff') return GeoModule.SPATIAL;
    return GeoModule.DASHBOARD;
  };

  return (
    <div className="flex h-screen bg-[#111111] text-white overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <aside className="w-56 border-r border-[#333333] flex flex-col pt-4 bg-[#141414] shrink-0">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-[#FF5722] rounded-sm flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="text-md font-bold tracking-tighter uppercase italic">GeoAI Pro</span>
          </div>
          <p className="text-[9px] text-[#FF5722] font-mono leading-none font-bold uppercase tracking-widest">Digital Twin v4.0</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto font-mono scrollbar-thin">
          <SidebarItem icon={LayoutDashboard} label="Command Center" to={`/${GeoModule.DASHBOARD}`} />
          
          <div className="px-4 py-2">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Primary Arrays</span>
          </div>
          <SidebarItem icon={Waves} label="Seismic (.segy)" to={`/${GeoModule.SEISMIC}`} />
          <SidebarItem icon={Activity} label="Well Logging (.las)" to={`/${GeoModule.WELL_LOGGING}`} />
          <SidebarItem icon={MapIcon} label="Spatial Twin (.shp)" to={`/${GeoModule.SPATIAL}`} />
          
          <div className="px-4 py-2">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Sensing Modules</span>
          </div>
          <SidebarItem icon={Gem} label="Gravity & Magnetic" to={`/${GeoModule.GRAVITY_MAG}`} />
          <SidebarItem icon={Zap} label="Electrical & EM" to={`/${GeoModule.ELECTRICAL}`} />
          <SidebarItem icon={Unplug} label="GPR Waveform" to={`/${GeoModule.GPR}`} />
          <SidebarItem icon={Thermometer} label="Rock Geochem" to={`/${GeoModule.GEOCHEM}`} />
          <SidebarItem icon={Wind} label="Meteorology" to={`/${GeoModule.METEO}`} />
          
          <div className="px-4 py-2">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Cognitive Lab</span>
          </div>
          <SidebarItem icon={Bot} label="Master Geo-Synthesizer" to={`/${GeoModule.AI_CONSULTANT}`} />
          <SidebarItem icon={Users} label="Simulation Sandbox" to={`/${GeoModule.SIMULATION}`} />
          <SidebarItem icon={Terminal} label="Diagnostics Console" to={`/${GeoModule.DIAGNOSTICS}`} />
        </nav>

        {/* Embedded Radar Warning Scan Widget */}
        <div className="p-3 border-t border-[#222] flex justify-center bg-black/40">
          <RadarWidget />
        </div>
      </aside>

      {/* Center workspace frame */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0B]">
        {/* Top telemetry control bar */}
        <header className="h-12 border-b border-[#333333] flex items-center justify-between px-6 bg-[#161617] shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#888888] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              CORE METRIC // {systemClock}
            </div>
            <div className="h-4 w-px bg-[#333]"></div>
            <div className="flex items-center gap-2 text-[10px] text-[#888]">
              <Cpu size={12} className="text-[#FF5722]" />
              <span className="font-mono">NVIDIA A100 // ACTIVE SERVICE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
              <input 
                type="text" 
                placeholder="Search raw data matrices..." 
                className="bg-black/40 border border-[#333] rounded px-8 py-1 text-[10px] w-48 focus:outline-none focus:border-[#FF5722] transition-colors font-mono"
              />
            </div>
            <button 
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center gap-1.5 bg-[#FF5722] text-black px-3 py-1 rounded text-[10px] font-bold hover:bg-[#ff7043] transition-colors uppercase tracking-tight cursor-pointer"
            >
              <Upload size={12} />
              Import Geo File
            </button>
          </div>
        </header>

        {/* Module Render Container */}
        <section className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModulePath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Routes>
                <Route path="/" element={<Navigate to={`/${GeoModule.DASHBOARD}`} replace />} />
                <Route path={`/${GeoModule.DASHBOARD}`} element={<DashboardModule />} />
                <Route path={`/${GeoModule.SEISMIC}`} element={<SeismicModule />} />
                <Route path={`/${GeoModule.WELL_LOGGING}`} element={<WellLoggingModule />} />
                <Route path={`/${GeoModule.SPATIAL}`} element={<SpatialModule onInteractCoords={setDrillCoords} />} />
                <Route path={`/${GeoModule.GRAVITY_MAG}`} element={<GravityMagModule />} />
                <Route path={`/${GeoModule.ELECTRICAL}`} element={<ElectricalEMModule />} />
                <Route path={`/${GeoModule.GPR}`} element={<GPRModule />} />
                <Route path={`/${GeoModule.GEOCHEM}`} element={<GeochemModule />} />
                <Route path={`/${GeoModule.METEO}`} element={<MeteorologyModule />} />
                <Route path={`/${GeoModule.AI_CONSULTANT}`} element={<MasterGeoSynthesizer />} />
                <Route path={`/${GeoModule.SIMULATION}`} element={<SimulationModule />} />
                <Route path={`/${GeoModule.DIAGNOSTICS}`} element={<SystemDiagnostics />} />
                {/* Fallback routes for unbuilt components, just in case */}
                <Route path="*" element={<div className="p-8 text-[#888] font-mono">Module UI Construction...</div>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Core System Footer status */}
        <footer className="h-6 border-t border-[#333333] bg-[#0E0E0F] px-4 flex items-center justify-between font-mono text-[9px] text-[#555555] shrink-0">
          <div className="flex items-center gap-4">
            <span>MEM: 14.8GB / 32GB</span>
            <span>GPU_TEMP: 41.5°C</span>
            <span>API_LATENCY: 110ms</span>
          </div>
          <div className="flex items-center gap-2 italic">
            {isProcessing ? (
               <>
                 <Loader2 size={10} className="text-[#FF5722] animate-spin" />
                 <span className="text-[#FF5722] font-bold">{statusMessage.toUpperCase()} {queueLength > 0 && `(+${queueLength} IN QUEUE)`}</span>
               </>
            ) : (
               <>
                 <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                 <span>SWARM DEBATERS READY FOR INFERENCE</span>
               </>
            )}
          </div>
        </footer>
      </main>

      {/* Right panel docked Swarm Debate Meeting Room */}
      <SwarmRoom 
        activeModule={activeModulePath as string} 
        drillCoordinates={drillCoords} 
        onClearCoordinates={() => setDrillCoords(null)} 
      />

      {/* Cloud Store Importer modal */}
      <FileUploader 
        isOpen={isUploaderOpen} 
        onClose={() => setIsUploaderOpen(false)} 
        onUpload={handleUpload} 
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

// --- Dashboard Overview Component ---
function DashboardModule() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="GEOAI PRO CENTRAL COMMAND" subtitle="Real-time multi-agent swarm digital twin modeling and processing." />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 grid grid-cols-4 gap-4">
          <DashboardStat label="Total Processed Arrays" value="2,482" change="+14%" description="Active survey segments" />
          <DashboardStat label="Swarm Concurrences" value="384" change="+22%" description="Inference agreements logged" />
          <DashboardStat label="Cloud Storage Ingested" value="12.5 TB" change="+1.2TB" description="Synced data matrices" />
          <DashboardStat label="Model Inversions Completed" value="82" change="+8" description="Denoised crosscuts" />
        </div>

        <div className="col-span-8 space-y-4">
          <div className="p-5 bg-[#171718] border border-[#333] rounded-lg">
            <h3 className="text-xs uppercase font-bold tracking-widest text-[#888] mb-4 flex items-center gap-2 font-mono">
              <Activity size={14} className="text-[#FF5722]" />
              ACTIVE GEOPHYSICAL PROCESSING CHANNELS
            </h3>
            <div className="space-y-3 font-mono">
              <DashboardChannel name="MiroFish_Subsurface_A2.segy" step="3D Structural Horizon Picking" progress={82} latency="114ms" />
              <DashboardChannel name="Borehole_Magnetic_Survey.dat" step="Residual Field Deconvolution" progress={45} latency="228ms" />
              <DashboardChannel name="Coastal_Estuary_Schlumberger.ohm" step="Apparent Inversion Profiler" progress={100} latency="0ms" completed />
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="p-5 bg-gradient-to-br from-[#1C1C1E] to-[#251A15] border border-[#FF5722]/20 rounded-lg">
            <h3 className="text-xs uppercase font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
              <Bot size={14} className="text-[#FF5722]" />
              AI SWARM STRATEGY FOR THE DAY
            </h3>
            <p className="text-[11px] text-[#A0A0A5] leading-normal font-mono">
              "Unified analysis recommends focusing on **Electrical & EM apparent surveys** in basin sectors. Check the 3D Spatial Digital Twin coordinates to simulate virtual boreholes."
            </p>
          </div>

          <div className="p-5 bg-[#111] border border-[#222] rounded-lg text-[10px] font-mono leading-normal text-[#555] space-y-1">
            <span className="font-bold uppercase text-white block mb-1">DATA FLOW OVERVIEW</span>
            <div>1. Upload/Sync Geophysics core data in left sidebar.</div>
            <div>2. Use the right-side **Swarm Intelligence Room** to coordinate analysis using Dr. Vance, Rostova, and Takahashi.</div>
            <div>3. Press 'Generate Prospect Report' to extract logs.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardStat({ label, value, change, description }: any) {
  return (
    <div className="bg-[#171718] border border-[#333] p-4 rounded-lg flex flex-col justify-between">
      <span className="text-[9px] uppercase font-bold text-[#555] tracking-widest block font-mono">{label}</span>
      <div className="flex justify-between items-baseline my-1">
        <span className="text-xl font-bold font-mono text-white tracking-tight">{value}</span>
        <span className="text-[9px] font-bold text-green-500 font-mono">{change}</span>
      </div>
      <span className="text-[10px] text-[#888] font-mono">{description}</span>
    </div>
  );
}

function DashboardChannel({ name, step, progress, latency, completed = false }: any) {
  return (
    <div className="p-3 bg-black/30 border border-[#222] rounded flex justify-between items-center">
      <div className="space-y-1">
        <div className="text-xs font-bold text-white">{name}</div>
        <div className="text-[9px] text-[#FF5722]">{step}</div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div className="space-y-1">
          <div className={`text-[9px] uppercase font-bold font-mono ${completed ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>
            {completed ? 'COMPLETED' : `${progress}%`}
          </div>
          <div className="text-[8px] text-[#555]">{latency}</div>
        </div>
      </div>
    </div>
  );
}

