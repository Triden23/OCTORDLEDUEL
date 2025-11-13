# 1v1 Octordle Duel

A multiplayer Wordle-style game supporting 1v1 play on multiple boards simultaneously. Players compete to solve all boards first.

---
Temporary hosting for a few days
[http://ec2-3-142-68-150.us-east-2.compute.amazonaws.com:8080](http://ec2-3-142-68-150.us-east-2.compute.amazonaws.com:8080)
---

## Features

* Multiplayer support (2 players per room)
* Multiple boards per player
* On-screen keyboard with per-board color tracking
* Real-time updates over WebSockets
* Automatic board feedback and win detection

---

## Requirements

* Node.js (v14 or higher recommended)
* Modern browser (Chrome, Edge, Firefox, etc.)
* Port 8080 open if running locally

---

## Installation on Windows

1. Install Node.js

   * Visit [https://nodejs.org/](https://nodejs.org/) and download the LTS version.
   * Run the installer and check "Add to PATH".

2. Verify Node.js installation:
   Open Command Prompt and run:

   ```
   node -v
   npm -v
   ```

3. Clone the repository:

   ```
   git clone https://github.com/Triden23/OCTORDLEDUEL.git
   cd OCTORDLEDUEL
   ```

4. Install dependencies:

   ```
   npm install
   ```

---

## Running Locally

1. Start the server:

   ```
   node server.js
   ```

2. Open the game in your browser:
   [http://localhost:8080](http://localhost:8080)

   Enter a room name to join or create a game.

> Note: Make sure port 8080 is open if running on a network with firewalls.

---

## Playing the Game

* Enter 5-letter guesses using the input box or on-screen keyboard.
* Colors update in real-time for each board.
* Win by solving all boards first.
* If your opponent disconnects, the page will refresh automatically.

---

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Make your changes
4. Submit a pull request

---

## Credits

* **Kilamonky** – Editor / Bug bloodhound

---

## License

MIT License © 2025

---

Repository Link: [https://github.com/Triden23/OCTORDLEDUEL/](https://github.com/Triden23/OCTORDLEDUEL/)

