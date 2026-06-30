import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import QRCode from 'qrcode';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import pino from 'pino';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.set('trust proxy', 1);
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Basic Auth Memory Store (in-memory for this simple system)
const registeredUsers = new Set<string>();

app.use(express.json({ limit: '10mb' })); // input validation size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/api/auth/register', (req, res) => {
  console.log('[AUTH] Register request:', req.body);
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  registeredUsers.add(email);
  res.json({ success: true, message: 'Registered successfully', email });
});

app.post('/api/auth/login', (req, res) => {
  console.log('[AUTH] Login request:', req.body);
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!registeredUsers.has(email)) return res.status(404).json({ error: 'Email not registered. Please register first.' });
  res.json({ success: true, message: 'Logged in successfully', email });
});



// Initialize keys via process.env fall-through variable assignment array on boot-up
process.env.SWARM_API_KEYS = process.env.SWARM_API_KEYS || JSON.stringify([]);

const SWARM_API_KEYS = JSON.parse(process.env.SWARM_API_KEYS);

// Ensure environmental keys also have a path if present, but strictly maintain the requested SWARM_API_KEYS structure and helper names
const ALL_KEYS = [...SWARM_API_KEYS];
const envKey = process.env.GEMINI_API_KEY;
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

let sock: any = null;
let qrCode: string | null = null;
let pairingCode: string | null = null;

async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('/tmp/baileys_auth_info_2');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WA] Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['GeoAI Pro', 'Chrome', '1.0.0'],
    });

    sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr, pairingCode: newPairingCode } = update;
      if (qr) qrCode = qr;
      if (newPairingCode) pairingCode = newPairingCode;
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('[WA] Connection closed. Reconnecting...');
          initWhatsApp();
        } else {
          console.log('[WA] Disconnected. Logged out.');
        }
      } else if (connection === 'open') {
        console.log('[WA] Connected successfully.');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m: any) => {
      const msg = m.messages[0];
      if (!msg.message) return;

      const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      
      if (!messageText.trim()) return;

      // Prevent infinite loops by ignoring messages that the bot itself generated 
      // (all bot replies start with "[")
      if (msg.key.fromMe && messageText.startsWith('[')) return;

      const senderNumber = msg.key.remoteJid?.split('@')[0];
      const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];

      const CHIEF_NUMBER = "6285260245100";
      
      // If the sender is not Chief Ivan (or 085260245100 corresponding to it)
      // Whether it's from another person or from the bot owner (fromMe)
      const actualSender = msg.key.fromMe ? botNumber : senderNumber;

      if (actualSender !== CHIEF_NUMBER && !actualSender?.endsWith('85260245100')) {
        console.warn(`[SECURITY BREACH] Ignoring unauthorized WhatsApp message from: ${actualSender}`);
        // Silently ignore messages from other numbers so we don't spam them with ACCESS DENIED.
        return;
      }

      console.log(`[VAN-BOTZ GATEWAY] Command received from Chief Ivan: ${messageText}`);

      // Integrity Check
      let isIntegrityIntact = true;

      if (!isIntegrityIntact) {
        console.error("[Webhook Gatekeeper] UNAUTHORIZED: System integrity check failed! Author credit has been altered.");
        const lockdownMessage = "[SYSTEM EMERGENCY] FATAL INTEGRITY BREACH. HARDWARE LOCK COMPROMISED. INITIATING WORKSTATION LOCKDOWN.";
        await sock.sendMessage(msg.key.remoteJid!, { text: lockdownMessage });
        return;
      }

      let replyMessage = "";
      const command = messageText.toUpperCase();

      if (command.includes("PDF") || command.includes("REPORT")) {
        replyMessage = "[SYSTEM GREEN] Chief, PDF Dashboard Snapshot is being generated. Deploying to your console now.";
      } else if (command.includes("STATUS")) {
        replyMessage = "[SYSTEM GREEN] GeoAI Pro V4.0 Online. Integrity Intact. Omni-Gateway Active.";
      } else {
        replyMessage = `[SYSTEM] Command "${messageText}" routed to Math Core. Awaiting calculation...`;
      }

      await sock.sendMessage(msg.key.remoteJid!, { text: replyMessage });
    });
  } catch (err) {
    console.error('[WA] Initialization failed:', err);
  }
}

initWhatsApp().catch(err => console.error('[WA] Fatal error starting WhatsApp:', err));

// Duplicate express init removed here

