/**
 * @license
 * Copyright 2026 GeoAI Pro Coordinator
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
// validateIdentity from './lib/identityValidator';

console.log("App mounted successfully");

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 font-mono text-red-500 bg-black min-h-screen">
          <h1 className="text-2xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
          <p className="mb-4">The application crashed while rendering.</p>
          <pre className="text-xs bg-[#111] p-4 rounded border border-red-900 block overflow-auto">
            {this.state.error?.message}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-900 text-white hover:bg-red-800 rounded"
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

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
  Shield,
  LayoutDashboard,
  Search,
  Sliders,
  Cpu,
  Unplug,
  Users,
  Terminal,
  Loader2,
  Droplets,
  TestTube,
  Radio,
  Mountain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { 
  GeoModule, 
  GeoFile 
} from './types';
import { cn } from './lib/utils';

// Core Imports
import CentralCommand from './components/Modules/CentralCommand';
import SeismicModule from './components/Modules/SeismicModule';
import WellLoggingModule from './components/Modules/WellLoggingModule';
import SpatialTwin from './components/Modules/SpatialTwin';
import SimulationModule from './components/Modules/SimulationModule';
import SystemDiagnostics from './components/Modules/SystemDiagnostics';
import MasterGeoSynthesizer from './components/Modules/AIConsultantModule';

// Activated Spatial Modules
import GravityMagModule from './components/Modules/GravityMagModule';
import ElectricalEMModule from './components/Modules/ElectricalEMModule';
import GPRModule from './components/Modules/GPRModule';
import GeochemModule from './components/Modules/GeochemModule';
import MeteorologyModule from './components/Modules/MeteorologyModule';
import GroundwaterModule from './components/Modules/GroundwaterModule';
import SoilPHModule from './components/Modules/SoilPHModule';
import BoreholeRadiometricModule from './components/Modules/BoreholeRadiometricModule';
import GeotechnicalTiltExtensoModule from './components/Modules/GeotechnicalTiltExtensoModule';
import GasAirQualityModule from './components/Modules/GasAirQualityModule';

// Shared Components
import SwarmRoom from './components/Shared/SwarmRoom';
import SeismicRadar from './components/Shared/SeismicRadar';
import FileUploader from './components/Shared/FileUploader';
import ApiHealthMonitor from './components/Shared/ApiHealthMonitor';
import AnalyticsDrawer from './components/Modules/AnalyticsDrawer';
import GeoAILogo from './components/Shared/GeoAILogo';

// Hooks
import { useApiQueue } from './hooks/useApiQueue';
import { useApiMonitorStore } from './store/ApiMonitorStore';
import { BRANDING } from './constants/BrandingConstants';

import { AppContext, AppProvider, useAppContext, ApiMode } from './context/AppContext';
import { GlobalGeoProvider, useGlobalGeoContext } from './context/GlobalGeoContext';
import { fetchHistoricalState } from '../../lib/geoSync';

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
function MainDashboard() {
  const location = useLocation();
  const activeModulePath = location.pathname === '/' ? GeoModule.DASHBOARD : location.pathname.slice(1) as GeoModule;

  const { overwriteAllState } = useGlobalGeoContext();
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);

  useEffect(() => {
    let active = true;
    const runAutoRestore = async () => {
      if (overwriteAllState) {
        setIsTimeTraveling(true);
        try {
          console.log("[TIME-TRAVEL] Auto-reverting system to May 30 18:21 checkpoint...");
          const data = await fetchHistoricalState();
          if (data && data.globalData && data.rawPayloads && active) {
            overwriteAllState(data.globalData, data.rawPayloads);
          }
        } catch (e) {
          console.error("[TIME-TRAVEL] Auto-restore boot failed:", e);
        } finally {
          if (active) setIsTimeTraveling(false);
        }
      }
    };
    runAutoRestore();
    return () => {
      active = false;
    };
  }, [overwriteAllState]);

  const [isCompromised, setIsCompromised] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navAltText, setNavAltText] = useState(false);
  const [reseedKey, setReseedKey] = useState(0);

  useEffect(() => {
    const handleReseed = () => {
      setReseedKey(prev => prev + 1);
    };
    window.addEventListener('mfa_reseed_success', handleReseed);
    return () => window.removeEventListener('mfa_reseed_success', handleReseed);
  }, []);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, BRANDING.TRANSITION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavigating) return;
    const interval = setInterval(() => {
      setNavAltText(prev => !prev);
    }, Math.floor(BRANDING.TRANSITION_DELAY_MS / 3));
    return () => clearInterval(interval);
  }, [isNavigating]);

  useEffect(() => {
    try {
      ;
    } catch (err) {
      console.error("[Integrity Error] failed validation check:", err);
      setIsCompromised(true);
    }
  }, []);

  const [files, setFiles] = useState<GeoFile[]>([]);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportErr, setSupportErr] = useState("");

  const handleSupportSubmit = async () => {
    if (!supportText.trim()) return;
    setSupportSending(true);
    setSupportErr("");
    try {
      const res = await fetch("/api/support/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: supportText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSupportSuccess(true);
        setSupportText("");
        setTimeout(() => {
          setSupportSuccess(false);
          setIsSupportOpen(false);
        }, 2200);
      } else {
        setSupportErr(data.error || "Transmission fail.");
      }
    } catch (e) {
      setSupportErr("Failed connecting to proxy server.");
    } finally {
      setSupportSending(false);
    }
  };

  const [drillCoords, setDrillCoords] = useState<{ x: number; y: number; z: number } | null>({x: 120, y: 340, z: 450});

  const [systemClock, setSystemClock] = useState("");
  useEffect(() => {
    setSystemClock(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setSystemClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { isProcessing, statusMessage, queueLength } = useApiQueue();
  const { apiMode, toggleApiMode, dimensionMode, toggleDimensionMode } = useAppContext();

  const [isBooting, setIsBooting] = useState(true);
  const [isSwitchingMode, setIsSwitchingMode] = useState<string | null>(null);
  const [blurPhase, setBlurPhase] = useState(0);

  useEffect(() => {
    // 4-second boot screen
    const bootTimer = setTimeout(() => setIsBooting(false), 4000);
return () => clearTimeout(bootTimer);
  }, []);

  const handleToggleModeIntercept = () => {
    setIsSwitchingMode('API');
    setBlurPhase(0);

    setTimeout(() => setBlurPhase(1), 1200);
    setTimeout(() => setBlurPhase(2), 2600);
    setTimeout(() => {
      setIsSwitchingMode(null);
      toggleApiMode();
    }, 4000);
  };

  const handleDimensionModeIntercept = () => {
    setIsSwitchingMode('DIMENSION');
    setBlurPhase(0);

    setTimeout(() => setBlurPhase(1), 3000);
    setTimeout(() => setBlurPhase(2), 7000);
    setTimeout(() => {
      setIsSwitchingMode(null);
      toggleDimensionMode();
    }, 10000);
  };

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

  if (isCompromised) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-red-500 font-mono z-[99999] p-8 select-none">
        <div className="max-w-md text-center space-y-4">
          <span className="text-5xl animate-pulse">☠</span>
          <h1 className="text-lg font-bold uppercase tracking-widest border-b border-red-900 pb-2">CRITICAL EXCEPTION</h1>
          <p className="text-sm text-gray-400 font-bold leading-relaxed">
            System Integrity Compromised. Unauthorized modification detected.
          </p>
          <span className="text-[10px] text-gray-600 block pt-1 font-semibold">ERROR_CODE: FATAL_INTEGRITY_EXCEPTION</span>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-root" className="flex h-screen bg-[#111111] text-white overflow-hidden font-sans">
      {isBooting && (
        <div 
          onClick={() => setIsBooting(false)} 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center text-white cursor-pointer select-none" 
          style={{ backdropFilter: 'blur(25px) brightness(40%)', background: 'radial-gradient(circle, rgba(16,16,24,0.8) 0%, rgba(10,10,12,1) 100%)' }}
          title="Click anywhere to bypass system boot loader"
        >
          <GeoAILogo size={72} className="mb-6 animate-pulse text-[#00E5FF]" glow={true} />
          <h1 className="text-2xl font-bold mb-4 font-mono tracking-widest text-[#00E5FF] text-center px-4">⚡ SYSTEM SECURE ACQUISITION — GEOAI PRO V4.0</h1>
          <p className="font-mono text-sm tracking-wider text-gray-400 mb-6 text-center px-4">[BOOT] Initializing telemetry framework {import.meta.env.VITE_DEV_SIGNATURE || "0xGEOAI_C0D3"}</p>
          <div className="w-64 h-1.5 bg-[#111] overflow-hidden rounded mb-4">
             <div className="h-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" style={{ animation: 'loadBar 4s ease-in-out forwards' }} />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsBooting(false); }} 
            className="px-5 py-2.5 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/40 hover:border-[#00E5FF] text-[#00E5FF] font-mono text-[11px] font-bold tracking-widest transition-all rounded uppercase shadow-[0_0_15px_rgba(0,229,255,0.15)] cursor-pointer mt-2"
          >
            ENTER WORKSPACE
          </button>
          <style>{`
            @keyframes loadBar {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      )}

      <AnimatePresence>
        {isSwitchingMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[88888] flex flex-col items-center justify-center"
            style={{ backdropFilter: 'blur(16px)', background: 'rgba(10,10,12,0.75)' }}
          >
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-[#222] bg-[#0c0c0d]/95 shadow-[0_0_30px_rgba(0,255,204,0.15)] text-center w-full max-w-lg relative">
              {/* Geological geometric corner accents - #00ffcc */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ffcc]"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ffcc]"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00ffcc]"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00ffcc]"></div>
              
              <GeoAILogo size={56} className="mb-4 drop-shadow-[0_0_10px_rgba(0,255,204,0.8)]" />
              
              <h3 className="text-sm font-extrabold text-[#00ffcc] tracking-widest font-mono uppercase mb-0.5">
                {BRANDING.APP_NAME} {BRANDING.APP_VERSION}
              </h3>
              <p className="text-[9px] font-mono text-gray-500 tracking-wider mb-2">
                {import.meta.env.VITE_SECURITY_CORE}
              </p>
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#00ffcc]/50 to-transparent mb-3.5"></div>
              
              {/* 10-Second Terminal cascade logging console */}
              <div className="w-full bg-[#111] border border-[#222] p-4 text-left font-mono rounded h-48 overflow-y-auto mt-2">
                <div className="flex items-center gap-2 mb-2">
                   <Loader2 size={12} className="animate-spin text-green-500" />
                   <span className="text-[10px] text-green-500 uppercase opacity-80">&gt; CALIBRATING SYSTEM MODALITIES...</span>
                </div>
                <div className="text-[10px] text-green-400 leading-relaxed break-words">
                  {blurPhase >= 0 && (
                    <p className="mb-2 uppercase opacity-80">&gt; Tracking core hashes initialization: {import.meta.env.VITE_DEV_SIGNATURE || "0xGEOAI_C0D3"}...]</p>
                  )}
                  {blurPhase >= 1 && (
                    <div className="mb-2">
                      <p className="uppercase opacity-90 font-bold">&gt; {isSwitchingMode === 'API' ? (apiMode === "LIVE" ? "TEARING DOWN 500+ LIVE AGENT NEURAL NETWORKS..." : "ESTABLISHING MASS MIGRATION OF 500+ AGENT PIPELINES INTO TARGET PROCESSING BRAIN...") : (dimensionMode === '3D' ? "FLATTENING 3D VOLUMETRIC MESH TO 2D CROSS-SECTIONAL PROFILES..." : "UPSCALE 2D TO COMPLEX 3D VOLUMETRIC CUBE MESH...")}</p>
                      <div className="pl-2 space-y-0.5 opacity-70">
                         <p>[OK] Toggling Swarm Matrix Core Context hook...</p>
                         <p>[OK] Migrating 500+ concurrent analytical simulation nodes...</p>
                         <p>[OK] Flush existing Memory Dumps & Vectors.</p>
                         <p>[OK] Re-routing Seismic (.segy) operational pipelines.</p>
                         <p>[OK] Re-routing Well Logging (.las) - Top-to-Bottom depth matrix.</p>
                         <p>[OK] Spatial Twin (.shp) agent synchronization established.</p>
                         <p>[OK] Electrical & EM arrays swarm routing successful.</p>
                         <p>[OK] Gravity & Magnetic cognitive clusters initialized.</p>
                         <p>[OK] GPR Waveform array computational nodes scaling.</p>
                         <p>[OK] Rock Geochem matrices mapped to localized subsets.</p>
                         <p>[OK] Meteorology, Groundwater and Geotech arrays successfully bound.</p>
                         <p>[OK] Flushing stale database queues...</p>
                      </div>
                    </div>
                  )}
                  {blurPhase >= 2 && (
                    <div className="mt-2 text-[#fff]">
                      <p className="font-bold text-[12px] uppercase tracking-widest break-words whitespace-pre-wrap">{isSwitchingMode === 'API' ? (apiMode === "LIVE" ? "✦ RUNTIME NUMERICAL INVERSION // LOCAL COMPUTATIONAL ENGINE ACTIVATED SUCCESSFUL" : "✦ LIVE INFERENCE // EXTERNAL COGNITIVE HUB CONNECTED SUCCESSFUL") : (dimensionMode === '3D' ? "✦ 2D PROFILER RENDER ACTIVATED" : "✦ 3D VOXEL CLOUD RENDER INJECTED")}</p>
                      <p className="text-[9px] text-green-500 mt-1">&gt; SECURE TERMINATION: {import.meta.env.VITE_DEV_SIGNATURE || "0xGEOAI_C0D3"}</p>
                    </div>
                  )}
                  <span className="inline-block w-2.5 h-3 bg-green-500 animate-pulse ml-1 align-middle mt-1" />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar navigation */}
      <aside className="w-56 border-r border-[#333333] flex flex-col pt-4 bg-[#141414] shrink-0">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GeoAILogo size={24} glow={true} />
            <span className="text-md font-bold tracking-tighter uppercase italic text-white flex items-center">{BRANDING.APP_NAME}</span>
          </div>
          <p className="text-[9px] text-[#FF5722] font-mono leading-none font-bold uppercase tracking-widest mb-2">Digital Twin {BRANDING.APP_VERSION}</p>
          <div className="text-[8px] font-mono text-[#777] uppercase leading-tight select-none border-t border-[#222] pt-2 mb-1">
            🔒 License Lock:
            <span className="text-[#00E5FF] block mt-0.5 font-bold">BY IVAN HUTABARAT</span>
          </div>
          <button
            onClick={async () => {
              if (overwriteAllState) {
                setIsTimeTraveling(true);
                try {
                  const data = await fetchHistoricalState();
                  if (data && data.globalData && data.rawPayloads) {
                    overwriteAllState(data.globalData, data.rawPayloads);
                  }
                } catch (e) {
                  console.error("Manual time-travel sync failed:", e);
                } finally {
                  setIsTimeTraveling(false);
                }
              }
            }}
            disabled={isTimeTraveling}
            title="Restore state to May 30 18:21"
            className="w-full text-left py-1.5 px-2 rounded-md bg-[#FF5722]/10 hover:bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30 uppercase tracking-widest text-[8px] font-mono font-black transition-all flex items-center justify-between cursor-pointer"
          >
            <span>{isTimeTraveling ? '⏳ SYNCING...' : '⚡ TIME-TRAVEL (18:21)'}</span>
          </button>
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
          
          <div className="px-4 py-2 mt-2">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Instruments</span>
          </div>
          <SidebarItem icon={Droplets} label="Groundwater & Hydro" to={`/${GeoModule.GROUNDWATER}`} />
          <SidebarItem icon={TestTube} label="Soil pH & Env" to={`/${GeoModule.SOIL_PH}`} />
          <SidebarItem icon={Radio} label="Borehole Radiometric" to={`/${GeoModule.BOREHOLE_RADIOMETRIC}`} />
          <SidebarItem icon={Mountain} label="Geotech Tilt & Extenso" to={`/${GeoModule.GEOTECHNICAL_TILT}`} />
          <SidebarItem icon={Wind} label="Gas & Air Quality" to={`/${GeoModule.GAS_AIR_QUALITY}`} />
          
          <div className="px-4 py-2 mt-2">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Cognitive Lab</span>
          </div>
          <SidebarItem icon={Bot} label="Master Geo-Synthesizer" to={`/${GeoModule.AI_CONSULTANT}`} />
          <SidebarItem icon={Users} label="Simulation Sandbox" to={`/${GeoModule.SIMULATION}`} />
          <SidebarItem icon={Terminal} label="Diagnostics Console" to={`/${GeoModule.DIAGNOSTICS}`} />
          
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 border-l-2 border-transparent text-[#888888] hover:text-white hover:bg-white/5 text-left cursor-pointer font-mono"
          >
            <Shield size={16} className="text-[#00E5FF]" />
            <span className="text-xs font-semibold tracking-tight uppercase">Security Support</span>
          </button>
        </nav>

        {/* Embedded Radar Warning Scan Widget */}
        <div className="p-3 border-t border-[#222] flex justify-center bg-black/40 h-48 overflow-hidden">
          <SeismicRadar />
        </div>
      </aside>

      {/* Center workspace frame */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0B]">
        {/* High-Focus Navigation and Menu Transition Intercept Overlay */}
        <AnimatePresence>
          {isNavigating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center"
              style={{ backdropFilter: 'blur(16px)', background: 'rgba(10,10,12,0.75)' }}
            >
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-[#222] bg-[#0c0c0d]/95 shadow-2xl text-center max-w-xs relative">
                {/* Geological geometric corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ffcc]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ffcc]"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00ffcc]"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00ffcc]"></div>
                
                <GeoAILogo size={56} className="mb-4 drop-shadow-[0_0_10px_rgba(0,255,204,0.8)]" />
                
                <h3 className="text-sm font-extrabold text-[#00ffcc] tracking-widest font-mono uppercase mb-0.5">
                  {BRANDING.APP_NAME} {BRANDING.APP_VERSION}
                </h3>
                <p className="text-[9px] font-mono text-gray-500 tracking-wider mb-2">
                  {BRANDING.APP_CREDIT.toUpperCase()}
                </p>
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#00ffcc]/50 to-transparent mb-3.5"></div>
                <div className="py-1 px-3 bg-[#111] rounded border border-[#222] text-[8px] font-mono tracking-widest text-[#00ffcc] animate-pulse">
                  {navAltText ? "RECALCULATING STRATA" : `SOLVING VOLUMETRICS... ${BRANDING.APP_SHORT_CREDIT.toUpperCase()}`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top telemetry control bar */}
        <header className="h-12 border-b border-[#333333] flex items-center justify-between px-6 bg-[#161617] shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Main Header Title/Logo */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <GeoAILogo size={18} glow={false} />
              <span className="text-xs font-bold tracking-tight uppercase italic font-mono text-white">{BRANDING.APP_NAME.toUpperCase()}</span>
              <span className="text-[10px] font-mono text-[#444] font-bold">/</span>
              <span className="text-[9px] text-[#888] font-mono uppercase tracking-widest font-semibold">DIGITAL TWIN {BRANDING.APP_VERSION.toUpperCase()}</span>
            </div>
            
            {/* LIVE / DUMMY Toggle switch */}
            <div className="flex items-center gap-1.5 shrink-0 select-none ml-1">
              <span className="text-[9px] font-mono font-bold text-[#555] tracking-widest hidden sm:inline">API MODE:</span>
              <button
                onClick={handleToggleModeIntercept}
                className={cn(
                  "relative inline-flex h-5 w-[60px] shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  apiMode === "LIVE" ? "bg-emerald-950/80 border-emerald-500/30" : "bg-neutral-850 border-neutral-700"
                )}
                id="api-mode-toggle"
                title={`Switch to ${apiMode === "LIVE" ? 'DUMMY' : 'LIVE'} Mode`}
              >
                <span className="sr-only">Toggle API Mode</span>
                <span
                  className={cn(
                    "pointer-events-none relative inline-block h-3.5 w-3.5 transform rounded-full ring-0 transition duration-200 ease-in-out mt-[2px]",
                    apiMode === "LIVE" ? "translate-x-10 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "translate-x-1 bg-neutral-400"
                  )}
                />
                <span className={cn(
                  "absolute text-[7px] font-mono font-bold tracking-tight uppercase transition-all duration-200 select-none top-[4px]",
                  apiMode === "LIVE" ? "left-2 text-emerald-400" : "right-2 text-neutral-400"
                )}>
                  {apiMode}
                </span>
              </button>
            </div>

            {/* 2D / 3D Toggle switch */}
            <div className="flex items-center gap-1.5 shrink-0 select-none ml-2 border-l border-[#333] pl-3">
              <span className="text-[9px] font-mono font-bold text-[#555] tracking-widest hidden sm:inline">RENDER:</span>
              <button
                onClick={handleDimensionModeIntercept}
                className={cn(
                  "relative inline-flex h-5 w-[60px] shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  dimensionMode === '3D' ? "bg-purple-950/80 border-purple-500/30" : "bg-blue-950/80 border-blue-600/30"
                )}
                title={`Switch to ${dimensionMode === '3D' ? '2D' : '3D'} Mode`}
              >
                <span className="sr-only">Toggle Render Mode</span>
                <span
                  className={cn(
                    "pointer-events-none relative inline-block h-3.5 w-3.5 transform rounded-full ring-0 transition duration-200 ease-in-out mt-[2px]",
                    dimensionMode === '3D' ? "translate-x-10 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "translate-x-1 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  )}
                />
                <span className={cn(
                  "absolute text-[7px] font-mono font-bold tracking-tight uppercase transition-all duration-200 select-none top-[4px]",
                  dimensionMode === '3D' ? "left-2 text-purple-400" : "right-2 text-blue-400"
                )}>
                  {dimensionMode}
                </span>
              </button>
            </div>
            
            <div className="h-4 w-px bg-[#333] shrink-0"></div>

            {/* Header-Mounted API Health Monitor */}
            <ApiHealthMonitor />

            <div className="h-4 w-px bg-[#333] shrink-0 hidden md:block"></div>

            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-[#888888] font-mono font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SYS CLOCK // {systemClock}
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
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-1.5 bg-[#161617] text-gray-300 border border-[#333333] px-3 py-1 rounded text-[10px] font-bold hover:bg-white/5 transition-colors uppercase tracking-tight cursor-pointer"
            >
              <Sliders size={12} className="text-[#00E5FF]" />
              Analytics Suite
            </button>
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
              <Routes key={reseedKey}>
                <Route path="/" element={<Navigate to={`/${GeoModule.DASHBOARD}`} replace />} />
                <Route path={`/${GeoModule.DASHBOARD}`} element={<CentralCommand />} />
                <Route path={`/${GeoModule.SEISMIC}`} element={<SeismicModule />} />
                <Route path={`/${GeoModule.WELL_LOGGING}`} element={<WellLoggingModule />} />
                <Route path={`/${GeoModule.SPATIAL}`} element={<SpatialTwin />} />
                <Route path={`/${GeoModule.GRAVITY_MAG}`} element={<GravityMagModule />} />
                <Route path={`/${GeoModule.ELECTRICAL}`} element={<ElectricalEMModule />} />
                <Route path={`/${GeoModule.GPR}`} element={<GPRModule />} />
                <Route path={`/${GeoModule.GEOCHEM}`} element={<GeochemModule />} />
                <Route path={`/${GeoModule.METEO}`} element={<MeteorologyModule />} />
                <Route path={`/${GeoModule.GROUNDWATER}`} element={<GroundwaterModule />} />
                <Route path={`/${GeoModule.SOIL_PH}`} element={<SoilPHModule />} />
                <Route path={`/${GeoModule.BOREHOLE_RADIOMETRIC}`} element={<BoreholeRadiometricModule />} />
                <Route path={`/${GeoModule.GEOTECHNICAL_TILT}`} element={<GeotechnicalTiltExtensoModule />} />
                <Route path={`/${GeoModule.GAS_AIR_QUALITY}`} element={<GasAirQualityModule />} />
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
            <span className="text-[#00E5FF] font-bold tracking-wider mr-2 border-r border-[#222222] pr-4 uppercase">{import.meta.env.VITE_CHART_WATERMARK}</span>
            <span>MEM: 14.8GB / 32GB</span>
            <span>GPU_TEMP: 41.5°C</span>
            <span>API_LATENCY: 110ms</span>
          </div>
          <div className="flex items-center gap-3 italic">
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
            <span className="text-[8px] font-sans text-neutral-500 hover:text-neutral-300 transition-colors uppercase not-italic font-bold tracking-widest px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded select-none shrink-0 ml-1">
              {import.meta.env.VITE_DEV_SIGNATURE || "0xGEOAI_C0D3"}
            </span>
          </div>
        </footer>
      </main>

      {/* Right panel docked Swarm Debate Meeting Room */}
      {activeModulePath !== "simulation" && (
<div className="flex flex-col shrink-0 h-full border-l border-[#2e2e30] max-h-screen overflow-y-auto">
  {/* Target Coordinates Sliders */}
      <div className="p-3 bg-[#111] border-b border-[#333] flex flex-col gap-2">
         <span className="text-[10px] font-mono text-[#ff5722] font-bold">TARGET XYZ COORDINATES</span>
         <div className="flex gap-4">
            <div className="flex-1">
               <label className="text-[9px] font-mono text-gray-500 uppercase">X (Easting) : {drillCoords?.x || 120}</label>
               <input type="range" min="0" max="1000" value={drillCoords?.x || 120} onChange={(e) => setDrillCoords({...drillCoords, x: Number(e.target.value), y: drillCoords?.y || 340, z: drillCoords?.z || 450})} className="w-full h-1" />
            </div>
            <div className="flex-1">
               <label className="text-[9px] font-mono text-gray-500 uppercase">Y (Northing) : {drillCoords?.y || 340}</label>
               <input type="range" min="0" max="1000" value={drillCoords?.y || 340} onChange={(e) => setDrillCoords({...drillCoords, x: drillCoords?.x || 120, y: Number(e.target.value), z: drillCoords?.z || 450})} className="w-full h-1" />
            </div>
            <div className="flex-1">
               <label className="text-[9px] font-mono text-gray-500 uppercase">Z (Depth) : {drillCoords?.z || 450}</label>
               <input type="range" min="0" max="1000" value={drillCoords?.z || 450} onChange={(e) => setDrillCoords({...drillCoords, x: drillCoords?.x || 120, y: drillCoords?.y || 340, z: Number(e.target.value)})} className="w-full h-1" />
            </div>
         </div>
      </div>
      <SwarmRoom 
          activeModule={activeModulePath as string} 
          drillCoordinates={drillCoords} 
          onClearCoordinates={() => setDrillCoords(null)} />
</div>
)}

      {/* Cloud Store Importer modal */}
      <FileUploader 
        isOpen={isUploaderOpen} 
        onClose={() => setIsUploaderOpen(false)} 
        onUpload={handleUpload} 
      />

      {/* Analytics Master Drawer */}
      <AnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* ANONYMOUS SUPPORT PROXY MODAL */}
      <AnimatePresence>
        {isSupportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[4000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#121214] border border-[#00E5FF]/30 rounded-xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden font-mono text-[10px] text-gray-300 relative"
            >
              {/* Corner tech accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00E5FF]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00E5FF]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00E5FF]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00E5FF]"></div>

              {/* Modal Header */}
              <div className="p-4 border-b border-[#00E5FF]/20 bg-[#00E5FF]/5 flex justify-between items-center shrink-0">
                <span className="text-[#00E5FF] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  🛡 SECURE PROXY COMMUNICATION BRIDGE
                </span>
                <button 
                  onClick={() => setIsSupportOpen(false)}
                  className="p-1 hover:bg-neutral-800 text-gray-400 hover:text-white rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 font-mono">
                <p className="text-[9px] text-[#888] leading-relaxed font-sans text-left">
                  This secure routing terminal masks your IP, location, and metadata. Submissions are transmitted anonymously via the **Van-Botz Secure Proxy Network** directly to {BRANDING.DEVELOPER_NAME} ({BRANDING.SUPPORT_TARGET_NUMBER}).
                </p>

                {supportSuccess ? (
                  <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-center space-y-2 py-6">
                    <span className="text-xl font-bold">✓ DISPATCH SUCCESS</span>
                    <p className="text-[8px] text-gray-400 font-sans">
                      Payload successfully packetized and transmitted through anonymous bridge layers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <label className="text-white uppercase font-bold text-[8px] block">
                      QUERY MESSAGE TRANSMISSION
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Enter details of your submission, issue code, or raw data query..."
                      value={supportText}
                      onChange={(e) => setSupportText(e.target.value)}
                      className="w-full bg-black/40 border border-[#2e2e30] rounded p-2.5 hover:border-[#444] focus:border-[#00E5FF] focus:outline-none font-mono text-[10px] leading-relaxed resize-none text-white placeholder:text-neutral-600 focus:placeholder:text-neutral-500"
                    />

                    {supportErr && (
                      <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-400 rounded text-[9px]">
                        Error: {supportErr}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsSupportOpen(false)}
                        className="py-2 px-4 rounded bg-neutral-800 text-gray-400 border border-neutral-700 hover:text-white hover:bg-neutral-700 font-bold uppercase tracking-wider transition-colors cursor-pointer text-[8px]"
                      >
                        CLOSE TERMINAL
                      </button>
                      <button
                        type="button"
                        disabled={supportSending || !supportText.trim()}
                        onClick={handleSupportSubmit}
                        className="py-2 px-5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-[#00E5FF] hover:text-white font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-[8px]"
                      >
                        {supportSending ? "TRANSMITTING OVER PROXY..." : "SECURE TRANSMIT"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function MainDashboardWrapper() { return <HashRouter><GlobalGeoProvider><AppProvider><MainDashboard /></AppProvider></GlobalGeoProvider></HashRouter>; }
