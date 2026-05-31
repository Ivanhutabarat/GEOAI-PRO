const fs = require('fs');
const path = require('path');

function processCore(corePath) {
    const spatialTwinPath = path.join(corePath, 'SpatialTwin.tsx');
    const spatialTwinEnginePath = path.join(corePath, 'SpatialTwinEngine.tsx');
    if (!fs.existsSync(spatialTwinPath)) return;

    let content = fs.readFileSync(spatialTwinPath, 'utf8');

    if (content.includes('SpatialTwinEngine')) return;

    const imports = `import React, { useRef, useState, useMemo, Component, ReactNode, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, Center } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsJS } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGeoDataStore, LithologyLayer, GeoDataPoint } from '../../store/GeoDataStore';
import { DebugDump } from '../../../../lib/forceRenderMapper';
`;

    const mountainVis = `
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
`;
    
    let extractedComponents = '';
    const startExtract = content.indexOf('class SceneErrorBoundary');
    const endExtract = content.indexOf('export default function SpatialTwin');

    if (startExtract !== -1 && endExtract !== -1) {
        extractedComponents = content.substring(startExtract, endExtract);
        content = content.substring(0, startExtract) + content.substring(endExtract);
    }

    extractedComponents = extractedComponents.replace(
      /if \(isScenarioA\)/,
      `const isTopography = useMemo(() => {
    if (!activePayload) return false;
    if (activePayload.geometry_type === "Topography 3D" || activePayload.geometry_type === "Elevation Grid") return true;
    return false;
  }, [activePayload]);

  if (isTopography) {
    return <MountainVisualization payload={activePayload} planes={planes} />;
  }

  if (isScenarioA)`
    );
    
    extractedComponents = mountainVis + '\n' + extractedComponents;

    const parseFunc = `const parseInputData = (rawText: string): any => {
  if (!rawText || rawText.trim() === "") return null;
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const lines = rawText.trim().split('\\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const isCsv = lines.some((line: string) => line.includes(','));
    if (isCsv) {
      const features = lines.map((line: string) => {
        const parts = line.split(',').map((p: string) => p.trim());
        return {
          x: parseFloat(parts[0]) || 0,
          y: parseFloat(parts[1]) || 0,
          z: parseFloat(parts[2]) || 0,
          color: parts[3] || '#00E5FF'
        };
      });
      return { geometry_type: "Raw Point Cloud 3D", source: "Auto-Parsed CSV", data_points: features.length, features: features };
    }
    return null;
  }
};\n\n`;

    // Wait, parseInputData is also needed by SpatialTwin.tsx, so we should keep it in SpatialTwin.tsx or just let the split handle it.
    // In our split, `parseInputData` was extracted. Let's make sure it's in SpatialTwin as well, or just kept in SpatialTwin!
    // The previous code had `parseInputData` right before `export default function SpatialTwin`.
    // Let's just put it back to SpatialTwin!
    extractedComponents = extractedComponents.replace(/const parseInputData = [\s\S]*?};\n/, '');

    const engineComponent = `
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
}`;

    const fullEngineCode = imports + '\n' + extractedComponents + engineComponent;
    
    // Put parseInputData back into SpatialTwin
    content = content.replace('export default function SpatialTwin', parseFunc + 'export default function SpatialTwin');

    content = content.replace(
      /<SceneErrorBoundary>[\s\S]*?<\/SceneErrorBoundary>/,
      `<Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[#ff5722] font-mono text-xs">Booting 3D Render Engine...</div>}>
          <SpatialTwinEngine sliceZ={sliceZ} activePayload={activePayload} eventSource={eventSource} />
        </Suspense>`
    );

    const extraImports = `import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';\nconst SpatialTwinEngine = React.lazy(() => import('./SpatialTwinEngine'));\n`;
    content = content.replace(/import React, \{[^\}]+\} from 'react';/, extraImports);

    content = content.replace(/import \{ Canvas, useFrame, useThree \} from '@react-three\/fiber';\n/, '');
    content = content.replace(/import \{ Grid, Center \} from '@react-three\/drei';\n/, '');
    content = content.replace(/import \* as THREE from 'three';\n/, '');
    content = content.replace(/import \{ OrbitControls as OrbitControlsJS \} from 'three\/examples\/jsm\/controls\/OrbitControls\.js';\n/, '');
    content = content.replace(/import \{ forceMapData, DebugDump \} from '..\/..\/..\/..\/lib\/forceRenderMapper';\n/, '');

    fs.writeFileSync(spatialTwinEnginePath, fullEngineCode);
    fs.writeFileSync(spatialTwinPath, content);
    console.log('Patched SpatialTwin in ' + corePath);
}

processCore('src/cores/dummy/components/Modules');
processCore('src/cores/live/components/Modules');
