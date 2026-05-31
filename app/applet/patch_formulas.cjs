const fs = require('fs');

function patchFormulas(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const startIndex = content.indexOf('const calcWellLogging = (role: string, data: any[]) => {');
  if (startIndex === -1) {
    console.log("Could not find start index in " + filePath);
    return;
  }

  const endSearchStr = 'const calcSpatial = (role: string, data: any[]) => {';
  const endSearchStrIdx = content.indexOf(endSearchStr, startIndex);
  
  if (endSearchStrIdx === -1) {
    console.log("Could not find end search string in " + filePath);
    return;
  }

  const endMarkerIdx = content.indexOf('};', endSearchStrIdx);
  if (endMarkerIdx === -1) {
    console.log("Could not find end marker in " + filePath);
    return;
  }
  
  const finishIndex = endMarkerIdx + 2;
  const blockToReplace = content.substring(startIndex, finishIndex);

  const newBlock = `const calcWellLogging = (role: string, data: any[]) => {
  const phi = data.length ? data.map(d => Number(d.porositas || d.porosity || 0.2)).reduce((a,b)=>a+b)/data.length : 0.2;
  const rt = data.length ? data.map(d => Number(d.resistivitas || d.resistivity_ohm_m || d.resistivitas_ohm || 20)).reduce((a,b)=>a+b)/data.length : 20;
  const rw = 0.05, a = 1, m = 2, n = 2; // Default Archie param
  const sw = Math.pow((a * rw) / (Math.pow(phi, m) * (rt || 1)), 1/n);
  const isAlert = sw > 0.8;
  return \`[MATH CORE - \${role}] Archie's Law (Sw) = \${sw.toFixed(4)}. \${isAlert ? 'CRITICAL ALERT: Saturasi air tinggi.' : 'Indikasi hidrokarbon komersial.'}\`;
};

const calcSeismic = (role: string, data: any[]) => {
  const vel = data.length ? data.map(d => Number(d.kecepatan_vp || d.velocity || 2500)).reduce((a,b)=>a+b)/data.length : 2500;
  const den = data.length ? data.map(d => Number(d.densitas || d.density || 2.2)).reduce((a,b)=>a+b)/data.length : 2.2;
  const z = den * vel;
  const isAlert = z < 4000;
  return \`[MATH CORE - \${role}] Acoustic Impedance: \${z.toFixed(2)} Rayls. \${isAlert ? 'CRITICAL ALERT: Anomali impedansi rendah (gas sand possible).' : 'Struktur kompak.'}\`;
};

const calcGeomechanics = (role: string, data: any[]) => {
  const pp = data.length ? data.map(d => Number(d.pore_pressure || d.pressure || 4000)).reduce((a,b)=>a+b)/data.length : 4000;
  const depth = data.length ? data.map(d => Number(d.kedalaman_m || d.kedalaman || d.tvd || 1000)).reduce((a,b)=>a+b)/data.length : 1000;
  const ppg = pp / (depth || 1);
  const isAlert = ppg > 0.6;
  return \`[MATH CORE - \${role}] Pore Pressure Gradient = \${ppg.toFixed(3)} psi/ft. \${isAlert ? 'CRITICAL ALERT: Overpressure zone terdeteksi.' : 'Gradien normal.'}\`;
};

const calcGravityMagnetic = (role: string, data: any[]) => {
  const g_obs = data.length ? data.map(d => Number(d.bouguer || d.bouguer_anomaly || d.anomali_bouguer || 50)).reduce((a,b)=>a+b)/data.length : 50;
  const h = data.length ? data.map(d => Number(d.elevasi || d.elevation || 100)).reduce((a,b)=>a+b)/data.length : 100;
  const density = 2.67; 
  const bouguer = g_obs + (0.3086 - 0.0419 * density) * h;
  const isAlert = Math.abs(bouguer) > 100;
  return \`[MATH CORE - \${role}] Bouguer Anomaly = \${bouguer.toFixed(2)} mGal. \${isAlert ? 'CRITICAL ALERT: Anomali gravitasi ekstrem.' : 'Respons batuan dasar stabil.'}\`;
};

const calcElectrical = (role: string, data: any[]) => {
  const v = data.length ? data.map(d => Number(d.potensial || d.voltage || 10)).reduce((a,b)=>a+b)/data.length : 10;
  const i = data.length ? data.map(d => Number(d.arus || d.current || 2)).reduce((a,b)=>a+b)/data.length : 2;
  const k = 1.5; // Geometric factor
  const rho = k * (v / (i || 1));
  const isAlert = rho < 10;
  return \`[MATH CORE - \${role}] Apparent Resistivity = \${rho.toFixed(2)} Ohm-m. \${isAlert ? 'CRITICAL ALERT: Tahanan jenis sangat rendah (fluid konduktif/mineral).' : 'Batuan resistif.'}\`;
};

const calcFluidID = (role: string, data: any[]) => {
  const vp = data.length ? data.map(d => Number(d.vp || d.p_wave || 3000)).reduce((a,b)=>a+b)/data.length : 3000;
  const vs = data.length ? data.map(d => Number(d.vs || d.s_wave || 1500)).reduce((a,b)=>a+b)/data.length : 1500;
  const ratio = (vp / (vs || 1));
  const ratioSq = ratio * ratio;
  const pr = (ratioSq - 2) / ( 2 * (ratioSq - 1) );
  const isAlert = pr > 0.4;
  return \`[MATH CORE - \${role}] Poisson Ratio = \${pr.toFixed(3)}. \${isAlert ? 'CRITICAL ALERT: Formasi plastis/shale tinggi.' : 'Indikasi fluida/gas.'}\`;
};

const calcGPR = (role: string, data: any[]) => {
  const t = data.length ? data.map(d => Number(d.waktu_ns || d.time || 50)).reduce((a,b)=>a+b)/data.length * 1e-9 : 50e-9;
  const d_m = data.length ? data.map(d => Number(d.kedalaman || d.kedalaman_m || 2)).reduce((a,b)=>a+b)/data.length : 2;
  const c = 3e8; // speed of light
  const eps = Math.pow((c * t) / (2 * (d_m || 1)), 2);
  const isAlert = eps > 50;
  return \`[MATH CORE - \${role}] Dielectric Constant = \${eps.toFixed(2)}. \${isAlert ? 'CRITICAL ALERT: Zona basah/konduktif dangkal.' : 'Medium normal.'}\`;
};

const calcRockGeochem = (role: string, data: any[]) => {
  const grade = data.length ? data.map(d => Number(d.au_ppb || d.cu_ppm || d.kadar || 5)).reduce((a,b)=>a+b)/data.length : 5;
  const rec = 0.85;
  const price = 60; // assumed unit price
  const cost = 200;
  const val = (grade * rec * price) - cost;
  const isAlert = val < 0;
  return \`[MATH CORE - \${role}] Ore Cut-off Value = \${val.toFixed(2)} USD. \${isAlert ? 'CRITICAL ALERT: Tidak ekonomis.' : 'Lebih dari nilai cut-off (Ekonomis).'}\`;
};

const calcMeteorology = (role: string, data: any[]) => {
  const temp = data.length ? data.map(d => Number(d.suhu_c || d.temp || 30)).reduce((a,b)=>a+b)/data.length : 30;
  const wind = data.length ? data.map(d => Number(d.kecepatan_angin || d.wind_speed || 15)).reduce((a,b)=>a+b)/data.length : 15;
  const idx = temp - (0.7 * wind);
  const isAlert = idx < 10 || wind > 40;
  return \`[MATH CORE - \${role}] Wind Chill/Storm Index = \${idx.toFixed(2)}. \${isAlert ? 'CRITICAL ALERT: Kondisi cuaca ekstrem area operasi.' : 'Cuaca operasional aman.'}\`;
};

const calcGroundwater = (role: string, data: any[]) => {
  const k = data.length ? data.map(d => Number(d.permeabilitas || d.k || d.transmisivitas || 0.5)).reduce((a,b)=>a+b)/data.length : 0.5;
  const dhdl = 0.02; // gradient
  const a = 100; // area
  const q = -k * a * dhdl;
  const isAlert = Math.abs(q) > 5;
  return \`[MATH CORE - \${role}] Darcy's Law Q = \${q.toFixed(3)} m3/d. \${isAlert ? 'CRITICAL ALERT: Kebocoran / aliran tinggi terdeteksi.' : 'Akuifer stabil.'}\`;
};

const calcSoilEnv = (role: string, data: any[]) => {
  const ph = data.length ? data.map(d => Number(d.ph_tanah || d.ph || 6)).reduce((a,b)=>a+b)/data.length : 6;
  const h_plus = Math.pow(10, -ph);
  const isAlert = ph < 4;
  return \`[MATH CORE - \${role}] H+ Concentration = \${h_plus.toExponential(3)} M. \${isAlert ? 'CRITICAL ALERT: Asam ekstrem, korosi peralatan bor!' : 'pH tanah standar toleransi.'}\`;
};

const calcGasAirQuality = (role: string, data: any[]) => {
  const conc = data.length ? data.map(d => Number(d.h2s_ppm || d.ch4_ppm || d.gas || d.co2 || 5)).reduce((a,b)=>a+b)/data.length : 5;
  const lel_limit = 100; 
  const lel = (conc / lel_limit) * 100;
  const isAlert = conc > 10;
  return \`[MATH CORE - \${role}] LEL Safety = \${lel.toFixed(2)}% | Conc: \${conc.toFixed(2)} ppm. \${isAlert ? 'CRITICAL ALERT: H2S/Gas BERACUN MENGORBANKAN KESELAMATAN (Evakuasi segera!).' : 'Ambang batas gas aman.'}\`;
};

const calcSpatial = (role: string, data: any[]) => {
  const r = data.length ? data.map(d => Number(d.subsidence || d.penurunan || d.elevasi || 0)).reduce((a,b)=>a+b)/data.length : 0;
  const isAlert = Math.abs(r) > 0.05;
  return \`[MATH CORE - \${role}] Subsidence Rate/Trend = \${r.toFixed(4)}. \${isAlert ? 'CRITICAL ALERT: Penurunan tanah rawan.' : 'Stabilitas permukaan dapat diterima.'}\`;
};`;

  content = content.replace(blockToReplace, newBlock);
  fs.writeFileSync(filePath, content);
  console.log("Patched formulas in " + filePath);
}

patchFormulas('src/cores/live/components/Shared/SwarmRoom.tsx');
patchFormulas('src/cores/dummy/components/Shared/SwarmRoom.tsx');
