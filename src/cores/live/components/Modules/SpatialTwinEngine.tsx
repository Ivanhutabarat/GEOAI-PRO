import { processIncomingData } from '../Shared/SwarmRoom';
import React, { useRef, useState, useMemo, Component, ReactNode, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, Center } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsJS } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGeoDataStore, LithologyLayer, GeoDataPoint } from '../../store/GeoDataStore';
import { DebugDump } from '../../../../lib/forceRenderMapper';


function MountainVisualization({ payload, planes }: { payload: any, planes: THREE.Plane[] }) {
  const { geometry } = useMemo(() => {
    const segments = 128;
    const geo = new THREE.PlaneGeometry(20, 20, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    let pts: Array<any> = [];
    if (payload?.features && Array.isArray(payload.features)) {
      pts = payload.features;
    } else if (payload?.x && payload?.y && payload?.z) {
      const len = Math.min(payload.x.length, payload.y.length, payload.z.length);
      for(let i=0; i<len; i++) pts.push({x: payload.x[i], y: payload.y[i], z: parseFloat(payload.z[i])||0});
    }

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let yDisp = 0;
      if (pts.length > 0) {
         let distToCenter = Math.sqrt(x*x + z*z);
         let mountainFactor = Math.max(0, 10 - distToCenter) / 10;
         yDisp = (Math.sin(x*1.2) * Math.cos(z*1.2) * 2 + Math.cos(x*2.5)*0.5) * mountainFactor;
         yDisp += Math.max(0, 4 - distToCenter*0.5); 
      } else {
         yDisp = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2 + Math.cos(x * 1.5) * Math.sin(z * 1.5) * 0.5;
         yDisp += Math.max(0, (1 - Math.sqrt(x*x + z*z)/10) * 4); // central peak
      }

      pos.setY(i, yDisp);

      const colorVal = new THREE.Color();
      if (yDisp > 2.5) {
         colorVal.setHex(0xffffff);
      } else if (yDisp > 1.0) {
         colorVal.setHex(0x554433);
      } else if (yDisp > 0.0) {
         colorVal.setHex(0x33aa33);
      } else {
         colorVal.setHex(0x225522);
      }

      colors[i * 3] = colorVal.r;
      colors[i * 3 + 1] = colorVal.g;
      colors[i * 3 + 2] = colorVal.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, [payload]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading roughness={0.8} metalness={0.1} clippingPlanes={planes} />
      </mesh>
    </group>
  );
}

class SceneErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-[#111] text-red-500 font-mono text-xs border border-red-900 rounded p-4 text-center z-50">
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

function PointCloudVisualization({ payload, planes }: { payload: any, planes: THREE.Plane[] }) {
  const pointsData = useMemo(() => {
    let pts: { x: number, y: number, z: number, color: string }[] = [];

    if (payload.features && Array.isArray(payload.features)) {
      pts = payload.features.map((f: any) => ({
        x: Number(f.x) || 0,
        y: Number(f.y) || 0,
        z: Number(f.z) || 0,
        color: f.color || '#00E5FF'
      }));
    } else if (payload.x && payload.y && payload.z) {
      const len = Math.min(payload.x.length, payload.y.length, payload.z.length);
      for (let i = 0; i < len; i++) {
        pts.push({
          x: Number(payload.x[i]) || 0,
          y: Number(payload.y[i]) || 0,
          z: Number(payload.z[i]) || 0,
          color: payload.color?.[i] || '#00E5FF'
        });
      }
    }

    if (pts.length === 0) return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const zs = pts.map(p => p.z);

    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const spanZ = maxZ - minZ || 1;

    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);

    pts.forEach((p, idx) => {
      const mx = -8 + ((p.x - minX) / spanX) * 16;
      const my = -4 + ((p.y - minY) / spanY) * 8;
      const mz = -8 + ((p.z - minZ) / spanZ) * 16;

      positions[idx * 3] = mx;
      positions[idx * 3 + 1] = my;
      positions[idx * 3 + 2] = mz;

      const c = new THREE.Color(p.color);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    });

    return { positions, colors, count: pts.length };
  }, [payload]);

  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (geometryRef.current && pointsData.count > 0) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(pointsData.positions, 3));
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(pointsData.colors, 3));
      geometryRef.current.computeBoundingSphere();
    }
  }, [pointsData]);

  if (pointsData.count === 0) return null;

  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial size={0.5} vertexColors sizeAttenuation transparent opacity={0.9} clippingPlanes={planes} />
    </points>
  );
}

