# GeoAI Pro: Deep Multi-Agent Swarm Intelligence & Geophysical Digital Twin Suite 🌍🌋

**GeoAI Pro** is a professional, full-stack geophysics exploration suite designed for raw log analysis, real-time 3D subsurface twin mapping, and automated AI swarm consensus modeling.

Built during the global cloud space hackathon, GeoAI Pro represents a quantum leap in mineral exploration and reservoir risk profiling. By combining direct hardware-level sensor ingestion, local messaging telemetry, and Gemini-powered swarm orchestrations, we turn days of offline multidisciplinary debates into seconds of active, unified consensus.

---

## 🚀 The Core Problem & Our Vision

Deep subsurface drilling is an ultra-high-stakes gamble:
1. **Siloed Science:** Physicists, structural geologists, and resource economists rarely speak the same format. Data from Seismic reflectives, Schlumberger soundings, and mineral core logs remain trapped in fragmented formats like `.segy`, `.las`, or `.csv`.
2. **Analysis Latency:** Bringing together regional specialists to agree on deep sills, mudstone faults, and dry sandstone fractures takes weeks of manual paperwork.

**GeoAI Pro solves this completely.** By combining high-fidelity WebGL digital twins with a **100+ multi-agent swarm intellect**, the platform performs automatic raw log ingestion, runs real-time inversion models, and compiles ironclad Prospect Reports instantly.

---

## 🏛️ Swarm Intelligence Architecture

Our platform utilizes an asynchronous consensus loop mapping three elite, hyper-focused specialist agent clusters to debate your data in parallel:

```
                [ Operator / Inbound Telemetry (.las, .csv) ]
                                     │
                                     ▼
                      [ System Swarm Orchestrator ]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  [ Geophysics Cluster ]      [ Geology Cluster ]     [ Economics Cluster ]
  (Dr. Marcus Vance)          (Dr. Elena Rostova)     (Mr. Kenji Takahashi)
  ├── Bedrock Inversion       ├── Lithology Horizon   ├── Drilling NPV Rate
  ├── Wavelet Denoising       ├── Strata Faults       ├── Operational CAPEX
  └── Apparent Resistivity    └── Pore Fluid Check    └── Risk Anomaly ROI
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                        [ Consolidated Consensus ]
                                     │
                                     ▼
                      [ Generated Prospect Report ]
```

1. **Geophysics Cluster (Led by Dr. Marcus Vance):** Focused entirely on raw physics, signal-to-noise filters, 3D inversion modeling, and sound wave deconvolution.
2. **Geology Cluster (Led by Dr. Elena Rostova):** Grounding Vance’s physics against lithological matrices, stratigraphic horizon boundaries, and ancient mineral zones.
3. **Resource Economics Cluster (Led by Mr. Kenji Takahashi):** Translating subsurface anomalies into business NPV, ROI charts, local environment risk, and drilling-hazard profiles.

---

## 💎 Features at a Glance

### 1. Dual-Mode Data Ingestion Panel 📥
- **Field Mode (Quick Paste):** High-contrast styled `<textarea>` with built-in templates. Allows geologists on rugged field rigs to paste comma-delimited vertical soundings or bedrock matrix readings directly.
- **Lab Mode (Local Filereader):** Integration with HTML5 `FileReader`. Upload `.las`, `.csv`, or `.txt` logs to extract ASCII data instantly on the client side, populating graphs and sections in real-time.

### 2. Live 2D Bedrock Resistivity Inversion Section 📈
- Interactive grid blocks illustrating Wenner & Schlumberger active depths.
- Uses heatmaps styled using classical geophysical palettes (Deep Blue Conductive Brines $\rightarrow$ Saturated Clay Greens $\rightarrow$ Quartz Reds).
- Interactive tooltip layers tracking Chainage nodes.

### 3. WhatsApp Baileys Telemetry Integration 📱
- Powered by `@whiskeysockets/baileys` and local `useMultiFileAuthState`.
- Node.js backend captures secure WhatsApp association events, compiles the verification stream to Base64 image tags, and streams live QR pairing codes directly to the UI.
- Field crews can send raw logging attachments directly to the WhatsApp bot—the system catches the message, extracts the files, and feeds them to the AI debate.

### 4. GraphRAG Augmented Memory 📚
- Drag-and-drop research paper indexing to ground AI swarm interpretation directly against peer-reviewed academic literature.

---

## 🛠️ Stack & Engineering

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Motion (React)
- **Backend:** Express, Node.js, TSX runtime compiler
- **LLM Engine:** `@google/genai` TypeScript SDK utilizing **`gemini-3.5-flash`** for structured JSON debate sequences
- **Telecom:** `@whiskeysockets/baileys` multi-device engine, `qrcode`, `pino`

---

## ⚙️ Environment Variables Setup

Configure your local or production environment in `.env`:

```env
# Geophysics Swarm Accelerator key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

---

## 🦾 Production Commands

To install, compile, and run the system with stand-alone node servers:

```bash
# 1. Install workspace dependencies
npm install

# 2. Build client bundle and compile backend server to single commonJS artifact
npm run build

# 3. Boot production server on Port 3000
npm run start
```

---

*GeoAI Pro is designed for geoscientists, drill operators, and mining asset managers who want to reduce exploration uncertainty to zero.* 🚀
