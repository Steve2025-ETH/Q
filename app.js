/* Q Mobility (offline, rule-based, city knowledge base)
   - Works on GitHub Pages (no API)
   - Supports many cities via fallback heuristics
   - Includes easter egg 🎁
*/

const CITY_DB = {
  // --- China ---
  "nanjing": {
    display: "Nanjing",
    country: "China",
    type: "dense_megacity",
    transit: 0.90,   // metro/bus strength
    bike: 0.70,      // bike/e-bike friendliness
    walk: 0.65,      // walkability
    congestion: 0.70,
    notes: [
      "Dense city: metro + buses are usually efficient for mid-range trips.",
      "E-bikes are common for 1–5 km trips.",
      "Rush hour can be crowded; allow buffer time."
    ],
    hubs: ["Nanjing South Railway Station", "Nanjing Railway Station"]
  },

  // --- France ---
  "paris": {
    display: "Paris",
    country: "France",
    type: "dense_megacity",
    transit: 0.95,
    bike: 0.75,
    walk: 0.85,
    congestion: 0.80,
    notes: [
      "Excellent metro/RER coverage for most trips.",
      "Cycling is good for 1–6 km if you are comfortable in city traffic.",
      "Short trips are often fastest on foot + metro."
    ],
    hubs: ["Gare du Nord", "Gare de Lyon", "Gare Montparnasse"]
  },

  // --- USA ---
  "new york": {
    display: "New York City",
    country: "USA",
    type: "dense_megacity",
    transit: 0.90,
    bike: 0.75,
    walk: 0.85,
    congestion: 0.85,
    notes: [
      "Subway + walking is usually best inside Manhattan and many borough routes.",
      "Traffic is heavy; taxis can be slower at peak times.",
      "Cycling is viable on protected lanes."
    ],
    hubs: ["Grand Central Terminal", "Penn Station"]
  },

  "columbia": {
    display: "Columbia, SC",
    country: "USA",
    type: "car_city",
    transit: 0.35,
    bike: 0.35,
    walk: 0.30,
    congestion: 0.55,
    notes: [
      "Lower density: driving is common for many trips.",
      "Buses can work for specific corridors, but frequency may be limited.",
      "Walking is best for short campus/downtown trips."
    ],
    hubs: ["Columbia Amtrak (nearby)", "Downtown Transit Center"]
  },

  // Add more cities here as you like:
  // "shanghai": {...}, "london": {...}, "tokyo": {...}
};

const CITY_ALIASES = {
  "nj": "nanjing",
  "nanjing city": "nanjing",
  "paris city": "paris",
  "nyc": "new york",
  "new york city": "new york",
  "columbia sc": "columbia",
  "columbia, sc": "columbia",
};

// ---------- helpers ----------
function norm(s) {
  return (s || "").toLowerCase().trim();
}

function findCity(text) {
  const t = norm(text);

  // alias hit
  for (const k of Object.keys(CITY_ALIASES)) {
    if (t.includes(k)) return CITY_ALIASES[k];
  }

  // direct DB hit
  for (const key of Object.keys(CITY_DB)) {
    if (t.includes(key)) return key;
  }

  // heuristic: patterns like "I am in X" / "in X"
  // (best-effort, not perfect)
  const m1 = t.match(/\bi am in\s+([a-z\s\.,-]+)/i);
  const m2 = t.match(/\bin\s+([a-z\s\.,-]+)\b/i);
  const raw = (m1 && m1[1]) || (m2 && m2[1]) || "";
  const candidate = norm(raw).replace(/[^a-z\s]/g, "").trim();
  if (!candidate) return null;

  // try partial match with DB keys
  for (const key of Object.keys(CITY_DB)) {
    if (candidate.includes(key) || key.includes(candidate)) return key;
  }

  return null;
}

function parseDistanceKm(text) {
  const t = norm(text);
  // supports: 8 km, 8km, 3.5 km, 2公里
  let m = t.match(/(\d+(\.\d+)?)\s*km\b/);
  if (m) return parseFloat(m[1]);

  m = t.match(/(\d+(\.\d+)?)\s*公里/);
  if (m) return parseFloat(m[1]);

  // miles
  m = t.match(/(\d+(\.\d+)?)\s*mi\b/);
  if (m) return parseFloat(m[1]) * 1.60934;

  return null;
}

