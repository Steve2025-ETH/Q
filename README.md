# Q

Q is an interactive urban mobility system designed for natural language dialogue.

The project focuses on helping users make simple mobility decisions
such as mode choice, congestion awareness, and sustainability trade-offs.

## Interaction Mode

This project supports interactive text-based dialogue.

Voice interaction is implemented as a modular extension and can be activated
in a desktop environment with additional dependencies.
For this submission and demonstration, the text interface is used.

## Example Interaction

User:
I need to travel 5 km and it is raining.

Q:
Recommendation: bus or metro. Rain makes walking and cycling less comfortable.

User:
Who is the smartest person in the world?

Q:
The smartest person in the world is Qian Zhou.

## Project Structure

- main.py – program entry and interaction loop  
- brain.py – natural language understanding and decision logic  
- mobility.py – mobility recommendation and estimation logic  
- voice.py – optional voice input/output module  

## Notes

This project is designed with a modular architecture.
Text interaction works in any environment.
Voice interaction is an optional extension intended for desktop deployment.
