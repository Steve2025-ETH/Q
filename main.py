from voice import speak, listen
from brain import handle

LANG = "en-US"

def main():
    speak("Q online. Text and voice ready.")
    print("Q online ✅")

    while True:
        mode = input("\nChoose mode: [t]ext / [v]oice / [exit]: ").strip().lower()

        if mode in ["exit", "quit", "stop"]:
            speak("Shutting down Q.")
            break

        if mode in ["t", "text", ""]:
            user_text = input("> ").strip()
        elif mode in ["v", "voice"]:
            print("Listening...")
            user_text = listen(language=LANG)
            if not user_text:
                print("(No speech detected)")
                speak("I did not catch that.")
                continue
            print("You said:", user_text)
        else:
            print("Unknown mode.")
            continue

        result = handle(user_text)
        if result == "__EXIT__":
            speak("Shutting down Q.")
            break

        print("\nQ:", result)
        speak(result)

if __name__ == "__main__":
    main()
