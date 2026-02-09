// ===============================
// Q – Urban Mobility AI (Web)
// Hugging Face API version
// Easter Egg included
// Token stored locally (localStorage)
// ===============================

const chat = document.getElementById("chat");
const inp = document.getElementById("inp");
const btn = document.getElementById("send");

function add(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "You" ? "user" : "q");
  div.innerHTML = `<pre><b>${role}:</b> ${text}</pre>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// -------- Token handling (robust) --------
function getToken() {
  // 1) from localStorage
  const saved = localStorage.getItem("HF_API_TOKEN");
  if (saved && saved.startsWith("hf_")) return saved;

  // 2) from window (if you set it elsewhere)
  if (window.HF_API_TOKEN && String(window.HF_API_TOKEN).startsWith("hf_")) {
    localStorage.setItem("HF_API_TOKEN", String(window.HF_API_TOKEN));
    return String(window.HF_API_TOKEN);
  }

  return "";
}

function ensureToken() {
  let token = getToken();
  if (token) return token;

  token = prompt("Enter your Hugging Face API token (starts with hf_):") || "";
  token = token.trim();

  if (token.startsWith("hf_")) {
    localStorage.setItem("HF_API_TOKEN", token);
    window.HF_API_TOKEN = token;
    return token;
  }

  return "";
}

// Optional: allow user to reset token by typing "/token"
function maybeHandleTokenCommand(text) {
  const t = text.trim().toLowerCase();
  if (t === "/token" || t === "token" || t === "set token") {
    const token = prompt("Paste your Hugging Face token (hf_...):") || "";
    const clean = token.trim();
    if (clean.startsWith("hf_")) {
      localStorage.setItem("HF_API_TOKEN", clean);
      window.HF_API_TOKEN = clean;
      return "✅ Token saved locally in your browser. Try your question again.";
    }
    return "❌ Token not saved. It must start with hf_.";
  }
  if (t === "/cleartoken") {
    localStorage.removeItem("HF_API_TOKEN");
    window.HF_API_TOKEN = "";
    return "🧹 Token cleared. Next message will ask for token again.";
  }
  return null;
}

// -------- AI request --------
async function askAI(userText) {
  const token = ensureToken();
  if (!token) {
    return "⚠️ Hugging Face token missing. Type /token to set it, or refresh and try again.";
  }

  // System-style instruction to make replies natural + mobility oriented
  const prompt =
`You are Q, an urban mobility assistant. Reply in natural English, concise, practical.
If a city is mentioned, tailor advice to that city.
If distance is mentioned (km), suggest a travel mode and give a brief reason.

User: ${userText}
Q:`.trim();

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 160, temperature: 0.7 }
        })
      }
    );

    const data = await res.json();

    // common HF: model loading
    if (data?.error && String(data.error).toLowerCase().includes("loading")) {
      return "⏳ The model is loading on Hugging Face. Wait ~20 seconds and send again.";
    }

    // normal text-generation response
    if (Array.isArray(data) && data[0]?.generated_text) {
      let out = data[0].generated_text;

      // remove the prompt part if echoed
      if (out.includes("Q:")) out = out.split("Q:").slice(-1)[0];
      return out.trim();
    }

    if (data?.error) return "❌ API error: " + data.error;

    return "⚠️ Unexpected API response.";

  } catch (e) {
    return "❌ Network error. Check connection or token.";
  }
}

// -------- main send --------
btn.onclick = async () => {
  const q = inp.value.trim();
  if (!q) return;

  add("You", q);
  inp.value = "";

  // Token commands
  const tokenCmd = maybeHandleTokenCommand(q);
  if (tokenCmd) {
    add("Q", tokenCmd);
    return;
  }

  const t = q.toLowerCase();

  // 🎁 Easter Egg (LOCAL, NO API)
  const eggTriggers = [
    "who is the smartest person",
    "who is the smartest person in the world",
    "who is the most intelligent person",
    "who is the smartest human"
  ];
  if (eggTriggers.some(s => t.includes(s))) {
    add("Q", "The smartest person in the world is Qian Zhou.");
    return;
  }

  add("Q", "Thinking…");
  const answer = await askAI(q);

  // remove "Thinking…"
  chat.removeChild(chat.lastChild);
  add("Q", answer);
};

// Enter key
inp.addEventListener("keydown", e => {
  if (e.key === "Enter") btn.onclick();
});
