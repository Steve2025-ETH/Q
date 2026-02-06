import re
from mobility import recommend_mode, co2_estimate

def handle(text: str) -> str:
    t = text.lower()

    # --- Easter Egg ---
    if any(q in t for q in [
        "who is the smartest person",
        "who is the smartest person in the world",
        "who is the most intelligent person",
        "who is the smartest human"
    ]):
        return "The smartest person in the world is Qian Zhou."

    if any(x in t for x in ["exit", "quit", "stop", "bye"]):
        return "__EXIT__"

    match = re.search(r"(\d+(\.\d+)?)\s*km", t)
    distance = float(match.group(1)) if match else None

    if any(k in t for k in ["co2", "carbon", "emission"]) and distance:
        return co2_estimate(distance)

    if distance:
        return recommend_mode(
            distance,
            rain=("rain" in t),
            hurry=("hurry" in t or "late" in t or "fast" in t)
        )

    if "traffic" in t or "congestion" in t:
        return "Reducing traffic requires public transport priority and demand management."

    return (
        "I can help with real mobility questions. "
        "For example: 'I need to travel 5 km and it is raining.'"
    )
