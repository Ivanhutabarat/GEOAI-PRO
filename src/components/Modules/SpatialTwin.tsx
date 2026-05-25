// src/components/Modules/SpatialTwin.tsx
import React, { useRef, useState, useMemo, Component, ReactNode, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Grid, Center, Text } from '@react-three/drei';
import { useGeoDataStore } from '../../store/GeoDataStore';
import SpatialControlPanel from './SpatialControlPanel';

class SceneErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
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
        <div className="flex items-center justify-center h-full w-full bg-[#111] text-red-500 font-mono text-xs border border-red-900 rounded p-4 text-center">
          <div>
            <p className="font-bold mb-2 uppercase">3D Scene Mount Failure</p>
            <p className="text-[#888]">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import * as THREE from 'three';
import { Layers, Maximize, Settings } from 'lucide-react';

function BlockLayer({ position, size, color, wireframeColor, planes }: any) {
  return (
    <group position={position}>
      <mesh clippingPlanes={planes}>
        <boxGeometry args={[...size, 4, 1, 4]} />
        <meshStandardMaterial color={color} flatShading side={THREE.DoubleSide} clipIntersection={false} />
      </mesh>
      <mesh clippingPlanes={planes}>
        <boxGeometry args={[...size, 16, 1, 16]} />
        <meshBasicMaterial color={wireframeColor} wireframe opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

function GeologicalModel({ sliceZ }: { sliceZ: number }) {
  const points = useGeoDataStore(state => state.points);

  const planes = useMemo(() => {
    // Map sliceZ (0 to 100) to Z coordinate (+5 to -5)
    // Positive Z is towards the camera, meaning a plane facing (0,0,-1) clips items in front.
    const zOffset = 5 - (sliceZ / 100) * 10;
    return [new THREE.Plane(new THREE.Vector3(0, 0, -1), zOffset)];
  }, [sliceZ]);

  return (
    <group>
      {/* Top Layer (Yellow) */}
      <BlockLayer position={[0, 2, 0]} size={[10, 2, 10]} color="#d4c919" wireframeColor="#333333" planes={planes} />
      {/* Middle Layer (Red/Orange) */}
      <BlockLayer position={[0, 0, 0]} size={[10, 2, 10]} color="#c93c1e" wireframeColor="#333333" planes={planes} />
      {/* Bottom Layer (Purple) */}
      <BlockLayer position={[0, -2, 0]} size={[10, 2, 10]} color="#821ec9" wireframeColor="#333333" planes={planes} />

      {/* Render Custom Points if any */}
      {points.length > 0 && (
         <group>
          {points.map((pt) => {
            const [x, y, z] = pt.position;
            return (
              <mesh key={pt.id} position={[x, y, z]} clippingPlanes={planes}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color={pt.color} emissive={pt.color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
              </mesh>
            );
          })}
         </group>
      )}
    </group>
  );
}

export default function SpatialTwin() {
  const [sliceZ, setSliceZ] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#f4f6f8] overflow-hidden rounded-xl border border-gray-200 shadow-sm relative">
      {/* Header Panel */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            <Layers size={18} />
          </div>
          <div>
            <span className="font-bold text-gray-800 text-sm tracking-wide flex items-center gap-2">
              3D GEOLOGICAL MODEL 
            </span>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Live Rendering</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1 items-end">
            <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">Front Slicer (%)</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliceZ} 
              onChange={(e) => setSliceZ(Number(e.target.value))}
              className="accent-blue-600 w-32"
            />
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <button 
            onClick={() => setShowPanel(!showPanel)}
            className={`p-2 rounded-md transition-colors focus:outline-none flex items-center justify-center ${showPanel ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-gray-500 border border-transparent hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <Settings size={16} />
          </button>
          <button className="p-2 bg-white border border-transparent hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-md transition-colors focus:outline-none">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative cursor-crosshair w-full" style={{ minHeight: '500px' }}>
        {showPanel && <SpatialControlPanel onClose={() => setShowPanel(false)} />}
        
        <SceneErrorBoundary>
          <Canvas camera={{ position: [14, 10, 14], fov: 45 }} gl={{ localClippingEnabled: true }}>
            <color attach="background" args={['#e5e7eb']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
            
            <Center>
              <GeologicalModel sliceZ={sliceZ} />
            </Center>
            
            <Grid infiniteGrid fadeDistance={50} fadeStrength={5} cellColor="#9ca3af" sectionColor="#6b7280" position={[0, -3.1, 0]} />
            
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 + 0.1} />
          </Canvas>
        </SceneErrorBoundary>
        
        {/* Color Scale Legend */}
        <div className="absolute bottom-6 left-6 pointer-events-none z-10">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 p-4 rounded-lg shadow-lg font-sans text-xs">
             <div className="font-bold text-gray-700 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Lithology Legend</div>
             <div className="flex flex-col gap-2.5">
               <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#d4c919' }}></div>
                 <span className="text-gray-600 font-medium">Top Layer (Sand/Clay)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#c93c1e' }}></div>
                 <span className="text-gray-600 font-medium">Middle Layer (Sandstone)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#821ec9' }}></div>
                 <span className="text-gray-600 font-medium">Base Layer (Bedrock)</span>
               </div>
             </div>
             <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono gap-4">
               <span>XYZ GRID ACCURACY: HIGH</span>
               <span>v1.2.0</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
