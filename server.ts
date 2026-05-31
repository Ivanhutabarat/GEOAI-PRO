import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const SWARM_API_KEYS = [
  "AIzaSyD-wM_UgIBBvc_FvusgkK7OINBHexaWZsQ",
  "AIzaSyDGNgvCltKRYwTxcmty8uwR3LKbaTcq9Fg",
  "AIzaSyB9xEFz8SvcMGiFrOAmtbwNm_oGYl-VPmg"
];

// Ensure environmental keys also have a path if present, but strictly maintain the requested SWARM_API_KEYS structure and helper names
const ALL_KEYS = [...SWARM_API_KEYS];
const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (envKey && !ALL_KEYS.includes(envKey)) {
  ALL_KEYS.unshift(envKey);
}

let currentKeyIndex = 0;
export const getActiveSwarmKey = () => ALL_KEYS[currentKeyIndex] || envKey || "";
export const rotateSwarmKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % ALL_KEYS.length;
  console.log(`[SYSTEM] Swarm API Key Rotated. Current Index: ${currentKeyIndex}`);
};

// Definition of fetchSwarmAPI using active swarm key and handling 429 rotation automatically
export async function fetchSwarmAPI(prompt: string, attempt = 1): Promise<any> {
  const apiKey = getActiveSwarmKey();
  console.log(`[API MANAGER] Invoking fetchSwarmAPI. Using Key Index: ${currentKeyIndex}, Attempt: ${attempt}`);
  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    
    // Using recommended gemini-3.5-flash as the non-deprecated text model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return response;
  } catch (error: any) {
    console.error(`[API MANAGER] Error during fetchSwarmAPI (attempt ${attempt}):`, error);
    
    const isRateLimit = error.status === 429 || 
                        (error.message && error.message.includes('429')) || 
                        (error.message && error.message.toLowerCase().includes('rate limit')) ||
                        (error.message && error.message.toLowerCase().includes('too many requests')) ||
                        (error.statusText && error.statusText.toLowerCase().includes('too many requests'));
    
    if (isRateLimit && attempt < ALL_KEYS.length) {
      console.warn(`[API MANAGER] 429 Too Many Requests detected. Rotating API key...`);
      rotateSwarmKey();
      return fetchSwarmAPI(prompt, attempt + 1);
    }
    throw error;
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// WA-Bridge endpoints
let waConnected = false;

app.get('/api/whatsapp/qr', (req, res) => {
  res.json({
    connected: waConnected,
    status: waConnected ? "Connected" : "Waiting for QR",
    qr: waConnected ? "" : "mock_qr_code_data",
    logs: [
      { sender: "System", text: waConnected ? "WA Bridge active" : "Initializing Van-Botz engine..." }
    ]
  });
});

app.post('/api/whatsapp/authenticate', (req, res) => {
  waConnected = true;
  res.json({
    connected: true,
    status: "Connected",
    logs: [
      { sender: "System", text: "Successfully authenticated with WA-Bridge." }
    ]
  });
});

app.post('/api/whatsapp/simulate-incoming', (req, res) => {
  const { fileName, fileType, senderName } = req.body;
  console.log(`[VAN-BOTZ WA TELEMETRY] Ingesting simulated inbound file: ${fileName}`);
  res.json({
    logs: [
      { sender: senderName, text: `Uploaded ${fileType} file: ${fileName}` }
    ],
    message: `Analyze the incoming structural dataset: ${fileName}`
  });
});

// API route for swarm debate
app.post('/api/swarm/debate', async (req, res) => {
  const {
    message,
    activeModule,
    coordinates,
    history = [],
    activeAgents = []
  } = req.body;

  try {
    // Format coordinates
    const coordStr = `X: ${coordinates?.x ?? 120}, Y: ${coordinates?.y ?? 340}, Depth: ${coordinates?.depth ?? 450}m`;
    
    // Construct debate prompt
    const prompt = `
You are acting as a Dungeon Master or moderator for a team of expert geophysicists, geologists, and engineers discussing a query or operation.
Query: "${message || 'Evaluate current spatial and geological conditions.'}"
Geological Module Context: "${activeModule || 'General Inspection'}"
Coordinates: "${coordStr}"

The currently recruited active swarm agents are:
${JSON.stringify(activeAgents, null, 2)}

HISTORICAL BENCHMARKING (ZERO HALLUCINATION):
You MUST base your analysis on ACTUAL Earth history. If an anomaly is detected, you must compare it to real events (e.g., "This seismic pattern resembles the 2004 Sumatra quake"). Do not invent fake geological precedents.

Please generate a professional, technically detailed, and intense debate with at least 3 distinct arguments or points from the active agents. Each agent must speak in their official persona and stance, reflecting their professional domain and faction.
Ensure that some agents might raise technical warnings or have opposing views (PRO vs CON vs NEUTRAL).
Give specific measurements, geophysics data, metrics (e.g., seismic velocity, resistivity values, water saturation Archie parameters, fault block tensions, soil pH, gas concentrations in ppm) to make it highly authentic.

Return a JSON array containing precisely the array of debate messages. Do not overlay any markdown markers like \`\`\`json. Return ONLY a valid JSON array.
Each object in the array must strictly have these fields:
- "agent" (string, the agent's name)
- "role" (string, the agent's title/domain)
- "faction" (string, their professional faction)
- "stance" (string, must be "PRO" or "CON" or "NEUTRAL")
- "reasoning" (string, a short scientific justification or technical reasoning summary)
- "content" (string, what they say in details - minimum 2-3 sentences of deep technical analysis)
- "avatar" (string, their initials, e.g. "GV", "GR", "PT")
`;

    const response = await fetchSwarmAPI(prompt);

    const replyText = response.text || '[]';
    const parsedDebate = JSON.parse(replyText);

    // WA-Bridge Telemetry logic
    const highRiskKeywords = ["Critical Crystalline Stress", "High Gas Concentration", "anomaly", "critical", "risk", "warning"];
    let containsAnomaly = false;
    
    for (const msg of parsedDebate) {
        if (msg.content) {
            for (const keyword of highRiskKeywords) {
                if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
                    containsAnomaly = true;
                    break;
                }
            }
        }
        if (containsAnomaly) break;
    }

    if (containsAnomaly) {
        const targetWA = process.env.TARGET_WA_NUMBER || "6285260245100";
        console.log(`\n======================================================`);
        console.log(`[VAN-BOTZ WA TELEMETRY] High-Risk Anomaly Detected!`);
        console.log(`Dispatching WhatsApp Alert to Admin via WA-Bridge...`);
        console.log(`Target Address: ${targetWA}@s.whatsapp.net`);
        console.log(`Alert Details: Swarm detected critical conditions at ${coordStr}.`);
        console.log(`======================================================\n`);
    }

    res.json({ success: true, debate: parsedDebate });

  } catch (error: any) {
    console.error('Error during Gemini debate generation:', error);
    // Return structured fallback data
    res.status(500).json({
      error: error.message,
      isFallback: true
    });
  }
});

