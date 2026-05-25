// src/components/Modules/CentralCommand.tsx
import React, { useState, useEffect } from "react";
import { Activity, Cpu, Server, Database, CheckCircle2, ShieldAlert, Key } from "lucide-react";
import { useGlobalGeoContext } from "../../context/GlobalGeoContext";
import { motion } from "motion/react";
import { resetApiKeys } from "../../config/apiConfig";

export default function CentralCommand() {
  const { systemLogs } = useGlobalGeoContext();
  const [telemetry, setTelemetry] = useState({
    cpuUsage: Math.random() * 20 + 30,
    memoryInfo: 14.2,
    diskSpace: 75.4,
    networkLatency: 45,
    gpuTemp: 41.5,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(10, prev.cpuUsage + (Math.random() * 10 - 5))),
        networkLatency: Math.floor(Math.random() * 20 + 35),
        gpuTemp: Math.min(85, Math.max(35, prev.gpuTemp + (Math.random() * 2 - 1))),
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full text-white bg-[#0A0A0B] p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2 border-b border-[#222] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic text-white flex items-center gap-3">
            <Activity className="text-[#00E5FF]" /> Central Command & Telemetry
          </h1>
          <p className="text-sm font-mono text-[#888] mt-1">GeoAI Pro v4.0 - Master Overview</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              resetApiKeys();
              alert("EMERGENCY OVERRIDE: API Key forcefully rotated to next failover slot.");
            }}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded-lg transition-colors font-mono tracking-tight"
            title="Force switch external API key if blocked"
          >
            <Key size={14} /> Force Key Sync
          </button>
          
          <div className="flex items-center gap-4 bg-[#111] px-4 py-2 rounded-lg border border-[#222]">
            <div className="font-mono text-xs text-[#00E5FF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              SYSTEM ONLINE
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <TelemetryCard label="CPU Allocation" value={`${telemetry.cpuUsage.toFixed(1)}%`} icon={Cpu} color="#39FF14" />
        <TelemetryCard label="GPU Temp" value={`${telemetry.gpuTemp.toFixed(1)}°C`} icon={Server} color="#FF5722" />
        <TelemetryCard label="Vector Memory" value={`${telemetry.memoryInfo.toFixed(1)} GB`} icon={Database} color="#00E5FF" />
        <TelemetryCard label="Network Latency" value={`${telemetry.networkLatency} ms`} icon={Activity} color="#B554FF" />
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="bg-[#111] border border-[#222] rounded-xl flex flex-col p-4 shadow-lg overflow-hidden">
          <h2 className="text-xs font-bold text-[#888] font-mono mb-4 uppercase tracking-wider">System Operations Log</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono scrollbar-thin">
            {systemLogs.length === 0 ? (
              <p className="text-[#555] text-xs">No logs recorded yet...</p>
            ) : (
              [...systemLogs].reverse().map((log, i) => (
                <div key={i} className="text-[10px] break-words bg-[#161616] border-l-2 border-[#00E5FF] p-2">
                  <span className="text-[#888]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[#00E5FF] ml-2">[{log.source}]</span>
                  <span className="text-white ml-2">{log.message || (log as any).content || JSON.stringify(log)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl flex flex-col p-4 shadow-lg overflow-hidden">
          <h2 className="text-xs font-bold text-[#888] font-mono mb-4 uppercase tracking-wider">Active Modules Status</h2>
          <div className="space-y-4">
            <StatusRow module="Seismic Data Engine" status="ACTIVE" load="42%" />
            <StatusRow module="Well Logging Array" status="STANDBY" load="0%" />
            <StatusRow module="Swarm Cognitive Core" status="ACTIVE" load="78%" />
            <StatusRow module="Spatial 3D Twin" status="READY" load="12%" />
            <StatusRow module="Electromagnetics" status="OFFLINE" load="0%" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[#111] border border-[#222] p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-[#333] transition-colors">
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} style={{ color }} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs font-mono font-bold uppercase text-[#888]">{label}</span>
      </div>
      <div className="text-3xl font-light font-mono" style={{ color: "white" }}>
        {value}
      </div>
    </div>
  );
}

function StatusRow({ module, status, load }: any) {
  const isActive = status === "ACTIVE";
  const isReady = status === "READY" || status === "STANDBY";
  return (
    <div className="flex items-center justify-between bg-[#161616] p-3 rounded-lg border border-[#333]">
      <div className="flex items-center gap-3">
        {isActive ? (
          <Activity size={14} className="text-[#00E5FF] animate-pulse" />
        ) : isReady ? (
          <CheckCircle2 size={14} className="text-[#39FF14]" />
        ) : (
          <ShieldAlert size={14} className="text-red-500" />
        )}
        <span className="text-sm font-semibold text-white">{module}</span>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="text-[#888]">Load: {load}</span>
        <span className={isActive ? "text-[#00E5FF]" : isReady ? "text-[#39FF14]" : "text-red-500"}>[{status}]</span>
      </div>
    </div>
  );
}
