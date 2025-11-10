(() => {
  const statusEl = document.getElementById('status');
  const joinBtn = document.getElementById('joinBtn');
  const roomInput = document.getElementById('roomInput');
  const gameArea = document.getElementById('gameArea');
  const yourBoardsEl = document.getElementById('yourBoards');
  const oppBoardsEl = document.getElementById('oppBoards');
  const guessInput = document.getElementById('guessInput');
  const guessBtn = document.getElementById('guessBtn');
  const messages = document.getElementById('messages');
  const youScore = document.getElementById('youScore');
  const opScore = document.getElementById('opScore');

  let ws, playerId, boardCount = 8, maxGuesses = 13;
  let yourState, oppState;

  function setStatus(s) { statusEl.innerText = s; }
  function addMsg(m) {
    const p = document.createElement('div');
    p.innerText = m;
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function makeBoards(n) {
    yourBoardsEl.innerHTML = '';
    oppBoardsEl.innerHTML = '';
    yourState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };
    oppState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };

    for (let b = 0; b < n; b++) {
      // Your board
      const bd = document.createElement('div'); bd.className = 'board'; bd.id = `your-board-${b}`;
      for (let r = 0; r < maxGuesses; r++) {
        const row = document.createElement('div'); row.className = 'row';
        for (let c = 0; c < 5; c++) { const t = document.createElement('div'); t.className = 'tile'; t.innerText = ''; row.appendChild(t); }
        bd.appendChild(row);
      }
      yourBoardsEl.appendChild(bd);

      // Opponent board
      const obd = document.createElement('div'); obd.className = 'board'; obd.id = `opp-board-${b}`;
      for (let r = 0; r < maxGuesses; r++) {
        const row = document.createElement('div'); row.className = 'row';
        for (let c = 0; c < 5; c++) { const t = document.createElement('div'); t.className = 'tile'; t.innerText = ''; row.appendChild(t); }
        obd.appendChild(row);
      }
      oppBoardsEl.appendChild(obd);
    }
  }

  function updateScores() {
    youScore.innerText = `${yourState.solvedCount}/${boardCount}`;
    opScore.innerText = `${oppState.solvedCount}/${boardCount}`;
  }

  function applyFeedback(board, attemptIndex, guess, feedback, fromYou) {
    const bd = document.getElementById(fromYou ? `your-board-${board}` : `opp-board-${board}`);
    if (!bd) return;
    if (attemptIndex >= bd.children.length) return;
    const row = bd.children[attemptIndex];
    for (let i = 0; i < 5; i++) {
      const tile = row.children[i];
      tile.classList.remove('g', 'y', 'b', 'op-hidden', 'op-solved');
      if (fromYou) {
        tile.classList.add(feedback[i]);
        tile.innerText = guess[i].toUpperCase();
      } else {
        tile.classList.add(feedback[i]); // colors only
        tile.innerText = '';
      }
    }
  }

    function connect(room) {
    const loc = window.location;
    const wsUrl = `ws://${loc.hostname}:8080/?room=${encodeURIComponent(room)}`;
    ws = new WebSocket(wsUrl);
    setStatus('Connecting...');
    ws.onopen = () => setStatus('Connected');
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'joined') {
          playerId = data.playerId; boardCount = data.boardCount || boardCount; maxGuesses = data.maxGuesses || maxGuesses;
          makeBoards(boardCount);
          setStatus(`Joined as ${playerId}. Waiting for opponent...`);
        } else if (data.type === 'wait') { setStatus(data.message); }
        else if (data.type === 'start') {
          setStatus(data.message);
          gameArea.classList.remove('hidden');
          document.getElementById('inputArea').classList.remove('hidden');
          addMsg('Game started!');
        }
        else if (data.type === 'invalid') {
          addMsg(data.message);
        }
        else if (data.type === 'update') {
          const { guess, feedbacks, fromYou } = data;
          feedbacks.forEach((fb, b) => {
            if (!fb) return; // skip boards that are already solved in previous guesses

            const boardState = fromYou ? yourState : oppState;
            const attempts = boardState.attemptsPerBoard[b].length;

            // Apply this guess
            boardState.attemptsPerBoard[b].push({ guess, feedback: fb });
            applyFeedback(b, attempts, guess, fb, fromYou);

            // Mark as solved after applying the guess
            if (fb.every(c => c === 'g')) boardState.solved[b] = true;
          });

          if (fromYou) { yourState.solvedCount = data.solvedCount; } else { oppState.solvedCount = data.solvedCount; }
          updateScores();
          applyFeedbackToKeyboard(data.guess, data.feedbacks);

          //if (fromYou) addMsg(`${data.guesser} guessed "${guess.toUpperCase()}"`);
        }
        else if (data.type === 'finish') { addMsg(data.message); }
        else if (data.type === 'opponentLeft') { setStatus('Opponent disconnected'); addMsg('Opponent left'); }
      } catch (e) { console.error(e); }
    };
  }

  joinBtn.onclick = () => { const r = roomInput.value.trim() || 'default'; connect(r); };

  guessBtn.onclick = sendGuess;
  guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendGuess(); });

  function sendGuess() {
    const guess = (guessInput.value || '').trim().toLowerCase();
    if (!guess || guess.length !== 5) { addMsg('Guess must be 5 letters'); return; }
    ws.send(JSON.stringify({ type: 'guess', guess }));
    guessInput.value = '';
  }

  // Auto-connect if room in URL
  const urlParams = new URLSearchParams(window.location.search);
  const r = urlParams.get('room');
  if (r) roomInput.value = r;

})();

