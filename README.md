# Hybrid AI Starter (Firebase AI Logic, Web)

Runs Gemini Nano on-device in desktop Chrome and falls back to the cloud model
(`gemini-3.5-flash-lite`). A badge shows which path answered each prompt (`inferenceSource`).

## Requirements
- Node 20+
- Desktop Chrome 139+ for on-device inference
- A Firebase project with AI Logic enabled (Gemini Developer API) and App Check enforced

## 1. Chrome setup (on the machine you'll demo on)
1. Update Chrome at `chrome://settings/help` (139 or newer).
2. Set `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` to **Enabled**, then restart Chrome.
3. Without the flag every answer will read `IN_CLOUD`. Do a test run before recording.

## 2. Firebase setup
1. Firebase console > AI Services > AI Logic > Get started, and pick the **Gemini Developer API**.
2. Register a Web app and copy its config.
3. Security > App Check: register the app with **reCAPTCHA Enterprise** and copy the site key.
   Make sure Firebase AI Logic shows **Enforced** on the APIs tab.

## 3. Configure
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:5173
```

## 4. Register the App Check debug token (local only)
1. Open the app on localhost and open DevTools. The console prints `AppCheck debug token: "..."`.
2. Firebase console > Security > App Check > Apps > your app > menu > **Manage debug tokens**, then add it.
3. Never commit the token, never ship a debug build, and **never add localhost to the reCAPTCHA domains**.

## How it behaves
- The first click starts the on-device model download (it can take minutes). Prompts during
  the download answer from the cloud (`IN_CLOUD`), which is expected in `PREFER_ON_DEVICE` mode.
- When the progress line reads "ready", prompts run on-device (`ON_DEVICE`).
- On-device handles single-turn text, text plus JPEG/PNG, and structured JSON output (9,216-token limit).
  Chat, tools, PDFs, and audio fall back to the cloud. The Live API isn't supported in hybrid.

## Before release
Register a production App Check attestation (reCAPTCHA Enterprise on your real domain).

## License
Apache-2.0
