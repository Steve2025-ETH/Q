// ===============================
// Q – Urban Mobility AI (Web)
// Hugging Face API version
// Easter Egg included
// ===============================

const chat = document.getElementById("chat");
const inp = document.getElementById("inp");
const btn = document.getElementById("send");

// -------- UI helpers --------
function add(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "You" ? "user" : "q");
  div.innerHTML = `<pre><b>${role}:</b> ${text}</pre>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// -------- AI request --------
async function askAI(prompt) {
  if (!window.HF_API_TOKEN) {
    return "⚠️ Hugging Face token missing. Please refresh and enter your token.";
  }

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + window.HF_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7
          }
        })
      }
    );

    const data = await res.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.replace(prompt, "").trim();
    }

    if (data.error) {
      return "❌ API error: " + data.error;
    }

    return "⚠️ Unexpected API response.";

  } catch (e) {
    return "❌ Network error. Check connection or token.";
  }
}

// -------- Button logic --------
btn.onclick = async () => {
  const q = inp.value.trim();
  if (!q) return;

  add("You", q);
  inp.value = "";

  const t = q.toLowerCase();

  // ===============================
  // 🎁 Easter Egg (LOCAL, NO API)
  // ===============================
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

  // ===============================
  // Normal AI flow
  // ===============================
  add("Q", "Thinking…");

  const answer = await askAI(q);

  // remove "Thinking…"
  chat.removeChild(chat.lastChild);

  add("Q", answer);
};

// -------- Enter key support --------
inp.addEventListener("keydown", e => {
  if (e.key === "Enter") btn.onclick();
});
