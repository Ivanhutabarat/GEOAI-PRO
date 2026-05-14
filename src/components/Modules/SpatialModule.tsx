import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Box, 
  Map as MapIcon, 
  Layers, 
  Maximize2, 
  Download, 
  Zap, 
  ChevronRight,
  Globe,
  Mountain
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SpatialModule() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Terrain Geometry (Grid representing Spatial/GeoTIFF)
    const geometry = new THREE.PlaneGeometry(30, 30, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x222222,
      wireframe: true,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    
    // Add height variations (Mocking terrain data)
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i);
        const z = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 2 + (Math.random() * 0.2);
        vertices.setZ(i, z);
    }
    vertices.needsUpdate = true;
    scene.add(terrain);

    // Geological Anomalies (Cubes representing subsurface detections)
    const anomalyGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const anomalyGeom = new THREE.BoxGeometry(2, 4, 2);
        const anomalyMat = new THREE.MeshPhongMaterial({ 
            color: 0xFF5722, 
            transparent: true, 
            opacity: 0.6,
            emissive: 0xFF5722,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(anomalyGeom, anomalyMat);
        mesh.position.set(
            (Math.random() - 0.5) * 20,
            -2,
            (Math.random() - 0.5) * 20
        );
        anomalyGroup.add(mesh);
    }
    scene.add(anomalyGroup);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x333333, 0x111111);
    scene.add(gridHelper);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden">
        {/* Module Toolbar */}
        <div className="h-12 border-b border-[#333333] flex items-center justify-between px-4 bg-[#222222]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <MapIcon size={16} className="text-[#8BC34A]" />
                    <span className="text-xs font-bold uppercase font-mono tracking-tight text-white">Project_Spatial_Grid.tiff // 3D Modeling</span>
                </div>
                <div className="h-4 w-px bg-[#333333]"></div>
                <div className="flex items-center gap-2 text-[10px] text-[#888888]">
                    <span className="bg-[#8BC34A] px-1.5 py-0.5 rounded text-white font-bold">SPATIAL-SYNC</span>
                    <span>CRS: WGS-84 // SCALE: 1:5000</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-[#333333] rounded overflow-hidden p-0.5 bg-black/40">
                    <button 
                        onClick={() => setShowTerrain(!showTerrain)}
                        className={cn("px-2 py-1 text-[9px] font-bold uppercase transition-colors", showTerrain ? "bg-[#8BC34A] text-black" : "text-[#555555]")}
                    >
                        Terrain
                    </button>
                    <button 
                        onClick={() => setShowAnomalies(!showAnomalies)}
                        className={cn("px-2 py-1 text-[9px] font-bold uppercase transition-colors", showAnomalies ? "bg-[#FF5722] text-black" : "text-[#555555]")}
                    >
                        Anomalies
                    </button>
                </div>
                <div className="h-4 w-px bg-[#333333]"></div>
                <button className="p-2 hover:bg-white/5 text-[#888888] rounded"><Download size={14} /></button>
                <button className="p-2 hover:bg-white/5 text-[#888888] rounded"><Maximize2 size={14} /></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* 3D Viewport */}
            <div className="flex-1 relative">
                <div ref={containerRef} className="w-full h-full" />
                
                {/* HUD Elements */}
                <div className="absolute left-6 bottom-6 space-y-2">
                    <div className="bg-black/60 backdrop-blur-md p-3 border border-[#333333] rounded">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8BC34A] uppercase mb-1">
                            <Zap size={10} />
                            Render Engine active
                        </div>
                        <p className="text-[14px] font-mono font-bold text-white tracking-tighter">FPS: 60.0 // WEBGL_2.0</p>
                    </div>
                </div>
            </div>

            {/* Spatial Data Sidebar */}
            <div className="w-64 border-l border-[#333333] p-4 bg-[#111111]/50 space-y-6">
                <div>
                   <h4 className="text-[10px] font-bold uppercase text-[#555555] tracking-widest mb-4">Layers Catalog</h4>
                   <div className="space-y-1">
                        <LayerItem icon={Mountain} label="Digital Elevation Model" active />
                        <LayerItem icon={Globe} label="Satellite Overlay (jp2)" />
                        <LayerItem icon={Layers} label="Subsurface Horizons" />
                        <LayerItem icon={Box} label="SHP Vector Boundaries" active />
                   </div>
                </div>

                <div>
                    <h4 className="text-[10px] font-bold uppercase text-[#555555] tracking-widest mb-4">Spatial Metrics</h4>
                    <div className="bg-[#222] p-3 rounded space-y-2 border border-[#333]">
                        <Metric label="Max Elevation" value="1,240m" />
                        <Metric label="Survey Area" value="12.5 KM²" />
                        <Metric label="GCP Count" value="42" />
                    </div>
                </div>

                <div className="p-4 bg-[#FF5722]/5 border border-[#FF5722]/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-[#FF5722]" />
                        <span className="text-[10px] font-bold text-[#FF5722] uppercase tracking-tight">Anomaly detected</span>
                    </div>
                    <p className="text-[11px] text-[#888888] leading-tight">
                        Point cloud analysis suggests structural instability in Sector 4B. 
                        Recommend immediate ground survey validation.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}

function LayerItem({ icon: Icon, label, active = false }: any) {
    return (
        <label className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-3">
                <Icon size={14} className={active ? "text-[#8BC34A]" : "text-[#444]"} />
                <span className={cn("text-xs font-bold transition-colors uppercase tracking-tight", active ? "text-white" : "text-[#555] group-hover:text-[#888]")}>{label}</span>
            </div>
            <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", active ? "bg-[#8BC34A] border-[#8BC34A]" : "border-[#333]")}>
                {active && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
        </label>
    );
}

function Metric({ label, value }: any) {
    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-[#555] font-bold uppercase text-[10px] tracking-tight">{label}</span>
            <span className="text-white font-mono">{value}</span>
        </div>
    );
}
