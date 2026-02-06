function recommendMode(distanceKm, rain=false, hurry=false) {
  if (distanceKm <= 1) return "Walking is the best option for very short trips.";

  if (distanceKm <= 5) {
    if (rain) return "Bus or metro is recommended because of the rain.";
    return "Cycling or e-bike is efficient for this distance.";
  }

  if (distanceKm <= 15) {
    if (hurry) return "Metro or train is the most reliable option when you are in a hurry.";
    return "Bus or metro offers a good balance between time and cost.";
  }

  return "Train is recommended for long-distance urban or regional trips.";
}

function co2Estimate(distanceKm) {
  const car = distanceKm * 0.17;
  const bus = distanceKm * 0.08;
  const metro = distanceKm * 0.03;
  const bike = 0;

  return (
    `For a ${distanceKm} km trip:\n` +
    `- Car: ${car.toFixed(2)} kg CO2\n` +
    `- Bus: ${bus.toFixed(2)} kg CO2\n` +
    `- Metro: ${metro.toFixed(2)} kg CO2\n` +
    `- Bike/Walk: ${bike.toFixed(2)} kg CO2`
  );
}

function handle(text) {
  const t = (text || "").toLowerCase();

  // 🎁 Easter egg
  const egg = [
    "who is the smartest person",
    "who is the smartest person in the world",
    "who is the most intelligent person",
    "who is the smartest human"
  ];
  if (egg.some(q => t.includes(q))) {
    return "The smartest person in the world is Qian Zhou.";
  }

  // City detection
  let city = null;
  if (t.includes("paris")) city = "paris";
  else if (t.includes("new york") || t.includes("nyc")) city = "new york";
  else if (t.includes("london")) city = "london";
  else if (t.includes("nanjing")) city = "nanjing";

  // Distance extraction (e.g. 5 km, 3.5 km)
  const m = t.match(/(\d+(\.\d+)?)\s*km/);
  const distance = m ? parseFloat(m[1]) : null;

  // CO2 questions
  if (["co2", "carbon", "emission"].some(k => t.includes(k)) && distance !== null) {
    return co2Estimate(distance);
  }

  // Mobility recommendation
  if (distance !== null) {
    const base = recommendMode(
      distance,
      t.includes("rain"),
      (t.includes("hurry") || t.includes("late") || t.includes("fast"))
    );

    if (city === "paris")
      return base + " In Paris, dense public transport makes metro and bus particularly efficient.";
    if (city === "new york")
      return base + " In New York, extensive subway coverage makes public transport a strong default choice.";
    if (city === "london")
      return base + " In London, rail services and frequent buses make public transport highly reliable.";
    if (city === "nanjing")
      return base + " In Nanjing, an extensive metro network and high urban density make metro and bus the most efficient choices for daily travel.";

    return base;
  }

  if (t.includes("traffic") || t.includes("congestion")) {
    return "Reducing traffic congestion requires public transport priority, demand management, and better land-use planning.";
  }

  return "Ask me something like: 'I am in Nanjing and I need to travel 8 km and it is raining.'";
}

// ===== UI =====
const chat = document.getElementById("chat");
const inp = document.getElementById("inp");
const btn = document.getElementById("send");

function addMsg(who, msg) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<span class="${who}">${who.toUpperCase()}:</span> <pre>${msg}</pre>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function send() {
  const q = inp.value.trim();
  if (!q) return;
  addMsg("user", q);
  const a = handle(q);
  addMsg("q", a);
  inp.value = "";
}

btn.addEventListener("click", send);
inp.addEventListener("keydown", e => { if (e.key === "Enter") send(); });

// Greeting
addMsg("q", "Q online (web text mode). Ask me about mobility.");