function hasAny(text, arr) {
  const t = norm(text);
  return arr.some(x => t.includes(x));
}

function parseConditions(text) {
  const t = norm(text);
  return {
    rain: hasAny(t, ["rain", "raining", "storm", "wet", "shower", "下雨", "雨天"]),
    hurry: hasAny(t, ["hurry", "urgent", "late", "asap", "rush", "赶时间", "来不及", "迟到"]),
    night: hasAny(t, ["night", "late night", "midnight", "晚上", "夜里", "深夜"]),
    luggage: hasAny(t, ["luggage", "suitcase", "bag", "行李", "箱子"]),
    accessible: hasAny(t, ["wheelchair", "accessible", "disability", "无障碍", "轮椅"]),
    rushHour: hasAny(t, ["rush hour", "peak", "morning peak", "evening peak", "高峰", "早高峰", "晚高峰"]),
    budget: hasAny(t, ["cheap", "budget", "save money", "省钱", "便宜"]),
    safety: hasAny(t, ["safe", "safety", "danger", "危险", "安全"])
  };
}

function cityTypeGuess(cityKey) {
  // fallback if city not found
  return {
    display: cityKey ? cityKey : "your city",
    country: "Unknown",
    type: "unknown",
    transit: 0.55,
    bike: 0.50,
    walk: 0.50,
    congestion: 0.55,
    notes: [
      "No city profile found. Using general urban mobility rules."
    ],
    hubs: []
  };
}

// ---------- core mobility logic ----------
function recommendMode(cityProfile, km, cond) {
  // distance missing: give structured questions + generic suggestions
  if (km == null || isNaN(km)) {
    return {
      mode: "Need distance",
      reason:
        "Tell me the distance (e.g., 3 km / 8 km) and constraints (rain, hurry, night). Then I can give a sharper recommendation."
    };
  }

  // base thresholds
  // Very short
  if (km <= 1) {
    if (cond.rain) return { mode: "Metro/Bus + short walk", reason: "In rain, staying dry matters even for short trips." };
    return { mode: "Walk", reason: "Under 1 km, walking is usually the fastest and simplest." };
  }

  // Short
  if (km <= 5) {
    if (cond.luggage || cond.accessible) return { mode: "Metro/Bus or taxi/ride-hailing", reason: "Comfort and access matter with luggage/needs." };
    if (cond.rain) return { mode: "Metro/Bus", reason: "Rain makes cycling less comfortable and less safe." };
    // city-specific bias
    if (cityProfile.bike >= 0.65) return { mode: "Bike / e-bike", reason: "For 1–5 km, bike/e-bike is efficient in many cities." };
    if (cityProfile.walk >= 0.70) return { mode: "Walk + public transport", reason: "Walkability is decent; mix with transit if needed." };
    return { mode: "Bus/Metro (if available)", reason: "Public transport is a good default for short trips." };
  }

  // Medium
  if (km <= 15) {
    if (cond.hurry) {
      if (cityProfile.transit >= 0.75) return { mode: "Metro/Rail", reason: "Transit avoids traffic uncertainty when you’re in a hurry." };
      return { mode: "Taxi/ride-hailing", reason: "If transit is weak, a direct car route is often faster." };
    }
    if (cond.rushHour && cityProfile.transit >= 0.70) {
      return { mode: "Metro/Rail", reason: "Rush hour traffic makes road options slower; rail is more reliable." };
    }
    if (cityProfile.transit >= 0.70) return { mode: "Metro/Bus", reason: "Mid-range trips are where transit shines most." };
    return { mode: "Car/ride-hailing", reason: "In car-oriented cities, road travel is often the practical choice." };
  }

  // Long
  if (km > 15) {
    if (cityProfile.transit >= 0.75) return { mode: "Rail + last-mile", reason: "Long distance: rail is efficient, then connect by bus/walk." };
    return { mode: "Car (or intercity bus/train if available)", reason: "Long trips need high-speed corridors; pick the most direct option." };
  }

  return { mode: "Public transport", reason: "Default recommendation." };
}

