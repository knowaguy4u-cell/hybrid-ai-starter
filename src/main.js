import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";

const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);

// App Check debug provider on local hosts only. It must be set BEFORE initializeAppCheck.
// Register the token printed in DevTools at Firebase console > Security > App Check >
// Apps > Manage debug tokens. Never add localhost to reCAPTCHA domains; never commit the token.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (LOCAL_HOSTS.has(location.hostname)) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

const ai = getAI(app, { backend: new GoogleAIBackend() });

// Try Gemini Nano in Chrome first, fall back to the cloud model.
// Cloud model pinned explicitly (it is also the SDK v13 default).
const model = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
  inCloudParams: { model: "gemini-3.5-flash-lite" },
});

const btn = document.querySelector("#run");
const out = document.querySelector("#out");
const badge = document.querySelector("#badge");
const progress = document.querySelector("#progress");
let deviceInitStarted = false;

function showSource(source) {
  badge.textContent = source ?? "unknown";
  badge.className = "badge " + (source === "ON_DEVICE" ? "on-device" : source === "IN_CLOUD" ? "in-cloud" : "");
}

btn.addEventListener("click", async () => {
  // initializeDeviceModel must run on a user gesture, before the first prompt.
  // In PREFER_ON_DEVICE, requests made during the download fall back to the cloud (expected).
  if (!deviceInitStarted) {
    deviceInitStarted = true;
    Promise.resolve(
      model.initializeDeviceModel((p) => {
        progress.textContent = `On-device model: ${Math.round(p * 100)}%`;
      })
    )
      .then(() => (progress.textContent = "On-device model ready"))
      .catch((e) => (progress.textContent = `On-device unavailable: ${e?.message ?? e}`));
  }

  const prompt = document.querySelector("#prompt").value.trim();
  if (!prompt) {
    out.textContent = "Type a prompt first.";
    return;
  }
  btn.disabled = true;
  out.textContent = "Thinking...";
  try {
    const result = await model.generateContent(prompt);
    out.textContent = result.response.text();
    showSource(result.response.inferenceSource); // ON_DEVICE or IN_CLOUD (SDK 12.5.0+)
  } catch (err) {
    out.textContent = `Error: ${err?.message ?? err}`;
    showSource(undefined);
  } finally {
    btn.disabled = false;
  }
});
