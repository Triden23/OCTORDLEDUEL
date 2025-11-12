(() => {
  /*
  Fix color on board, not constistent
  Fix key not removing white color if not on a key.

  Keyboard color, could be changed.
  Try making a grid of color instead of rows.

  Certain boards stop updating

  Put word entry at the bottom and the top of the screen just the clickable at the top.
  Center it

  Tick box to hide the opponent Boxes - DONE

  Add a line break every 2 rows to help distinguish //Working on - need some googling

  Add a guess count //Working on

  Larger amounts do stacked layout. (above 8) - research custom layout manager

  Increase keyboard size

  Add brief popup to show word not in list like 1 seconds and focus that.

  ---------------------------------------------------------------------------------------
  Wordle


*/
  //<select id="boardSelect"></select>
  const statusEl = document.getElementById('status');
  const joinBtn = document.getElementById('joinBtn');
  const roomInput = document.getElementById('roomInput');
  const gameArea = document.getElementById('gameArea');
  const yourBoardsEl = document.getElementById('yourBoards');
  const oppBoardsEl = document.getElementById('oppBoards');
  const guessInput = document.getElementById('guessInput');
  const guessInput2 = document.getElementById('guessInput2');
  const guessBtn = document.getElementById('guessBtn');
  const guessBtn2 = document.getElementById('guessBtn2');
  const messages = document.getElementById('messages');
  const messages2 = document.getElementById('messages2');
  const youScore = document.getElementById('youScore');
  const opScore = document.getElementById('opScore');
  const youGuess = document.getElementById('youGuess');
  const opGuess = document.getElementById('opGuess');
  const opCol = document.getElementById('opColumn');
  const youCol = document.getElementById('youColumn');
  const showOp = document.getElementById('show');

  let ws, playerId, boardCount = 8, maxGuesses = 13, youCurrentGuess = 0, opCurrentGuess = 0;
  let yourState, oppState;

  function setStatus(s) { statusEl.innerText = s; }
  function addMsg(m) {
    const p = document.createElement('div');
    p.innerText = m;
    
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
    messages2.appendChild(p);
    messages2.scrollTop = messages.scrollHeight;
  }

  /*function makeBoards(n) {
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
      if((b+1)%2==0){bd.style.paddingBottom = '50px';}
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
  }*/

  function makeBoards(n) {
    yourBoardsEl.innerHTML = '';
    oppBoardsEl.innerHTML = '';

    yourState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };
    oppState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };

    const tileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) || 36;
    const spacerHeight = tileSize / 2;

    for (let b = 0; b < n; b += 2) {
      // --- Your boards pair ---
      const yourPair = document.createElement('div');
      yourPair.className = 'board-pair';

      for (let i = 0; i < 2 && b + i < n; i++) {
        const bd = document.createElement('div');
        bd.className = 'board';
        bd.id = `your-board-${b + i}`;

        for (let r = 0; r < maxGuesses; r++) {
          const row = document.createElement('div');
          row.className = 'row';
          for (let c = 0; c < 5; c++) {
            const t = document.createElement('div');
            t.className = 'tile';
            t.innerText = '';
            row.appendChild(t);
          }
          bd.appendChild(row);
        }

        yourPair.appendChild(bd);
      }

      yourBoardsEl.appendChild(yourPair);

      if (b + 2 < n) {
        const spacer = document.createElement('div');
        spacer.className = 'board-spacer';
        spacer.style.height = `${spacerHeight}px`;
        spacer.style.width = '100%';
        yourBoardsEl.appendChild(spacer);
      }

      // --- Opponent boards pair ---
      const oppPair = document.createElement('div');
      oppPair.className = 'board-pair';

      for (let i = 0; i < 2 && b + i < n; i++) {
        const obd = document.createElement('div');
        obd.className = 'board';
        obd.id = `opp-board-${b + i}`;

        for (let r = 0; r < maxGuesses; r++) {
          const row = document.createElement('div');
          row.className = 'row';
          for (let c = 0; c < 5; c++) {
            const t = document.createElement('div');
            t.className = 'tile';
            t.innerText = '';
            row.appendChild(t);
          }
          obd.appendChild(row);
        }

        oppPair.appendChild(obd);
      }

      oppBoardsEl.appendChild(oppPair);

      if (b + 2 < n) {
        const spacer = document.createElement('div');
        spacer.className = 'board-spacer';
        spacer.style.height = `${spacerHeight}px`;
        spacer.style.width = '100%';
        oppBoardsEl.appendChild(spacer);
      }
    }
  }

  function updateScores() {
    youScore.innerText = `${yourState.solvedCount}/${boardCount}`;
    opScore.innerText = `${oppState.solvedCount}/${boardCount}`;
  }

  function updateGuesses() {
    youGuess.innerText = `${youCurrentGuess}/${maxGuesses}`;
    opGuess.innerText = `${opCurrentGuess}/${maxGuesses}`;
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

      if (fromYou && typeof updateKeyboardColors === 'function') {
        updateKeyboardColors(guess, feedback, board);
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
          document.getElementById('keyboard').classList.remove('hidden');
          document.getElementById('inputArea2').classList.remove('hidden');
          document.getElementById('playArea').classList.remove('hidden');
          addMsg('Game started!');
        }
        else if (data.type === 'invalid') {
          addMsg(data.message);
        }
        /*else if (data.type === 'update') {
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
          if (fromYou) { youCurrentGuess += 1; } else { opCurrentGuess += 1; }
          updateGuesses();
          //if (fromYou) addMsg(`${data.guesser} guessed "${guess.toUpperCase()}"`);
        }*/
        else if (data.type === 'update') {
          const { guess, feedbacks, fromYou } = data;
          const boardState = fromYou ? yourState : oppState;

          feedbacks.forEach((fb, boardIndex) => {
            if (!fb) return; // skip boards with no feedback from server

            const attempts = boardState.attemptsPerBoard[boardIndex].length;

            // Always apply feedback, even if the board is about to be solved
            boardState.attemptsPerBoard[boardIndex].push({ guess, feedback: fb });
            applyFeedback(boardIndex, attempts, guess, fb, fromYou);

            // Only now mark the board as solved if this guess was all green
            if (!boardState.solved[boardIndex] && fb.every(c => c === 'g')) {
              boardState.solved[boardIndex] = true;
            }
          });

          // Update solved counts and UI
          if (fromYou) { yourState.solvedCount = data.solvedCount; }
          else { oppState.solvedCount = data.solvedCount; }

          updateScores();

          // Increment guess counter for the correct player
          if (fromYou) { youCurrentGuess += 1; }
          else { opCurrentGuess += 1; }

          updateGuesses();
        }

        //else if (data.type === 'finish') { addMsg(data.message); }
        else if (data.type === 'opponentLeft') { setStatus('Opponent disconnected'); addMsg('Opponent left'); }
      } catch (e) { console.error(e); }
    };
  }

  joinBtn.onclick = () => { const r = roomInput.value.trim() || 'default'; connect(r); };

  guessBtn.onclick = sendGuess;
  guessInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendGuess(); });
  showOp.addEventListener('change', function () {
    // 'this' refers to the checkbox element within the callback function
    if (this.checked) {
      showsOp();
      // Perform actions when the checkbox is checked
    } else {
      hidesOp();
    }
  });

  guessBtn2.onclick = sendGuess2;
  guessInput2.addEventListener('keydown', e => { if (e.key === 'Enter') sendGuess2(); });

  function sendGuess() {
    const guess = (guessInput.value || '').trim().toLowerCase();
    if (!guess || guess.length !== 5) { addMsg('Guess must be 5 letters'); return; }
    ws.send(JSON.stringify({ type: 'guess', guess }));
    guessInput.value = '';
  }

  function sendGuess2() {
    const guess = (guessInput2.value || '').trim().toLowerCase();
    if (!guess || guess.length !== 5) { addMsg('Guess must be 5 letters'); return; }
    ws.send(JSON.stringify({ type: 'guess', guess }));
    guessInput2.value = '';
  }

  function showsOp() {
  opCol.style.display = 'block';  // or 'flex' if needed
  youCol.style.margin = '';       // remove centering margin if you added it
  gameArea.classList.remove('centered');
}

