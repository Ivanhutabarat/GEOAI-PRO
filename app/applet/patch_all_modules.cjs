const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'cores', 'live', 'components', 'Modules');
const sharedSwarmRel = '../Shared/SwarmRoom';

const modules = fs.readdirSync(modulesDir).filter(f => f.endsWith('.tsx'));

const getPayloadName = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.includes('well')) return 'wellLoggingPayload';
  if (lower.includes('seismic')) return 'seismicPayload';
  if (lower.includes('geomech')) return 'geomechanicsPayload';
  if (lower.includes('gravity')) return 'gravityMagneticPayload';
  if (lower.includes('electrical')) return 'electricalPayload';
  if (lower.includes('fluid')) return 'fluidIdPayload';
  if (lower.includes('gpr')) return 'gprPayload';
  if (lower.includes('rockgeo')) return 'rockGeochemPayload';
  if (lower.includes('meteor')) return 'meteorologyPayload';
  if (lower.includes('groundwater')) return 'groundwaterPayload';
  if (lower.includes('soil')) return 'soilPhPayload';
  if (lower.includes('gasair')) return 'gasQualityPayload';
  if (lower.includes('spatial')) return 'spatialPayload';
  return 'generalPayload';
};

const getContextKey = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.includes('well')) return 'wellLoggingData';
  if (lower.includes('seismic')) return 'seismicData';
  if (lower.includes('geomech')) return 'tiltExtensoData'; // Wait, let's look at GlobalGeoContext. tiltExtenso or what? Let me be careful here...
};

modules.forEach(mod => {
  const filePath = path.join(modulesDir, mod);
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject import
  if (!content.includes('processIncomingData')) {
    const importStatement = `import { processIncomingData } from '../Shared/SwarmRoom';\n`;
    content = content.replace(/(import .*?\n)+/, `$&${importStatement}`);
  }

  // Ensure rawPayloads is destructured from useGlobalGeoContext
  if (content.includes('const { globalData') && !content.includes('rawPayloads')) {
    content = content.replace(/const\s*{\s*([^}]*?)globalData([^}]*?)\s*}\s*=\s*useGlobalGeoContext\(\);/, (match) => {
      if (match.includes('rawPayloads')) return match;
      return match.replace('globalData', 'globalData, rawPayloads');
    });
  }

  // Find the context key via useMemo. Like: (globalData.wellLoggingData && ... ? globalData.wellLoggingData
  let ctxKeyMatch = content.match(/globalData\.([a-zA-Z0-9_]+Data)/);
  if (ctxKeyMatch) {
    const ctxKey = ctxKeyMatch[1];
    const payloadRegex = /:\s*([a-zA-Z0-9_]+Payload);/;
    const payloadMatch = content.match(payloadRegex);
    let payloadName = payloadMatch ? payloadMatch[1] : getPayloadName(mod);

    // Replace the useMemo block
    const oldMemoRegex = /const chartData = useMemo\(\(\) => \{[\s\S]*?\}, \[globalData\.[a-zA-Z0-9_]+Data\]\);/g;
    
    const newMemo = `const chartData = useMemo(() => {
    if (rawPayloads && rawPayloads.${ctxKey}) {
      const result = processIncomingData(rawPayloads.${ctxKey});
      if (result && result.data && result.data.length > 0) {
        return result.data;
      }
    }
    return (globalData.${ctxKey} && globalData.${ctxKey}.length > 0) 
      ? globalData.${ctxKey} 
      : ${payloadName};
  }, [globalData.${ctxKey}, rawPayloads?.${ctxKey}]);`;

    content = content.replace(oldMemoRegex, newMemo);
  }

  fs.writeFileSync(filePath, content);
  console.log('Patched ' + mod);
});
