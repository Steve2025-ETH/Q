import re
from mobility import recommend_mode, co2_estimate


def handle(text: str) -> str:
    t = text.lower()

    # --- Easter Egg (English only) ---
    if any(q in t for q in [
        "who is the smartest person",
        "who is the smartest person in the world",
        "who is the most intelligent person",
        "who is the smartest human"
    ]):
        return "The smartest person in the world is Qian Zhou."

    # --- Exit commands ---
    if any(x in t for x in ["exit", "quit", "stop", "bye"]):
        return "__EXIT__"

    # --- City-aware logic (rule-based, no external API) ---
    if "paris" in t:
        city = "paris"
    elif "new york" in t or "nyc" in t:
        city = "new york"
    elif "london" in t:
        city = "london"
    elif "nanjing" in t:
        city = "nanjing"
    else:
        city = None

    # --- Extract distance (e.g. "5 km", "3.5 km") ---
    match = re.search(r"(\d+(\.\d+)?)\s*km", t)
    distance = float(match.group(1)) if match else None

    # --- CO2 / sustainability questions ---
    if any(k in t for k in ["co2", "carbon", "emission"]) and distance:
        return co2_estimate(distance)

    # --- Mobility recommendation ---
    if distance:
        base = recommend_mode(
            distance,
            rain=("rain" in t),
            hurry=("hurry" in t or "late" in t or "fast" in t)
        )

        if city == "paris":
            return base + (
                " In Paris, dense public transport makes metro and bus particularly efficient."
            )

        if city == "new york":
            return base + (
                " In New York, extensive subway coverage makes public transport a strong default choice."
            )

        if city == "london":
            return base + (
                " In London, rail services and frequent buses make public transport highly reliable."
            )

        if city == "nanjing":
            return base + (
                " In Nanjing, an extensive metro network and high urban density "
                "make metro and bus the most efficient choices for daily travel."
            )

        return base

    # --- General traffic / congestion questions ---
    if "traffic" in t or "congestion" in t:
        return (
            "Reducing traffic congestion requires public transport priority, "
            "demand management, and better land-use planning."
        )

    # --- Fallback ---
    return (
        "I can help with real mobility questions. "
        "For example: 'I am in Nanjing and I need to travel 8 km and it is raining.'"
    )