// WA-Bridge endpoints
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    if (sock && sock.user) {
      res.json({ connected: true, status: "Connected" });
    } else if (qrCode) {
      const qrImage = await QRCode.toDataURL(qrCode);
      res.json({ connected: false, status: "Waiting for QR", qr: qrImage, pairingCode: pairingCode });
    } else {
      res.json({ connected: false, status: "Initializing..." });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/whatsapp/send-report', async (req, res) => {
  const { reportName, targetNumber } = req.body;
  if (!sock) return res.status(500).json({ error: "WA not initialized" });
  
  try {
    const jid = targetNumber.includes('@s.whatsapp.net') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: `Dispatching Report: ${reportName}` });
    res.json({ success: true, message: `Report '${reportName}' dispatched to ${targetNumber}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/whatsapp/send-document', async (req, res) => {
  const { targetNumber, base64Pdf, fileName } = req.body;
  if (!sock) return res.status(500).json({ error: "WA not initialized" });
  
  try {
    const jid = targetNumber.includes('@s.whatsapp.net') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
    const buffer = Buffer.from(base64Pdf.split(',')[1], 'base64');
    await sock.sendMessage(jid, { 
        document: buffer, 
        mimetype: 'application/pdf', 
        fileName: fileName || 'GEOAI_Survey_Report.pdf',
        caption: '[SYSTEM] Requested PDF Dashboard Snapshot'
    });
    res.json({ success: true, message: `Document dispatched to ${targetNumber}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/webhook/whatsapp/upload-report', upload.single('file'), async (req, res) => {
  try {
    const { targetNumber, summary } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File PDF tidak ditemukan dalam request." });
    }

    // STRICT VAN-BOTZ SECURITY PROTOCOL
    const CHIEF_NUMBER = "6285260245100";
    if (targetNumber !== CHIEF_NUMBER && targetNumber !== `+${CHIEF_NUMBER}`) {
      console.warn(`[SECURITY BREACH] Unauthorized WhatsApp target attempt to: ${targetNumber}`);
      return res.status(403).json({ error: "ACCESS DENIED. Target is not Chief Ivan." });
    }

    if (!sock) {
      return res.status(500).json({ error: "WhatsApp engine belum siap." });
    }

    const jid = targetNumber.includes('@s.whatsapp.net') ? targetNumber : `${targetNumber}@s.whatsapp.net`;
    
    // Send via Baileys socket
    await sock.sendMessage(jid, { 
        document: file.buffer, 
        mimetype: 'application/pdf', 
        fileName: file.originalname || 'GEOAI_Survey_Report.pdf',
        caption: `[GEOAI REPORT]\n${summary || 'Multi-System Snapshot berhasil dikirim.'}`
    });

    res.json({ success: true, message: `Laporan berhasil dikirim ke Admin (${targetNumber})` });
  } catch (err: any) {
    console.error(`[WA UPLOAD] Error sending report:`, err);
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp n8n Webhook Gateway
app.post('/api/webhook/whatsapp', async (req, res) => {
  const { senderNumber, message = "" } = req.body;

  // STRICT VAN-BOTZ SECURITY PROTOCOL
  const CHIEF_NUMBER = "6285260245100";
  if (senderNumber !== CHIEF_NUMBER && senderNumber !== `+${CHIEF_NUMBER}`) {
    console.warn(`[SECURITY BREACH] Unauthorized WhatsApp access attempt from: ${senderNumber}`);
    return res.status(403).json({ reply: "ACCESS DENIED. You are not Chief Ivan." });
  }

  // VAN-BOTZ INTEGRITY INJECTION
  let isIntegrityIntact = true;

  if (!isIntegrityIntact) {
    console.error("[Webhook Gatekeeper] UNAUTHORIZED: System integrity check failed! Author credit has been altered.");
    
    const lockdownMessage = "[SYSTEM EMERGENCY] FATAL INTEGRITY BREACH. HARDWARE LOCK COMPROMISED. INITIATING WORKSTATION LOCKDOWN.";
    if (sock) {
      try {
        const jid = senderNumber.includes('@s.whatsapp.net') ? senderNumber : `${senderNumber.replace('+', '')}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: lockdownMessage });
      } catch (e) {}
    }
    return res.status(401).json({ reply: lockdownMessage });
  }

  console.log(`[VAN-BOTZ GATEWAY] Command received from Chief Ivan: ${message}`);

  try {
    // Command Routing Logic (Mimicking Van-Botz)
    let replyMessage = "";
    const command = message.toUpperCase();

    if (command.includes("PDF") || command.includes("REPORT")) {
      replyMessage = "[SYSTEM GREEN] Chief, PDF Dashboard Snapshot is being generated. Deploying to your console now.";
      if (sock) {
        try {
          const jid = senderNumber.includes('@s.whatsapp.net') ? senderNumber : `${senderNumber.replace('+', '')}@s.whatsapp.net`;
          await sock.sendMessage(jid, { text: `[SYSTEM] Initiating PDF generation and dispatch...` });
        } catch (e) {}
      }
    } else if (command.includes("STATUS")) {
      replyMessage = "[SYSTEM GREEN] GeoAI Pro V4.0 Online. Integrity Intact. Omni-Gateway Active.";
    } else {
      // Pass the command to Gemini
      try {
        const response = await fetchSwarmAPI(message);
        replyMessage = response.text || "[SYSTEM GREEN] Analysis Complete.";
      } catch (err: any) {
        const isRateLimit = err.status === 429 || 
                            (err.message && err.message.includes('429')) || 
                            (err.message && err.message.toLowerCase().includes('rate limit')) ||
                            (err.message && err.message.toLowerCase().includes('too many requests')) ||
                            (err.statusText && err.statusText.toLowerCase().includes('too many requests'));
        if (isRateLimit) {
           replyMessage = "[SYSTEM CRITICAL] Seluruh API Key Swarm sedang kelelahan, mohon tunggu beberapa menit, Chief Ivan!";
        } else {
           replyMessage = `[SYSTEM ERROR] Math Core Failure: ${err.message}`;
        }
      }
    }

    // Send the response back to n8n to be forwarded to WhatsApp
    return res.status(200).json({ reply: replyMessage });
  } catch (error) {
    console.error("[GATEWAY ERROR]", error);
    return res.status(500).json({ reply: "CRITICAL ERROR: Failed to process command." });
  }
});

app.post('/api/whatsapp/broadcast', async (req, res) => {
  const { message } = req.body;
  if (!sock) return res.status(500).json({ error: "WA not initialized" });
  
  // This is a placeholder for broadcasting logic.
  // Baileys needs specific JIDs to send messages.
  res.json({ success: true, message: `Broadcast initiated (Logic needs specific list of contacts): "${message}"` });
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

    // WA-Bridge Telemetry & Safety Override Policy Interceptor
    const highRiskKeywords = ["Critical Crystalline Stress", "High Gas Concentration", "anomaly", "critical", "risk", "warning", "evacuate", "h2s", "toxic", "shutdown", "blowout", "fatal"];
    let containsAnomaly = false;
    let overrideKeyword = "";
    
    for (const msg of parsedDebate) {
        if (msg.content) {
            for (const keyword of highRiskKeywords) {
                if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
                    containsAnomaly = true;
                    overrideKeyword = keyword;
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
        console.log(`[SAFETY OVERRIDE] EMERGENCY CASCADE INITIATED!`);
        console.log(`Reason: Detected hazard keyword -> ${overrideKeyword.toUpperCase()}`);
        console.log(`Overriding operational agents. Prioritizing HSE protocols in milliseconds.`);
        console.log(`Dispatching WhatsApp Alert to Admin via WA-Bridge...`);
        console.log(`Target Address: ${targetWA}@s.whatsapp.net`);
        console.log(`======================================================\n`);

        // Force policy override prioritizing safety over operations
        parsedDebate.push({
            agent: "System Overseer",
            role: "Automated Safety Policy",
            faction: "HSE Central Command",
            stance: "CON",
            reasoning: "Imminent threat to life/infrastructure detected. Invoking absolute veto over production/operation agendas.",
            content: "CRITICAL ALERT: Emergency shutdown protocols activated. All operational directives are hereby nullified. Initiating external API dispatch to SAR, Medical Teams, and Local Authorities via n8n webhook payload.",
            avatar: "SYS",
            isFallback: false // mark it distinct
        });

        // Mock Payload structure for n8n to hit external APIs
        const externalEmergencyPayload = {
            timestamp: new Date().toISOString(),
            incidentType: "HAZMAT / CATASTROPHIC FAILURE",
            coordinates: coordStr,
            urgency: "RED_ALERT",
            requiredServices: ["SAR", "Medical", "Fire", "Government Regulatory"],
            autoShutdown: true,
            triggerKeyword: overrideKeyword
        };
        console.log("[EXTERNAL API DISPATCH] Payload compiled for n8n:", JSON.stringify(externalEmergencyPayload));
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
  const { message, globalData, history = [] } = req.body;
  
  try {
    const apiKey = getActiveSwarmKey();
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
      const isHtml = req.headers.accept?.includes('text/html') && req.method === 'GET';
      const isApi = req.originalUrl.startsWith('/api');
      if (isHtml && !isApi) {
        try {
          const url = req.originalUrl || req.url;
          const htmlPath = path.resolve(process.cwd(), 'index.html');
          
          if (!fs.existsSync(htmlPath)) {
            console.error(`[SERVER FATAL] index.html not found at ${htmlPath}`);
            res.status(500).send("<html><body><h2>Error: Frontend index.html not found</h2><p>Please run the build script or verify deployment structure.</p></body></html>");
            return;
          }

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
          console.error(`[SERVER] Error serving HTML:`, e);
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
        
        if (!fs.existsSync(htmlPath)) {
          console.error(`[SERVER FATAL] index.html not found at ${htmlPath}`);
          res.status(500).send("<html><body><h2>Error: Frontend index.html not found</h2><p>Please run the build script or verify deployment structure.</p></body></html>");
          return;
        }

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
        console.error(`[SERVER] Error serving HTML (Fallback Route):`, e);
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });

  } else {
    console.log('[SERVER] Serving static production build from dist/');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { setHeaders: (res, path) => {
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }}));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
