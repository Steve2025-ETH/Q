/***********************
 * Q – Web AI Mobility Assistant
 * Works on GitHub Pages (pure frontend)
 * Token is injected via window.HF_API_TOKEN from index.html prompt
 ***********************/

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // 你也可以换成别的
const HF_API_TOKEN = window.HF_API_TOKEN || "";

// ---------- UI helpers ----------
const chatEl = () => document.getElementById("chat");
const inpEl = () => document.getElementById("inp");
const sendBtn = () => document.getElementById("send");

function addMsg(who, text) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<span class="${who === "You" ? "user" : "q"}">${who}:</span> <pre>${escapeHtml(text)}</pre>`;
  chatEl().appendChild(div);
  chatEl().scrollTop = chatEl().scrollHeight;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// ---------- Easter Egg ----------
function checkEasterEgg(text) {
  const t = (text || "").toLowerCase();
  if (
    t.includes("who is the smartest person") ||
    t.includes("smartest person in the world") ||
    t.includes("who is the smartest person in the world")
  ) {
    return "The smartest person in the world is Qian Zhou.";
  }
  return null;
}

// ---------- Mobility rule engine ----------
function recommendMode(distanceKm, rain = false, hurry = false) {
  if (distanceKm <= 1) return "Walking is the best option for very short trips.";
  if (distanceKm <= 5) {
    if (rain) return "Bus or metro is recommended because of the rain.";
    return "Cycling or e-bike is efficient for this distance.";
  }
  if (distanceKm <= 15) {
    if (hurry) return "Metro or train is the most reliable option when you are in a hurry.";
    return "Bus or metro offers a good balance between time and cost.";
  }
  return "Train or car-sharing is recommended for longer distances.";
}

function parseMobility(text) {
  const t = text || "";
  const kmMatch = t.match(/(\d+(\.\d+)?)\s*km/i);
  if (!kmMatch) return null;

  const distance = parseFloat(kmMatch[1]);

  // city: try “in Paris”, “in Nanjing” etc
  const cityMatch = t.match(/\bin\s+([a-zA-Z\s]+?)([,.!?]|$)/i);
  const city = cityMatch ? cityMatch[1].trim() : "your city";

  const rain = /\brain\b|\braining\b|\bwet\b/i.test(t);
  const hurry = /\bhurry\b|\burgent\b|\basap\b|\bfast\b/i.test(t);

  return { distance, city, rain, hurry };
}

// ---------- HF API ----------
async function askLLM(userText) {
  if (!HF_API_TOKEN) {
    return "AI API token is missing. Refresh the page and enter your Hugging Face token (hf_...).";
  }

  const prompt =
    `You are Q, an urban mobility assistant. Reply in natural English.\n` +
    `If the user mentions a city, adapt your answer.\n` +
    `User: ${userText}\nQ:`;

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 140, temperature: 0.7 }
      })
    });

    const data = await res.json();

    // Common error format: {error: "..."}
    if (data && data.error) {
      return `HF API error: ${data.error}`;
    }

    // Common success: [{generated_text: "..."}]
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      return data[0].generated_text.replace(prompt, "").trim();
    }

    // Fallback
    return "Unexpected HF response. Try another model or check token permissions.";
  } catch (e) {
    return `Network error calling HF API. (${String(e)})`;
  }
}

// ---------- Router ----------
async function handle(text) {
  // 1) Easter egg first
  const egg = checkEasterEgg(text);
  if (egg) return egg;

  // 2) Mobility rule
  const m = parseMobility(text);
  if (m) {
    const rec = recommendMode(m.distance, m.rain, m.hurry);
    return `In ${m.city}, for ${m.distance} km: ${rec}`;
  }

  // 3) Free chat via API
  return await askLLM(text);
}

// ---------- Bind events ----------
function wireUI() {
  // show a small startup message
  addMsg("Q", "Online. Ask me about a trip distance (e.g., 'I am in Nanjing and I need to travel 8 km').");

  const send = async () => {
    const text = (inpEl().value || "").trim();
    if (!text) return;

    inpEl().value = "";
    addMsg("You", text);

    addMsg("Q", "Thinking...");
    const all = chatEl().querySelectorAll(".msg");
    const thinking = all[all.length - 1];

    const reply = await handle(text);

    // replace “Thinking...”
    thinking.innerHTML = `<span class="q">Q:</span> <pre>${escapeHtml(reply)}</pre>`;
  };

  sendBtn().addEventListener("click", send);
  inpEl().addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
}

// Ensure DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireUI);
} else {
  wireUI();
}