function hidesOp() {
  opCol.style.display = 'none';
  youCol.style.margin = '0 auto';  // center You column
  gameArea.classList.add('centered');  // optional for extra control
}

  // Auto-connect if room in URL
  const urlParams = new URLSearchParams(window.location.search);
  const r = urlParams.get('room');
  if (r) roomInput.value = r;

})();

(() => {
  const keyboardLayout = [
    "q w e r t y u i o p".split(" "),
    "a s d f g h j k l".split(" "),
    ["Back", ..."zxcvbnm".split(""), "Enter"]
  ];

  const keyboardContainer = document.getElementById("keyboard");
  const guessInput = document.getElementById("guessInput");
  const guessInput2 = document.getElementById("guessInput2");
  const guessBtn = document.getElementById("guessBtn");
  const guessBtn2 = document.getElementById("guessBtn2");

  const boardCount = 8; // adjust dynamically later if you change boardCount in your game
  const keyStates = {}; // keyStates[key][boardIndex] = 'g'|'y'|'b'|null

  function createKeyboard() {
    keyboardLayout.forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("keyboard-row");

      row.forEach(key => {
        const btn = document.createElement("button");
        btn.classList.add("key");
        btn.textContent = key;
        btn.dataset.key = key;
        // create slices container
        if (key.length === 1 && /[a-z]/.test(key)) {
          const slices = document.createElement("div");
          slices.classList.add("key-slices");
          for (let i = 0; i < boardCount; i++) {
            const slice = document.createElement("div");
            slice.classList.add("slice");
            slice.style.background = "#fff";
            slices.appendChild(slice);
          }
          btn.appendChild(slices);
        }
        btn.onclick = onKeyClick;
        rowDiv.appendChild(btn);
      });

      keyboardContainer.appendChild(rowDiv);
    });
  }

  function onKeyClick(e) {
    const key = e.target.dataset.key;

    if (key === "Enter") {
      guessBtn.click();      // only trigger one button
      guessInput.value = "";
      guessInput2.value = "";
    }
    else if (key === "Back") {
      // delete from both inputs at the same time
      guessInput.value = guessInput.value.slice(0, -1);
      guessInput2.value = guessInput2.value.slice(0, -1);
    }
    else if (key.length === 1) {
      // append letter to both inputs simultaneously
      if (guessInput.value.length < 5) {
        guessInput.value += key.toLowerCase();
      }
      if (guessInput2.value.length < 5) {
        guessInput2.value += key.toLowerCase();
      }
    }
  }


  // called when new feedback arrives
  window.updateKeyboardColors = function (guess, feedback, boardIndex) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const fb = feedback[i];
      const btn = document.querySelector(`.key[data-key="${letter}"]`);
      if (!btn) continue;

      // store and update color per board
      if (!keyStates[letter]) keyStates[letter] = Array(boardCount).fill(null);
      keyStates[letter][boardIndex] = fb;

      // update slice visuals
      const slices = btn.querySelectorAll(".slice");
      slices.forEach((s, idx) => {
        const state = keyStates[letter][idx];
        let color = "#fff";
        if (state === "g") color = "var(--green)";
        else if (state === "y") color = "var(--yellow)";
        else if (state === "b") color = "var(--gray)";
        s.style.background = color;
      });
    }
  };

  createKeyboard();
})();