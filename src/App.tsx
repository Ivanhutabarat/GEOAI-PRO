import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  Map as MapIcon, 
  Database, 
  Zap, 
  Waves, 
  Wind, 
  Thermometer, 
  Gem, 
  Bot, 
  Upload, 
  Settings, 
  LayoutDashboard,
  Search,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Unplug
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GeoModule, 
  GeoFile, 
  AnalysisInsight 
} from './types';
import { cn } from './lib/utils';

import AIConsultantModule from './components/Modules/AIConsultantModule';
import SeismicModule from './components/Modules/SeismicModule';
import WellLoggingModule from './components/Modules/WellLoggingModule';
import SpatialModule from './components/Modules/SpatialModule';
import FileUploader from './components/Shared/FileUploader';

// --- Components ---
const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 border-l-2",
      active 
        ? "bg-white/5 border-[#FF5722] text-white" 
        : "border-transparent text-[#888888] hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={18} className={active ? "text-[#FF5722]" : ""} />
    <span className="text-sm font-medium tracking-tight">{label}</span>
  </button>
);

const ModuleHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold tracking-tight text-white mb-1 uppercase italic font-mono">{title}</h1>
    {subtitle && <p className="text-sm text-[#888888]">{subtitle}</p>}
  </div>
);

// --- App ---
export default function App() {
  const [activeModule, setActiveModule] = useState<GeoModule>(GeoModule.DASHBOARD);
  const [files, setFiles] = useState<GeoFile[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpload = (newFiles: File[]) => {
    // Mocking ingestion
    const geoFiles: GeoFile[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: f.size,
      type: f.name.split('.').pop() as any,
      module: GeoModule.SEISMIC, // Default
      uploadedAt: new Date(),
      status: 'raw'
    }));
    setFiles(prev => [...prev, ...geoFiles]);
  };

  return (
    <div className="flex h-screen bg-[#111111] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#333333] flex flex-col pt-6">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-[#FF5722] rounded-sm flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="text-lg font-bold tracking-tighter uppercase italic">GeoAI Pro</span>
          </div>
          <p className="text-[10px] text-[#555555] font-mono leading-none">v3.1 // ADVANCED ANALYTICS</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeModule === GeoModule.DASHBOARD} 
            onClick={() => setActiveModule(GeoModule.DASHBOARD)} 
          />
          <div className="px-6 py-2">
            <span className="text-[10px] uppercase tracking-widest text-[#444444] font-bold">Data Modules</span>
          </div>
          <SidebarItem 
            icon={Waves} 
            label="Seismic (.segy)" 
            active={activeModule === GeoModule.SEISMIC} 
            onClick={() => setActiveModule(GeoModule.SEISMIC)} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Well Logging (.las)" 
            active={activeModule === GeoModule.WELL_LOGGING} 
            onClick={() => setActiveModule(GeoModule.WELL_LOGGING)} 
          />
          <SidebarItem 
            icon={MapIcon} 
            label="Spatial (.shp, .kml)" 
            active={activeModule === GeoModule.SPATIAL} 
            onClick={() => setActiveModule(GeoModule.SPATIAL)} 
          />
          <SidebarItem 
            icon={Gem} 
            label="Gravity & Magnetic" 
            active={activeModule === GeoModule.GRAVITY_MAG} 
            onClick={() => setActiveModule(GeoModule.GRAVITY_MAG)} 
          />
          <SidebarItem 
            icon={Zap} 
            label="Electrical & EM" 
            active={activeModule === GeoModule.ELECTRICAL} 
            onClick={() => setActiveModule(GeoModule.ELECTRICAL)} 
          />
          <SidebarItem 
            icon={Unplug} 
            label="GPR Analysis" 
            active={activeModule === GeoModule.GPR} 
            onClick={() => setActiveModule(GeoModule.GPR)} 
          />
          <SidebarItem 
            icon={Thermometer} 
            label="Geochemistry" 
            active={activeModule === GeoModule.GEOCHEM} 
            onClick={() => setActiveModule(GeoModule.GEOCHEM)} 
          />
          <SidebarItem 
            icon={Wind} 
            label="Meteorology" 
            active={activeModule === GeoModule.METEO} 
            onClick={() => setActiveModule(GeoModule.METEO)} 
          />
          
          <div className="mt-4 px-6 py-2">
            <span className="text-[10px] uppercase tracking-widest text-[#444444] font-bold">Intelligence</span>
          </div>
          <SidebarItem 
            icon={Bot} 
            label="Gemini Consultant" 
            active={activeModule === GeoModule.AI_CONSULTANT} 
            onClick={() => setActiveModule(GeoModule.AI_CONSULTANT)} 
          />
        </nav>

        <div className="p-4 border-t border-[#333333]">
          <button className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 text-[#888888] hover:text-white transition-all">
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span className="text-xs">System Settings</span>
            </div>
            <ChevronRight size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-bottom border-[#333333] flex items-center justify-between px-8 bg-[#111111]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-[#888888] font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SYSTEM ONLINE // {new Date().toLocaleTimeString()}
            </div>
            <div className="h-4 w-px bg-[#333333]"></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-[#888888]">
                <Cpu size={14} />
                <span>NVIDIA A100 // ACTIVE</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
              <input 
                type="text" 
                placeholder="Search raw data archive..." 
                className="bg-black/40 border border-[#333333] rounded px-9 py-1.5 text-xs w-64 focus:outline-none focus:border-[#FF5722] transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center gap-2 bg-[#FF5722] text-black px-4 py-1.5 rounded text-xs font-bold hover:bg-[#ff7043] transition-colors uppercase tracking-tight"
            >
              <Upload size={14} />
              Import Raw File
            </button>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ModuleSelector module={activeModule} />
            </motion.div>
          </AnimatePresence>
        </section>

        {/* System Logs / Footer */}
        <footer className="h-8 border-t border-[#333333] bg-[#111111] px-4 flex items-center justify-between font-mono text-[10px] text-[#555555]">
          <div className="flex items-center gap-4">
            <span>MEM: 12.4GB / 32GB</span>
            <span>GPU_TEMP: 42°C</span>
            <span>API_LATENCY: 124ms</span>
          </div>
          <div className="flex items-center gap-4 italic italic">
            <span>READY FOR MULTIMODAL INFERENCE</span>
          </div>
        </footer>
      </main>

      <FileUploader 
        isOpen={isUploaderOpen} 
        onClose={() => setIsUploaderOpen(false)} 
        onUpload={handleUpload} 
      />
    </div>
  );
}

function ModuleSelector({ module }: { module: GeoModule }) {
  switch (module) {
    case GeoModule.DASHBOARD: return <DashboardModule />;
    case GeoModule.SEISMIC: return <SeismicModule />;
    case GeoModule.WELL_LOGGING: return <WellLoggingModule />;
    case GeoModule.SPATIAL: return <SpatialModule />;
    case GeoModule.AI_CONSULTANT: return <AIConsultantModule />;
    default: return <ModuleNotImplemented title={module.toUpperCase()} format="various" />;
  }
}

// --- Module Components ---

function DashboardModule() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <ModuleHeader title="Command Dashboard" subtitle="Real-time system status and data acquisition overview." />
      </div>

      <div className="col-span-8 space-y-6">
        <div className="geo-card grid grid-cols-3 gap-8">
          <Stat name="Total Archives" value="1,284" trend="+12" icon={Database} />
          <Stat name="AI Interpretations" value="452" trend="+5" icon={Bot} />
          <Stat name="Processed Geodata" value="4.2 TB" trend="+0.4" icon={Layers} />
        </div>

        <div className="geo-card min-h-[300px]">
          <h3 className="text-xs uppercase font-bold tracking-widest text-[#888888] mb-6 flex items-center gap-2">
            <Activity size={14} className="text-[#FF5722]" />
            Active Processing Pipeline
          </h3>
          <div className="space-y-4">
            <PipelineItem name="Seismic_Line_A24.sgy" status="Denoising" progress={65} />
            <PipelineItem name="Well_Exploration_01.las" status="Curve Normalization" progress={82} />
            <PipelineItem name="Borehole_Magnetic_Survey.dat" status="Analyzing" progress={21} />
          </div>
        </div>
      </div>

      <div className="col-span-4 space-y-6">
        <div className="geo-card bg-gradient-to-br from-[#1A1A1A] to-[#251A15] border-[#FF5722]/30">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Bot size={16} className="text-[#FF5722]" />
            Gemini Insight of the Day
          </h3>
          <p className="text-xs text-[#AAAAAA] leading-relaxed mb-4">
            "Detected potential salt-dome structural anomalies in the North-West quadrant. Recommends running a high-pass filter on the latest .segy batch."
          </p>
          <button className="text-[10px] text-[#FF5722] font-bold uppercase hover:underline">View Full Analysis →</button>
        </div>

        <div className="geo-card">
          <h3 className="text-xs uppercase font-bold tracking-widest text-[#888888] mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            <AlertItem type="warning" message="High noise ratio in Well_02 sonic logs." />
            <AlertItem type="success" message="Spatial sync with Cloud-B successful." />
            <AlertItem type="error" message="Format mismatch in .dzx upload." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ name, value, trend, icon: Icon }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-[#222222] rounded border border-[#333333]">
          <Icon size={16} className="text-[#FF5722]" />
        </div>
        <span className="text-[10px] uppercase font-bold text-[#555555] tracking-widest leading-none">{name}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-bold tracking-tighter">{value}</span>
        <span className="text-[10px] text-green-500 font-bold">{trend}%</span>
      </div>
    </div>
  );
}

function PipelineItem({ name, status, progress }: any) {
  return (
    <div className="p-4 bg-black/20 rounded border border-[#333333]">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white mb-0.5">{name}</span>
          <span className="text-[10px] uppercase text-[#FF5722] font-mono tracking-tighter">{status}</span>
        </div>
        <span className="text-xs font-mono text-[#888888]">{progress}%</span>
      </div>
      <div className="w-full bg-[#222222] h-1 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-[#FF5722]" 
        />
      </div>
    </div>
  );
}

function AlertItem({ type, message }: any) {
  const Icon = type === 'error' ? AlertCircle : (type === 'success' ? CheckCircle2 : AlertCircle);
  const color = type === 'error' ? 'text-red-500' : (type === 'success' ? 'text-green-500' : 'text-yellow-500');
  
  return (
    <div className="flex gap-3 items-start">
      <Icon size={14} className={cn("mt-0.5", color)} />
      <p className="text-[11px] text-[#888888] leading-tight">{message}</p>
    </div>
  );
}

function ModuleNotImplemented({ title, format }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#333333] flex items-center justify-center mb-6">
        <Database size={40} className="text-[#333333]" />
      </div>
      <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">{title}</h2>
      <p className="text-sm text-[#888888] max-w-md mb-8 italic">
        Module for processing {format} data is currently initializing. 
        Advanced batch processing and 3D rendering engines are coming online.
      </p>
      <button className="bg-[#222222] border border-[#333333] px-6 py-2 rounded text-xs font-bold hover:bg-[#333333] transition-all">
        Request Early Access
      </button>
    </div>
  );
}

// Removed placeholder components that were conflicting with imports
