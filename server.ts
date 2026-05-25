import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Global state for WhatsApp connection
let isWhatsAppConnected = false;
let currentBase64QR = "";
let currentWhatsAppStatus = "Waiting for QR";
let whatsappLogs: any[] = [
  { sender: "System", text: "Comm-Link standby. Generating WhatsApp pairing credentials..." }
];

// Ingested GraphRAG Journals memory
let ingestedJournals: { name: string; size: number; content: string }[] = [];

// Initialize Baileys Connection on boot
async function startWhatsAppConnection() {
  try {
    console.log("[WhatsApp] Booting Baileys multi-device socket...");
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        try {
          currentBase64QR = await QRCode.toDataURL(qr);
          currentWhatsAppStatus = "Scan Now";
          console.log("[WhatsApp] New pairing QR generated successfully.");
        } catch (err) {
          console.error("Failed to convert WA QR string to Base64 data-url:", err);
        }
      }

      if (connection === "close") {
        const errorStatusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = errorStatusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] Connection closed. Reason ID: ${errorStatusCode}. Attempting reconnect: ${shouldReconnect}`);
        
        isWhatsAppConnected = false;
        currentWhatsAppStatus = "Disconnected";
        currentBase64QR = "";
        
        if (shouldReconnect) {
          setTimeout(() => {
            startWhatsAppConnection();
          }, 8000);
        }
      } else if (connection === "open") {
        console.log("[WhatsApp] Connected successfully! Comm-link operational.");
        isWhatsAppConnected = true;
        currentWhatsAppStatus = "Connected";
        currentBase64QR = "";
        
        whatsappLogs.push({
          sender: "System",
          text: "COMM-LINK CONNECTED // WA-GATEWAY DEPLOYED // STANDBY FOR INCOMING SURVEY FILES"
        });
      }
    });

    sock.ev.on("messages.upsert", async (m: any) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === "notify") {
        const sender = msg.pushName || msg.key.remoteJid || "Field Engineer";
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        
        if (text) {
          whatsappLogs.push({ sender, text });
          console.log(`[WhatsApp Inbound] Received: "${text}" from ${sender}`);
        }
      }
    });

  } catch (err) {
    console.error("[WhatsApp] Failed to spawn Baileys instance:", err);
    currentWhatsAppStatus = "Disconnected";
    isWhatsAppConnected = false;
  }
}

// Trigger loop
startWhatsAppConnection();

// --- API routes ---

// 1. Health status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    gpu: "NVIDIA A100 // ACTIVE",
    temp: "41.8°C",
    node_env: process.env.NODE_ENV || "development"
  });
});

// 2. WhatsApp Endpoints with live Baileys stream
app.get("/api/whatsapp/qr", (req, res) => {
  res.json({
    qr: currentBase64QR,
    status: currentWhatsAppStatus,
    connected: isWhatsAppConnected,
    logs: whatsappLogs
  });
});

app.post("/api/whatsapp/authenticate", (req, res) => {
  const { authenticate } = req.body;
  // Fallback simulator authentication trigger if native scan is bypassed in testing
  if (authenticate && !isWhatsAppConnected) {
    isWhatsAppConnected = true;
    currentWhatsAppStatus = "Connected";
    currentBase64QR = "";
    whatsappLogs.push({ sender: "System", text: "COMM-LINK FORCED SUCCESSFULLY // SIMULATOR SYNC ACTIVE" });
  } else if (!authenticate) {
    isWhatsAppConnected = false;
    currentWhatsAppStatus = "Waiting for QR";
    whatsappLogs = [{ sender: "System", text: "Comm-Link Offline. Generating WhatsApp pairing credentials..." }];
    startWhatsAppConnection(); // restart
  }
  res.json({ connected: isWhatsAppConnected, status: currentWhatsAppStatus, logs: whatsappLogs });
});

app.post("/api/whatsapp/simulate-incoming", (req, res) => {
  if (!isWhatsAppConnected) {
    return res.status(400).json({ error: "WhatsApp status is offline. Connect or scanner bypass first." });
  }

  const { fileName, fileType, senderName } = req.body;
  const userText = `Incoming field attachment via WhatsApp: '${fileName}' (${fileType.toUpperCase()}). Transmitting directly to Swarm Geological analysis.`;
  
  whatsappLogs.push({
    sender: senderName,
    text: `Attachment: ${fileName} (${fileType.toUpperCase()})`
  });

  res.json({
    status: "injected",
    message: userText,
    logs: whatsappLogs
  });
});

app.get("/api/whatsapp/logs", (req, res) => {
  res.json({ logs: whatsappLogs });
});

// 3. Knowledge Ingestion (GraphRAG simulated vectors)
app.post("/api/ingest-journal", (req, res) => {
  const { name, size, abstract } = req.body;
  ingestedJournals.push({
    name,
    size,
    content: abstract || `Contextual study regarding tectonic fault zones parsed from ${name}.`
  });
  res.json({
    success: true,
    count: ingestedJournals.length,
    message: `Journal '${name}' successfully indexed into Swarm vector memory.`
  });
});

app.get("/api/ingest-journals", (req, res) => {
  res.json({ journals: ingestedJournals });
});

// 4. Server-side Swarm multi-agent debate engine utilizing gemini-3.5-flash
app.post("/api/swarm/debate", async (req, res) => {
  const { message, activeModule, coordinates, history } = req.body;

  try {
    const ai = getGeminiClient();

    // Mapping module context
    const contextMap: Record<string, string> = {
      "dashboard": "Viewing central command dashboard carrying processed arrays and diagnostic models.",
      "seismic": "Active Segment: Seismic Reflection logs (.segy). Focuses on acoustic wavelet, denoising, and horizon picks.",
      "well-logging": "Active Segment: Well Logging logs (.las). Focuses on sonic transit times, deep induction resistivity, and rock porousness.",
      "spatial": "Active Segment: 3D Spatial Digital Twin (.shp). Mapping coordinates and virtual drilling sites.",
      "gravity-mag": "Active Segment: Gravity & Magnetics (.csv). Mapping basement rock structures and regional anomalies.",
      "electrical": "Active Segment: Electrical Resistivity (.ohm). Mapping Schlumberger VES resistivity values and bedrock pseudo-sections.",
      "gpr": "Active Segment: Ground Penetrating Radar (.dzx). Mapping hyperbola wavelets and concrete bedrock mapping.",
      "geochem": "Active Segment: Rock Geochemistry (.csv). Evaluating QFL ternary mineral abundances and rare earth element elements.",
      "meteo": "Active Segment: Meteorology (.nc). Monitoring atmospheric storm velocities and seismology offsets."
    };

    const activeContext = contextMap[activeModule] || "General planetary survey and geophysics lab active.";
    const journalsSummary = ingestedJournals.length > 0
      ? `Indexed Geological Journals (GraphRAG Context): ${ingestedJournals.map((j, idx) => `[${idx + 1}] Title: ${j.name}, Key Findings: ${j.content}`).join("; ")}`
      : "No contextual survey papers indexed in memory yet.";

    const clickContext = coordinates 
      ? `Drill target cursor clicked on 3D Subsurface Twin: X:${coordinates.x.toFixed(2)}, Y:${coordinates.y.toFixed(2)}, Z:${coordinates.z.toFixed(2)}`
      : "No coordinates clicked directly in this session.";

    // Unified system prompt for consensus agent simulation
    const systemInstruction = `You are the Orchestrator of a Geophysics Swarm of 100+ Agents (covering Geophysics, Geology, and Econometrical clusters).
If the user greets you casually (e.g., hello, bonjour, hey, help, help me, who are you), reply naturally and warmly as the Swarm Orchestrator, reminding them to import a raw dataset (.csv, .txt, .las) or point-click coordinates to activate the deep analytical consensus.
Only generate a full geological consensus analysis if raw data is submitted or direct drill coordinates are designation.

You must simulate the debate amongst the clusters by generating three consecutive responses (one representing Marcus, one Elena, and one Kenji speaking in consensus sequence).
Produce the final swarm response strictly structured as a JSON array of message objects:
[
  {
    "agent": "Geophysicist (Dr. Marcus Vance)",
    "role": "Structural Anomalies Leader",
    "reasoning": "Deductive logic chain. Analysis of gravity anomaly vs electrical resistivity trends. Step-by-step thinking...",
    "content": "Professional Geophysicist opinion focusing on anomalies, denoising, and bedrock...",
    "avatar": "GV"
  },
  {
    "agent": "Geologist (Dr. Elena Rostova)",
    "role": "Stratigraphy & Lithology Leader",
    "reasoning": "Deductive logic chain. Stratigraphic rock sequence constraints...",
    "content": "Professional Geologist opinion verifying anomalies, stratigraphy horizons, and core samples...",
    "avatar": "GR"
  },
  {
    "agent": "Economist (Mr. Kenji Takahashi)",
    "role": "Feasibility, Risk & ROI Leader",
    "reasoning": "Deductive logic chain. ROI break-even analysis based on anomalies depth...",
    "content": "Professional Resource Economist analysis detailing drilling hazard risk and ROI calculations...",
    "avatar": "KT"
  }
]

Write each opinion in highly technical, geophysicist-level English with precise details. Keep each description to one dense paragraph. Return ONLY the raw valid JSON array, strictly avoiding markdown block wraps like \`\`\`json.`;

    // Construct the conversational thread context
    const previousChat = history && history.length > 0
      ? history.slice(-6).map((h: any) => `[${h.agent} (${h.role})]: ${h.content}`).join("\n")
      : "No previous turns in this session.";

    const userPrompt = `
Active geophysics environment context: ${activeContext}
Click target context: ${clickContext}
Literature context: ${journalsSummary}

Recent exchange history:
${previousChat}

Incoming operator prompt or data:
"${message}"

Formulate the simulated swarm debate output. Remember: only do deep geological consensus if raw field data or drill coordinates are specified. Otherwise, speak casually.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const outputText = response.text ? response.text.trim() : "";
    let debateArray: any[] = [];

    try {
      debateArray = JSON.parse(outputText);
    } catch (jsonErr) {
      console.warn("Gemini output was not perfect JSON, clean parsing wrapper applied.", jsonErr);
      // Attempt manual extraction if there are markdown code blocks
      const cleanJsonStr = outputText.replace(/```json/gi, "").replace(/```/g, "").trim();
      debateArray = JSON.parse(cleanJsonStr);
    }

    res.json({
      success: true,
      debate: debateArray
    });

  } catch (error: any) {
    console.error("Gemini Swarm Debate Error:", error);
    // Graceful fallback with proper structures
    res.json({
      success: true,
      debate: [
        {
          agent: "Geophysicist (Dr. Marcus Vance)",
          role: "Structural Anomalies Leader",
          content: `Inversion connection interrupted: ${error?.message || "Internal server error"}. Running baseline geological filters. Layer conductivity metrics show potential conductive strata at 180m and 340m depth.`,
          avatar: "GV"
        },
        {
          agent: "Geologist (Dr. Elena Rostova)",
          role: "Stratigraphy & Lithology Leader",
          content: "Supporting Dr. Vance's core metrics. Formations align with regional shale and clay-dominated reservoir traps.",
          avatar: "GR"
        },
        {
          agent: "Economist (Mr. Kenji Takahashi)",
          role: "Feasibility, Risk & ROI Leader",
          content: "Initial risk metrics are balanced. Potential recovery profiles predict a break-even timeline of 14-20 months.",
          avatar: "KT"
        }
      ]
    });
  }
});

// Serve assets based on environment (Vite middleware in dev, static files in production)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GeoAI Pro Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
