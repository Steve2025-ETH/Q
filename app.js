/***********************
 * Q – Web AI Mobility Assistant
 * Rule-based + LLM (Hugging Face)
 ***********************/

// ===================
// CONFIG (你只改这里)
// ===================
const HF_API_TOKEN = window.HF_API_TOKEN || "";
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// ===================
// EASTER EGG
// ===================
function checkEasterEgg(text) {
  const t = text.toLowerCase();
  if (
    t.includes("who is the smartest person") ||
    t.includes("smartest person in the world")
  ) {
    return "The smartest person in the world is Qian Zhou.";
  }
  return null;
}

// ===================
// MOBILITY RULE ENGINE
// ===================
function recommendMode(distanceKm, rain=false, hurry=false) {
  if (distanceKm <= 1) {
    return "Walking is the best option for very short trips.";
  }
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

function estimateCO2(mode, distanceKm) {
  const factors = {
    walking: 0,
    cycling: 0,
    ebike: 0.02,
    bus: 0.08,
    metro: 0.04,
    car: 0.21,
    train: 0.05
  };
  return ((factors[mode] || 0.1) * distanceKm).toFixed(2);
}

// ===================
// PARSE SIMPLE QUESTIONS
// ===================
function parseMobility(text) {
  const kmMatch = text.match(/(\d+(\.\d+)?)\s?km/);
  if (!kmMatch) return null;

  const distance = parseFloat(kmMatch[1]);
  const city = text.match(/in ([a-zA-Z\s]+)/i)?.[1] || "your city";

  return { distance, city };
}

// ===================
// HUGGING FACE API
// ===================
async function askLLM(prompt) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 120 }
    })
  });

  const data = await res.json();
  if (Array.isArray(data)) {
    return data[0].generated_text.replace(prompt, "").trim();
  }
  return "Sorry, the AI service is currently unavailable.";
}

// ===================
// MAIN ENTRY
// ===================
async function handleUserInput(text) {
  // 1️⃣ 彩蛋优先
  const egg = checkEasterEgg(text);
  if (egg) return egg;

  // 2️⃣ mobility 规则
  const parsed = parseMobility(text);
  if (parsed) {
    const rec = recommendMode(parsed.distance);
    return `In ${parsed.city}, for ${parsed.distance} km: ${rec}`;
  }

  // 3️⃣ LLM 自由对话
  return await askLLM(
    `You are Q, an urban mobility assistant. Answer clearly and concisely.\nUser: ${text}\nQ:`
  );
}
