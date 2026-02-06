def recommend_mode(distance_km, rain=False, hurry=False):
    """
    Recommend a transport mode based on distance and simple conditions.
    """

    if distance_km <= 1:
        return "Walking is the best option for very short trips."

    if distance_km <= 5:
        if rain:
            return "Bus or metro is recommended because of the rain."
        return "Cycling or e-bike is efficient for this distance."

    if distance_km <= 15:
        if hurry:
            return "Metro or train is the most reliable option when you are in a hurry."
        return "Bus or metro offers a good balance between time and cost."

    return "Train is recommended for long-distance urban or regional trips."


def co2_estimate(distance_km):
    """
    Rough CO2 emission estimates (kg CO2) for different transport modes.
    """

    car = distance_km * 0.17
    bus = distance_km * 0.08
    metro = distance_km * 0.03
    bike = 0

    return (
        f"For a {distance_km} km trip:\n"
        f"- Car: {car:.2f} kg CO2\n"
        f"- Bus: {bus:.2f} kg CO2\n"
        f"- Metro: {metro:.2f} kg CO2\n"
        f"- Bike/Walk: {bike:.2f} kg CO2"
    )