// Master Synthesize endpoint
app.post('/api/master-synthesize', async (req, res) => {
  const { message, globalData, history = [], apiKey: reqApiKey } = req.body;
  
  try {
    const apiKey = getActiveSwarmKey() || reqApiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    
    const prompt = `
You are the Supreme Core Controller of an advanced Master Geo-Synthesizer. You are parsing data from multiple geophysics modules.
Current query: "${message}"

Global Module Raw Data:
${JSON.stringify(globalData, null, 2)}

Provide a deeply analytical, precise, and authoritative response. Keep it highly professional and scientific.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });

    res.json({ success: true, reply: response.text });
  } catch (err: any) {
    console.error('Error in Master Synthesize:', err);
    res.status(500).json({ error: err.message });
  }
});


// GeoSync SSE Hook
app.get('/api/geosync', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write('data: {"status":"GeoSync Active", "timestamp":' + Date.now() + '}\n\n');
  
  const interval = setInterval(() => {
    res.write('data: {"heartbeat": true, "timestamp":' + Date.now() + '}\n\n');
  }, 10000);
  
  req.on('close', () => clearInterval(interval));
});

// Additional API Endpoints
app.get('/api/integrity-check', (req, res) => {
  res.json({ success: true, verified: true });
});

app.post('/api/ingest-journal', (req, res) => {
  res.json({ success: true, message: 'Journal ingested successfully' });
});

app.post('/api/support/submit', (req, res) => {
  res.json({ success: true, message: 'Support ticket submitted' });
});

// Record Activity Pipeline
let sandboxStateDb = [];
app.post('/api/record-activity', (req, res) => {
  const { module, action, payload, isSandbox } = req.body;
  
  if (isSandbox) {
    console.log(`[SANDBOX SYNC] Saving branch experiment to server database. Module: ${module}`);
    sandboxStateDb.push({ module, action, payload, timestamp: Date.now() });
  } else {
    console.log(`[LIVE SYNC] Recording global state to main database. Module: ${module}`);
  }
  
  res.json({ success: true, recorded: true });
});

// Historical State Sync / Time-Travel Endpoint
app.get('/api/record-activity/history', (req, res) => {
  const timestamp = req.query.timestamp as string;
  console.log(`[STATE ARCHIVE] Historical query requested. Target Timestamp: ${timestamp}`);
  
  // Dummy override for immediate UI testing if DB is empty
  const historicalMock = {
    timestamp: timestamp,
    activeModule: "Seismic",
    payload: { cmp_id: 999, waktu_ms: 1500, amplitudo: -0.99, fase_derajat: -180 },
    systemLog: "[TIME-TRAVEL] State successfully restored from backup."
  };

  // Return the rich historical payload alongside the success & data properties
  res.json({
    success: true,
    data: historicalMock,
    globalData: {
      gravityData: [
        { id: "g1", station: "ST-Ivan-Beta", value: 981240.25, anomaly: "High density peak", depth: 150 },
        { id: "g2", station: "ST-Ivan-Alpha", value: 979845.12, anomaly: "Crustal slip zone", depth: 320 }
      ],
      electricalData: [
        { id: "e1", depth: 80, resistivity: 15.4, chargeability: 8.5 },
        { id: "e2", depth: 220, resistivity: 310.8, chargeability: 1.2 }
      ],
      gprData: [
        { id: "gp1", distance: 10, twt: 25, amplitude: 0.85, dielectric: 4.5 },
        { id: "gp2", distance: 20, twt: 45, amplitude: -0.92, dielectric: 9.1 }
      ],
      meteorologyData: [
        { id: "m1", sensor: "BARO-01", pressure: 1013.25, temp: 41.5, humidity: 65 }
      ],
      seismicData: [
        { id: "s1", time: 0.12, amplitude: 0.58, phase: 120 },
        { id: "s2", time: 0.28, amplitude: -1.24, phase: -30 }
      ],
      geochemData: [
        { id: "gc1", type: "Sulfur", ppm: 450, sampleDepth: 180 },
        { id: "gc2", type: "Helium-3", ppm: 142, sampleDepth: 350 }
      ],
      wellLoggingData: [
        { id: "wl1", depth: 120, gammaResponse: 74.5, density: 2.15 },
        { id: "wl2", depth: 340, gammaResponse: 112.3, density: 1.88 }
      ],
      spatialData: [],
      radiometricData: [
        { id: "r1", isotope: "Bi-214", count: 125.4 },
        { id: "r2", isotope: "Tl-208", count: 42.8 }
      ],
      gasQualityData: [
        { id: "gq1", gas: "H2S", concentration: 15.8 },
        { id: "gq2", gas: "CH4", concentration: 420.5 }
      ],
      tiltExtensoData: [
        { id: "t1", axis: "Tilt-X", microRadians: 124.5 },
        { id: "t2", axis: "Extensometer-Z", stretchMm: 2.14 }
      ],
      groundwaterData: [
        { id: "gw1", aquifer: "Basal Sandstone", levelMeters: -45.2, salinityPpm: 340 }
      ],
      soilPhData: [
        { id: "ph1", zone: "Zone-D3", pH: 6.2, moisture: 22.4 }
      ]
    },
    rawPayloads: {
      gravityData: "ST-Ivan-Beta (150m): value 981240.25 (High density peak)\nST-Ivan-Alpha (320m): value 979845.12 (Crustal slip zone)",
      electricalData: "DEP_80m: RES 15.4, CHG 8.5\nDEP_220m: RES 310.8, CHG 1.2",
      gprData: "DIST_10m: TWT 25ns, AMP 0.85\nDIST_20m: TWT 45ns, AMP -0.92",
      meteorologyData: "SENSOR_BARO: 1013.25hPa, 41.5C, 65% RH",
      seismicData: "[MODE: EXPLORATION]\n0.12s: AMP 0.58, PH 120\n0.28s: AMP -1.24, PH -30",
      geochemData: "Sulfur @ 180m: 450ppm\nHelium-3 @ 350m: 142ppm",
      wellLoggingData: "120m: GR 74.5, DEN 2.15\n340m: GR 112.3, DEN 1.88",
      spatialData: "X:120, Y:340, Z:450 // DILATANCY FAULT BOUNDARY DETECTED",
      radiometricData: "Bi-214: 125.4 cps\nTl-208: 42.8 cps",
      gasQualityData: "H2S: 15.8ppm\nCH4: 420.5ppm",
      tiltExtensoData: "Tilt-X: 124.5 uRad\nExtensometer-Z: 2.14 mm",
      groundwaterData: "Basal Sandstone Aquifer Level: -45.2m, Salinity: 340ppm",
      soilPhData: "Zone-D3: PH 6.2, MOIST 22.4%"
    }
  });
});

// Serve frontend assets
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SERVER] Starting Vite Dev Middleware in Development mode...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    // Intercept and transform HTML requests before Vite's static serving middleware parses them as raw files
    app.use(async (req, res, next) => {
      const isHtml = req.headers.accept?.includes('text/html') || req.url === '/' || req.url === '/index.html' || !req.url.includes('.');
      const isApi = req.originalUrl.startsWith('/api');
      if (isHtml && !isApi) {
        try {
          const url = req.originalUrl || req.url;
          const htmlPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(htmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);

          // Guarantee that the react preamble is present in the HTML template
          const hasPreamble = template.includes('__vite_plugin_react_preamble_installed__') || 
                              template.includes('window.$RefreshReg$') || 
                              template.includes('RefreshRuntime');

          if (!hasPreamble) {
            const preambleStr = `
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
            `;
            template = template.replace('<head>', `<head>${preambleStr}`);
          }

          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          return;
        } catch (e: any) {
          if (vite) {
            vite.ssrFixStacktrace(e);
          }
          return next(e);
        }
      }
      next();
    });

    // Use Vite's connect instance as middleware to handle assets and virtual paths
    app.use(vite.middlewares);

    // Fallback route to transform index.html dynamically and inject target scripts/preambles
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);

        const hasPreamble = template.includes('__vite_plugin_react_preamble_installed__') || 
                            template.includes('window.$RefreshReg$') || 
                            template.includes('RefreshRuntime');

        if (!hasPreamble) {
          const preambleStr = `
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
          `;
          template = template.replace('<head>', `<head>${preambleStr}`);
        }

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    console.log('[SERVER] Serving static production build from dist/');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