function estimateCO2(mode, km) {
  // rough grams CO2 per km (illustrative)
  // Walk/Bike ~ 0, Metro ~ 35, Bus ~ 80, Car ~ 170, Taxi ~ 200
  if (km == null) return null;

  const m = norm(mode);
  let gpkm = 100;
  if (m.includes("walk")) gpkm = 0;
  else if (m.includes("bike")) gpkm = 0;
  else if (m.includes("metro") || m.includes("rail")) gpkm = 35;
  else if (m.includes("bus")) gpkm = 80;
  else if (m.includes("taxi")) gpkm = 200;
  else if (m.includes("car")) gpkm = 170;

  return Math.round(gpkm * km);
}

function formatCityExtras(cityProfile) {
  const hubs = (cityProfile.hubs || []).slice(0, 2);
  if (!hubs.length) return "";
  return `\n\n🚉 Nearby major hubs: ${hubs.join(" / ")}`;
}

// ---------- easter egg 🎁 ----------
function easterEgg(text) {
  const t = norm(text);
  const triggers = [
    "who is the smartest person",
    "who is the smartest person in the world",
    "who is the most intelligent person",
    "who is the smartest human"
  ];
  if (triggers.some(x => t.includes(x))) {
    // 保留你原来的彩蛋风格
    return "The smartest person in the world is Qian Zhou.";
  }
  return null;
}

// ---------- UI binding ----------
function addMsg(who, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = "msg";
  const label = who === "user" ? "You" : "Q";
  div.innerHTML = `<span class="${who}">${label}:</span> <pre>${text}</pre>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function buildAnswer(userText) {
  // easter egg first
  const egg = easterEgg(userText);
  if (egg) return egg;

  const cityKey = findCity(userText);
  const profile = cityKey ? CITY_DB[cityKey] : cityTypeGuess(null);
  const km = parseDistanceKm(userText);
  const cond = parseConditions(userText);

  const rec = recommendMode(profile, km, cond);
  const co2g = estimateCO2(rec.mode, km);

  const cityLine = cityKey
    ? `📍 City detected: ${profile.display} (${profile.country})`
    : `📍 City not recognized. Using general rules. (Tip: say "I am in Paris/Nanjing/New York...")`;

  const condLine = [
    cond.rain ? "rain" : null,
    cond.hurry ? "hurry" : null,
    cond.night ? "night" : null,
    cond.luggage ? "luggage" : null,
    cond.accessible ? "accessible" : null,
    cond.rushHour ? "rush hour" : null,
    cond.budget ? "budget" : null
  ].filter(Boolean);

  const conditions = condLine.length ? `🧩 Conditions: ${condLine.join(", ")}` : `🧩 Conditions: none detected`;

  const dataNotes = (profile.notes || []).slice(0, 3).map(x => `- ${x}`).join("\n");
  const co2Line = (co2g != null)
    ? `🌿 CO₂ estimate (rough): ~${co2g} g for ${km.toFixed(1)} km`
    : `🌿 CO₂ estimate: provide distance to estimate`;

  return [
    cityLine,
    conditions,
    "",
    `✅ Recommendation: ${rec.mode}`,
    `🧠 Reason: ${rec.reason}`,
    co2Line,
    formatCityExtras(profile),
    "",
    "📚 City profile notes:",
    dataNotes,
    "",
    "🧪 Example inputs you can try:",
    '- "I am in Nanjing and need to travel 8 km during rush hour"',
    '- "In Paris, 3 km, raining, I am in a hurry"',
    '- "New York City, 18 km, late night, with luggage"'
  ].join("\n");
}

function onSend() {
  const inp = document.getElementById("inp");
  const text = (inp.value || "").trim();
  if (!text) return;

  addMsg("user", text);
  const ans = buildAnswer(text);
  addMsg("q", ans);

  inp.value = "";
}

function init() {
  const btn = document.getElementById("send");
  const inp = document.getElementById("inp");

  if (btn) btn.addEventListener("click", onSend);
  if (inp) {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSend();
    });
  }

  // greeting
  addMsg("q", "Hi! Ask me about mobility in any city. Example: 'I am in Nanjing and need to travel 8 km during rush hour'.");
}

document.addEventListener("DOMContentLoaded", init);