function SeismicPlaneVisualization({ payload, planes }: { payload: any, planes: THREE.Plane[] }) {
  const vp = payload.vp_m_s || [];
  const twt = payload.twt_ms || [];

  const { geometry } = useMemo(() => {
    const segments = 32;
    const geo = new THREE.PlaneGeometry(16, 16, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const avgVp = vp.length > 0 ? vp.reduce((s: number, val: number) => s + val, 0) / vp.length : 2500;
    const avgTwt = twt.length > 0 ? twt.reduce((s: number, val: number) => s + val, 0) / twt.length : 1500;
    
    const freq1 = 0.2 + (avgVp / 15000);
    const freq2 = 0.3 + (avgTwt / 6000);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let yDisp = Math.sin(x * freq1) * Math.cos(z * freq2) * 1.8;
      yDisp += Math.cos(x * freq1 * 2.1) * Math.sin(z * freq2 * 1.8) * 0.5;

      pos.setY(i, yDisp);

      const normalizedHeight = (yDisp + 2.3) / 4.6;
      const capped = Math.max(0, Math.min(1, normalizedHeight));

      const colorVal = new THREE.Color();
      colorVal.setHSL(0.66 * (1 - capped), 1.0, 0.5);

      colors[i * 3] = colorVal.r;
      colors[i * 3 + 1] = colorVal.g;
      colors[i * 3 + 2] = colorVal.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, [vp, twt]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading roughness={0.6} metalness={0.1} clippingPlanes={planes} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} clippingPlanes={planes} />
      </mesh>
    </group>
  );
}

function WellBoreholeVisualization({ payload, planes }: { payload: any, planes: THREE.Plane[] }) {
  const depths = payload.depth_ft || [];
  const gr = payload.gamma_ray_api || [];

  const segments = useMemo(() => {
    if (depths.length === 0) return [];

    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const depthSpan = maxDepth - minDepth || 1;

    const list: { yStart: number; yEnd: number; color: string; grVal: number }[] = [];

    for (let i = 0; i < depths.length - 1; i++) {
      const d1 = depths[i];
      const d2 = depths[i + 1];
      const g = gr[i] !== undefined ? gr[i] : (gr[i - 1] !== undefined ? gr[i - 1] : 50);

      const yStart = 5 - ((d1 - minDepth) / depthSpan) * 10;
      const yEnd = 5 - ((d2 - minDepth) / depthSpan) * 10;

      let segmentColor = '#fcd34d';
      if (g > 100) {
        segmentColor = '#4b5563';
      } else if (g > 60) {
        segmentColor = '#9ca3af';
      } else if (g > 30) {
        segmentColor = '#facc15';
      }

      list.push({ yStart, yEnd, color: segmentColor, grVal: g });
    }

    return list;
  }, [depths, gr]);

  if (segments.length === 0) {
    return (
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 10, 16]} />
        <meshStandardMaterial color="#888888" roughness={0.4} clippingPlanes={planes} />
      </mesh>
    );
  }

  return (
    <group>
      {segments.map((seg, idx) => {
        const height = Math.abs(seg.yStart - seg.yEnd);
        const yPos = (seg.yStart + seg.yEnd) / 2;
        if (height <= 0.01) return null;

        return (
          <mesh key={idx} position={[0, yPos, 0]}>
            <cylinderGeometry args={[0.5, 0.5, height, 16]} />
            <meshStandardMaterial color={seg.color} roughness={0.5} metalness={0.1} clippingPlanes={planes} />
          </mesh>
        );
      })}
    </group>
  );
}