// === On-Screen Keyboard Integration ===
(() => {
  const keyboardLayout = [
    "q w e r t y u i o p".split(" "),
    "a s d f g h j k l".split(" "),
    ["Enter", ..."zxcvbnm".split(""), "Back"]
  ];

  const keyboardContainer = document.getElementById("keyboard");
  const guessInput = document.getElementById("guessInput");
  const guessBtn = document.getElementById("guessBtn");

  function createKeyboard() {
    keyboardLayout.forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("keyboard-row");

      row.forEach(key => {
        const btn = document.createElement("button");
        btn.classList.add("key");
        btn.textContent = key;
        btn.dataset.key = key;
        btn.onclick = onKeyClick;
        rowDiv.appendChild(btn);
      });

      keyboardContainer.appendChild(rowDiv);
    });
  }

  function onKeyClick(e) {
    const key = e.target.dataset.key;

    if (key === "Enter") {
      guessBtn.click(); // same as hitting Guess
    } else if (key === "Back") {
      guessInput.value = guessInput.value.slice(0, -1);
    } else if (key.length === 1 && guessInput.value.length < 5) {
      guessInput.value += key.toLowerCase();
    }
  }

  createKeyboard();
  // === Keyboard Feedback Coloring ===
const boardCount = document.querySelectorAll('.board').length;
const keyStates = {}; // { letter: [statePerBoard] }, state = 'g','y','b', or null

// Create per-segment visuals
function createSegmentedKeys() {
  document.querySelectorAll('.key').forEach(key => {
    const letter = key.dataset.key.toLowerCase();
    if (letter.length === 1) {
      key.innerHTML = ''; // clear
      for (let i = 0; i < boardCount; i++) {
        const seg = document.createElement('div');
        seg.classList.add('seg');
        key.appendChild(seg);
      }
      keyStates[letter] = Array(boardCount).fill(null);
    }
  });
}

function updateKeyboardColors() {
  for (const [letter, states] of Object.entries(keyStates)) {
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    if (!key) continue;
    key.querySelectorAll('.seg').forEach((seg, i) => {
      const s = states[i];
      seg.style.backgroundColor =
        s === 'g' ? '#6aaa64' :
        s === 'y' ? '#c9b458' :
        s === 'b' ? '#3a3a3c' :
        '#222';
    });
  }
}

// When new feedback comes in:
function applyFeedbackToKeyboard(guess, feedbacks) {
  feedbacks.forEach((fb, boardIndex) => {
    if (!fb) return;
    fb.forEach((f, i) => {
      const letter = guess[i];
      if (!keyStates[letter]) return;
      const prev = keyStates[letter][boardIndex];

      // update priority: green > yellow > gray
      const rank = { g: 3, y: 2, b: 1, null: 0 };
      if (rank[f] > rank[prev]) {
        keyStates[letter][boardIndex] = f;
      }
    });
  });
  updateKeyboardColors();
}

createSegmentedKeys();
updateKeyboardColors();
})();