import speech_recognition as sr
import pyttsx3

_engine = None

def speak(text: str):
    global _engine
    if _engine is None:
        _engine = pyttsx3.init()
        _engine.setProperty("rate", 175)
    _engine.say(text)
    _engine.runAndWait()

def listen(language="en-US", timeout=6, phrase_time_limit=12):
    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.6)
        audio = r.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)

    try:
        return r.recognize_google(audio, language=language)
    except:
        return ""