function GeologicalModel({ sliceZ, activePayload }: { sliceZ: number, activePayload: any }) {
  const points = useGeoDataStore(state => state.points);

  const planes = useMemo(() => {
    const zOffset = 12 - (sliceZ / 100) * 24;
    return [new THREE.Plane(new THREE.Vector3(0, 0, -1), zOffset)];
  }, [sliceZ]);

  const isScenarioA = useMemo(() => {
    if (!activePayload) return false;
    if (activePayload.geometry_type === "Raw Point Cloud 3D") return true;
    if (activePayload.features && Array.isArray(activePayload.features)) return true;
    if (activePayload.x && activePayload.y && activePayload.z) return true;
    return false;
  }, [activePayload]);

  const isScenarioB = useMemo(() => {
    if (!activePayload) return false;
    return activePayload.vp_m_s && activePayload.twt_ms;
  }, [activePayload]);

  const isScenarioC = useMemo(() => {
    if (!activePayload) return false;
    return activePayload.depth_ft && activePayload.gamma_ray_api;
  }, [activePayload]);

  const isTopography = useMemo(() => {
    if (!activePayload) return false;
    if (activePayload.geometry_type === "Topography 3D" || activePayload.geometry_type === "Elevation Grid") return true;
    return false;
  }, [activePayload]);

  if (isTopography) {
    return <MountainVisualization payload={activePayload} planes={planes} />;
  }

  if (isScenarioA) {
    return <PointCloudVisualization payload={activePayload} planes={planes} />;
  }

  if (isScenarioB) {
    return <SeismicPlaneVisualization payload={activePayload} planes={planes} />;
  }

  if (isScenarioC) {
    return <WellBoreholeVisualization payload={activePayload} planes={planes} />;
  }

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[16, 8, 16]} />
        <meshBasicMaterial color="#FF5722" wireframe transparent opacity={0.15} />
      </mesh>

      {points.length > 0 && (
         <group>
          {points.map((pt) => {
            const [x, y, z] = pt.position;
            return (
              <mesh key={pt.id} position={[x, y, z]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color={pt.color} emissive={pt.color} emissiveIntensity={0.6} clippingPlanes={planes} />
              </mesh>
            );
          })}
         </group>
      )}
    </group>
  );
}

function SafeOrbitControls(props: any) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsJS | null>(null);

  useEffect(() => {
    // Component Mount Guard: check that gl and its domElement are available
    if (!gl || !gl.domElement) return;

    const controls = new OrbitControlsJS(camera, gl.domElement);
    controlsRef.current = controls;

    if (props.enableDamping !== undefined) controls.enableDamping = props.enableDamping;
    if (props.dampingFactor !== undefined) controls.dampingFactor = props.dampingFactor;
    if (props.maxPolarAngle !== undefined) controls.maxPolarAngle = props.maxPolarAngle;
    if (props.minPolarAngle !== undefined) controls.minPolarAngle = props.minPolarAngle;
    if (props.enableZoom !== undefined) controls.enableZoom = props.enableZoom;
    if (props.enablePan !== undefined) controls.enablePan = props.enablePan;
    if (props.enableRotate !== undefined) controls.enableRotate = props.enableRotate;

    return () => {
      // Always dispose controls on unmount, even if DOM is already detached/modified
      if (controlsRef.current) {
        try {
          controlsRef.current.dispose();
        } catch (e) {
          console.warn("Deferred OrbitControls disposal cleaner:", e);
        }
        controlsRef.current = null;
      }
    };
  }, [camera, gl, props.enableDamping, props.dampingFactor, props.maxPolarAngle, props.minPolarAngle, props.enableZoom, props.enablePan, props.enableRotate]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
}


export default function SpatialTwinEngine({ sliceZ, activePayload, eventSource }: { sliceZ: number, activePayload: any, eventSource: HTMLDivElement | null }) {
  const points = useGeoDataStore(state => state.points);
  return (
    <SceneErrorBoundary>
      <DebugDump data={[]} forceShow={false} />
      <Canvas eventSource={eventSource || undefined} camera={{ position: [18, 12, 18], fov: 42 }} gl={{ localClippingEnabled: true, antialias: true }}>
        <color attach="background" args={['#070709']} />
        <fog attach="fog" args={['#070709', 20, 60]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} color="#fff1e6" />
        <pointLight position={[-15, -5, -15]} intensity={1.0} color="#b8c5e6" />
        <Center>
          <GeologicalModel sliceZ={sliceZ} activePayload={activePayload} />
        </Center>
        <Grid infiniteGrid fadeDistance={40} fadeStrength={5} cellColor="#222" sectionColor="#333" position={[0, -5, 0]} />
        <SafeOrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </SceneErrorBoundary>
  );
}