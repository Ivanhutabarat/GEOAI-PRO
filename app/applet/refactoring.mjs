import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const refactorSwarmRoom = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  const calcRegex = /const calcWellLogging = \(role[\s\S]*?const generateCalculatedDummy[\s\S]*?Deviasi operasional standar.*?;\n\s*\};/g;
  
  let extractedPart = '';
  content = content.replace(calcRegex, (match) => {
    extractedPart = match;
    return '';
  });

  const exportGateway = `
export const processIncomingData = (promptText: string) => {
  const jsonMatch = promptText.match(/\\[\\s*\\{[^\\]]*\\}\\s*\\]/g);
  if (!jsonMatch) return null;
  
  let data = [];
  try {
    data = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(data)) data = [data];
  } catch (e) { return null; }

  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const keysStr = keys.join("_").toLowerCase();
  
  return { data, keys, keysStr };
};
`;

  let newGenerate = `
export const generateCalculatedDummy = (agentRole: string, promptText: string) => {
  const result = processIncomingData(promptText);
  if (!result) return "[MATH CORE] Menunggu matriks data yang valid.";
  
  const { data, keysStr } = result;

  if (keysStr.includes("gamma")) return calcWellLogging(agentRole, data);
  if (keysStr.includes("amplitudo")) return calcSeismic(agentRole, data);
  if (keysStr.includes("pore_pressure")) return calcGeomechanics(agentRole, data);
  if (keysStr.includes("bouguer")) return calcGravityMagnetic(agentRole, data);
  if (keysStr.includes("resistivitas_semu")) return calcElectrical(agentRole, data);
  if (keysStr.includes("poisson")) return calcFluidID(agentRole, data);
  if (keysStr.includes("waktu_ns")) return calcGPR(agentRole, data);
  if (keysStr.includes("au_ppb") || keysStr.includes("cu_ppm") || keysStr.includes("sampel_id")) return calcRockGeochem(agentRole, data);
  if (keysStr.includes("kecepatan_angin") || keysStr.includes("suhu_c") || keysStr.includes("jam_ke")) return calcMeteorology(agentRole, data);
  if (keysStr.includes("level_air") || (keysStr.includes("waktu_jam") && keysStr.includes("transmisivitas"))) return calcGroundwater(agentRole, data);
  if (keysStr.includes("ph_tanah") || keysStr.includes("titik_bor")) return calcSoilEnv(agentRole, data);
  if (keysStr.includes("h2s_ppm") || (keysStr.includes("waktu_jam") && keysStr.includes("co2"))) return calcGasAirQuality(agentRole, data);
  if (keysStr.includes("subsidence") || keysStr.includes("elevasi")  || (keysStr.includes("lokasi_id"))) return calcSpatial(agentRole, data);

  return "[MATH CORE] Modul terhubung, namun parameter rumus belum didefinisikan.";
};
`;

  const justCalcFunctionsRegex = /const calcWellLogging = \(role[\s\S]*?Konversi triangulasi spasial kohesi selesai.*?\n\};/g;
  let justCalcs = '';
  extractedPart.replace(justCalcFunctionsRegex, (match) => {
    justCalcs = match;
  });

  const insertPayload = exportGateway + "\n" + justCalcs + "\n" + newGenerate + "\n";
  content = content.replace('export default function SwarmRoom', insertPayload + 'export default function SwarmRoom');

  fs.writeFileSync(filePath, content);
  console.log('Refactored ' + filePath);
};

refactorSwarmRoom(path.join(__dirname, 'src', 'cores', 'live', 'components', 'Shared', 'SwarmRoom.tsx'));
refactorSwarmRoom(path.join(__dirname, 'src', 'cores', 'dummy', 'components', 'Shared', 'SwarmRoom.tsx'));
