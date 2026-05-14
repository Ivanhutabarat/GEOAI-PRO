# GeoAI Pro 🌍

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a83d1cd8-f462-4b95-9b52-9dd679d8af95

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



> A State-of-the-Art Geophysics Intelligence Platform for Deep Analysis & 3D Visualization.

GeoAI Pro is an advanced, high-fidelity platform designed to bridge the gap between raw geophysical data and actionable insights. Engineered for professional workflows, it combines WebGL rendering with Generative AI to deliver intelligent anomaly detection, automated denoising, and immersive subsurface modeling.

## 🚀 Core Capabilities

*   **Comprehensive Data Hub:** Native ingestion and processing for industry-standard formats including SEGY (Seismic), LAS (Well Logging), MSEED (Microseismic), and Spatial data (SHP, KML, GeoTIFF, GeoJSON).
*   **Gemini-Powered AI Consultant:** Integrated with `gemini-3-flash-preview` to provide expert-level interpretations, automated lithology detection, and structural anomaly scanning.
*   **High-Fidelity Seismic Visualizer:** Custom HTML5 Canvas engine optimized for rendering 2D seismic wiggles and density plots with real-time gain adjustments.
*   **Interactive Well Log Analytics:** Advanced multi-track plotting for LAS files featuring cross-over alerts and automated zone identification.
*   **Immersive 3D Spatial Modeling:** Holistic site assessments and terrain visualizations powered by Three.js for precise depth and volume analysis.

## 🛠️ Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Visualization:** Three.js (3D), D3.js & Recharts (2D), HTML5 Canvas
*   **AI & Infrastructure:** Google Gemini API, Google Cloud Run

## ⚙️ Quick Start

1. Clone the repository:
   ```bash
   git clone [https://github.com/Ivanhutabarat/GeoAI-Pro.git](https://github.com/Ivanhutabarat/GeoAI-Pro.git)
   cd GeoAI-Pro
