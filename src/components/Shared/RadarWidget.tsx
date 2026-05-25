import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ShieldAlert, Waves } from 'lucide-react';

export default function RadarWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastEvent, setLastEvent] = useState({
    title: "NORMAL STATUS",
    desc: "No anomalies detected",
    time: "NOW"
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 5;
    let angle = 0;

    // Simulated alerts rotation
    const alerts = [
      { r: radius * 0.45, th: 1.2, text: "TEM-04", level: "critical" },
      { r: radius * 0.75, th: 4.2, text: "TREM-A", level: "warning" },
      { r: radius * 0.25, th: 2.8, text: "MET-B3", level: "normal" }
    ];

    let timer: any;
    const drawRadar = () => {
      // Semi-transparent overlay for trailing sweep effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.fillRect(0, 0, size, size);

      // Radar circles
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(5, center); ctx.lineTo(size - 5, center);
      ctx.moveTo(center, 5); ctx.lineTo(center, size - 5);
      ctx.stroke();

      // Draw alerts on radar target grid
      alerts.forEach((aln) => {
        const ax = center + aln.r * Math.cos(aln.th);
        const ay = center + aln.r * Math.sin(aln.th);

        ctx.fillStyle = aln.level === 'critical' ? '#EF4444' : (aln.level === 'warning' ? '#ffcc00' : '#4ADE80');
        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pulsating coordinate ring around critical alert nodes
        if (aln.level === 'critical') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(ax, ay, 6 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Sweep line
      const sweepX = center + radius * Math.cos(angle);
      const sweepY = center + radius * Math.sin(angle);
      
      const grad = ctx.createLinearGradient(center, center, sweepX, sweepY);
      grad.addColorStop(0, 'rgba(255, 87, 34, 0.05)');
      grad.addColorStop(1, 'rgba(255, 87, 34, 0.6)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      angle += 0.035;
      timer = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    // Event updater simulation loop
    const eventTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * 3);
      if (idx === 0) {
        setLastEvent({
          title: "TREMOR ALERT",
          desc: "Ml 2.4 Tremor detected in Sector 2",
          time: new Date().toLocaleTimeString()
        });
      } else if (idx === 1) {
        setLastEvent({
          title: "SENSORS SYNC",
          desc: "Geophone nodes [10-18] synced",
          time: new Date().toLocaleTimeString()
        });
      } else {
        setLastEvent({
          title: "BAROMETRIC DROP",
          desc: "Pressure dropping: -2.4mb/hr",
          time: new Date().toLocaleTimeString()
        });
      }
    }, 6000);

    return () => {
      cancelAnimationFrame(timer);
      clearInterval(eventTimer);
    };
  }, []);

  const isWarning = lastEvent.title.includes("ALERT") || lastEvent.title.includes("DROP");

  return (
    <div className="bg-black/80 border border-[#333] p-3 rounded-lg shadow-xl w-44 flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-1 border-b border-[#222] pb-1 text-[9px] font-mono text-[#888]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
          SEISMIC RADAR
        </span>
        <span>SCAN ON</span>
      </div>

      <canvas 
        ref={canvasRef} 
        width={100} 
        height={100} 
        className="bg-[#111] border border-[#222] rounded-full my-2 box-border"
      />

      <div className={`w-full p-1.5 rounded text-[8px] font-mono leading-tight ${isWarning ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-green-500/10 border border-green-500/30 text-green-500 animate-pulse'}`}>
        <div className="font-bold flex items-center gap-1">
          {isWarning ? <ShieldAlert size={10} /> : <AlertCircle size={10} />}
          {lastEvent.title}
        </div>
        <p className="text-[7px] text-white/70 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{lastEvent.desc}</p>
      </div>
    </div>
  );
}
