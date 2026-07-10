# NexusStudio

An in-browser AI content creation studio: generate video and images with Gemini, then edit, caption, and export clips without leaving the browser.

<!-- SCREENSHOT PLACEHOLDER: add a screenshot of the dashboard or video editor here -->

## Overview

NexusStudio brings the core workflow of a content creation suite into a single React app. Instead of jumping between a generation tool, an editor, and an export utility, everything runs client-side: Gemini handles generation and analysis, a custom analysis engine scores footage for highlight moments, and FFmpeg compiled to WebAssembly does the final render in the browser. There is no backend to deploy or maintain.

## Key features

- **Video generation** with Google's Veo model, supporting 16:9 and 9:16 aspect ratios and image-to-video
- **Image Studio** for AI image generation and editing
- **AI Assistant and Live Session** views, including microphone and camera input for real-time interaction
- **Video Editor** with a multi-track timeline (video, audio, captions), filters, opacity, volume, and speed controls
- **Clip Detector**: a client-side video intelligence engine that runs scene detection, silence and beat detection, motion scoring, and ranks candidate clips by predicted engagement, with no API calls needed
- **Smart auto-edit**: uses the analysis results to propose cuts, trims, and speed changes automatically
- **Caption Studio** for generating and styling captions
- **Export Panel** that renders the final video with FFmpeg.wasm (loaded on demand from CDN to keep the bundle small)
- **Media downloader** that pulls source footage from YouTube, TikTok, Instagram and similar platforms through the Cobalt API
- **Project saving** to localStorage, with an in-memory runtime store for passing file blobs between editor and export views

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 3 (with `@tailwindcss/forms`)
- `@google/genai` (Gemini API: Veo, image generation, chat, live sessions)
- `@ffmpeg/ffmpeg` 0.12 (FFmpeg compiled to WebAssembly)
- Cobalt API for social media downloads

## How it works

The app is a single-page React application with view-based navigation (dashboard, generators, editor, export, templates). Three service layers do the heavy lifting:

- `services/geminiService.ts` wraps all Gemini calls: Veo video generation, image generation, chat, and media analysis
- `services/videoIntelligence.ts` and `services/smartEditor.ts` analyse footage frame-by-frame in the browser (brightness, contrast, motion deltas, audio energy) and turn that into scene changes, silence maps, and ranked highlight clips
- `services/ffmpegService.ts` loads FFmpeg.wasm on demand and performs the actual export render

The dev server sets Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers, which FFmpeg.wasm needs for SharedArrayBuffer support.

## Setup

**Prerequisites:** Node.js and a Gemini API key.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root and add your key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:3000.

On Windows you can also just run `start_app.bat`, which installs dependencies and starts the server in one step.

`npm run build` produces a production build, `npm run preview` serves it locally.

## Usage

Open the dashboard, pick a tool from the sidebar, and work through the pipeline: generate or import footage, run the Clip Detector to find the strongest moments, refine in the Video Editor, add captions, then export from the Export Panel. Note that Veo video generation requires a paid Gemini API key.

## What I learned

Getting FFmpeg to run in the browser was the hardest part of this project: it needs SharedArrayBuffer, which only works with the right COOP/COEP headers, and the 25MB core has to be lazy-loaded from CDN so the app stays fast. Building the clip detector also forced me to think about what "a good moment" in a video actually looks like in raw numbers (motion deltas, audio energy, scene boundaries) rather than relying on an API to decide for me.

## Contact

Portfolio: [nqobile-x.github.io/Nqobille](https://nqobile-x.github.io/Nqobille/)
