(() => {
  /*
  Fix color on board, not constistent - DONE
  Fix key not removing white color if not on a key. - DONE

  Keyboard color, could be changed. - DONE
  Try making a grid of color instead of rows. - DONE

  Certain boards stop updating - DONE

  Put word entry at the bottom and the top of the screen just the clickable at the top.
  Center it - DONE

  Tick box to hide the opponent Boxes - DONE

  Add a line break every row - DONE

  Add a guess count - DONE

  Increase keyboard size - DONE

  Fix msg spots - Not done

  Add brief popup to show word not in list like 1 seconds and focus that. - MAYBE

  --
  NEW BUGS
  --

  Refresh the page if the opponent disconnects - DONE
  Dont allow a guess to be re-used(Prevents bug) - DONE

  Check to see if server connection has been interrupted and then refesh as well - DONE

  NEW NEW BUGS
  --

  Guess count can keep going - DONE
  Top keyboard bug - DONE - MAYBE DONE
  Limit messages to 3 - Done

  ---------------------------------------------------------------------------------------
  Amount of Kila fixes = 16
  Amount of fixes = 2
  ---------------------------------------------------------------------------------------
  Floating keyboard
  react.js - Look into


*/
  //<select id="boardSelect"></select>
  const statusEl = document.getElementById('status');
  const joinBtn = document.getElementById('joinBtn');
  const roomInput = document.getElementById('roomInput');
  const gameArea = document.getElementById('gameArea');
  const yourBoardsEl = document.getElementById('yourBoards');
  const oppBoardsEl = document.getElementById('oppBoards');
  const guessInput = document.getElementById('guessInput');
  const guessInput3 = document.getElementById("guessInput3");
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

  //  Send msg to the top and the bottom of the screen for user to see.
  function addMsg(m) {
    const p1 = document.createElement('div');
    p1.innerText = m;
    p1.style.color = 'var(--muted)'; // force color
    messages.appendChild(p1);

    // Limit the number of messages seen in each area
    while (messages.children.length > 3) {
      messages.removeChild(messages.firstChild);
    }
    messages.scrollTop = messages.scrollHeight;

    const p2 = document.createElement('div');
    p2.innerText = m;
    p2.style.color = 'var(--muted)'; //For some reason I have to force this color despite css being this color already.
    messages2.appendChild(p2);

    // Limit number of messages again
    while (messages2.children.length > 3) {
      messages2.removeChild(messages2.firstChild);
    }
    messages2.scrollTop = messages2.scrollHeight;
  }

  //  Creates boards for the game
  function makeBoards(n) {
    yourBoardsEl.innerHTML = '';
    oppBoardsEl.innerHTML = '';

    yourState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };
    oppState = { attemptsPerBoard: Array.from({ length: n }, () => []), solved: Array.from({ length: n }, () => false), solvedCount: 0 };

    const tileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) || 36;
    const spacerHeight = tileSize / 2;

    for (let b = 0; b < n; b += 2) {
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

  //  Update score count for you and your opponent
  function updateScores() {
    youScore.innerText = `${yourState.solvedCount}/${boardCount}`;
    opScore.innerText = `${oppState.solvedCount}/${boardCount}`;
  }

  //  Update the guess count for you and your opponent
  function updateGuesses() {
    const youDisplay = Math.min(youCurrentGuess, maxGuesses);
    const opDisplay = Math.min(opCurrentGuess, maxGuesses);

    youGuess.innerText = `${youDisplay}/${maxGuesses}`;
    opGuess.innerText = `${opDisplay}/${maxGuesses}`;
    if(youGuess.innerText == `${maxGuesses}/${maxGuesses}`){
      addMsg("Out of Guesses");
    }
  }

  //  Applies feedback from the guess in grey yellow green format
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

  //  Connects to the room made by the server
  function connect(room) {
    const loc = window.location;
    const wsUrl = `ws://${loc.hostname}:8080/?room=${encodeURIComponent(room)}`;
    ws = new WebSocket(wsUrl);
    setStatus('Connecting...');
    ws.onopen = () => setStatus('Connected');
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        //  Join state
        if (data.type === 'joined') {
          playerId = data.playerId; boardCount = data.boardCount || boardCount; maxGuesses = data.maxGuesses || maxGuesses;
          makeBoards(boardCount);
          setStatus(`Joined as ${playerId}. Waiting for opponent...`);
        } else if (data.type === 'wait') { setStatus(data.message); }
        // Start state
        else if (data.type === 'start') {
          setStatus(data.message);
          gameArea.classList.remove('hidden');
          document.getElementById('inputArea').classList.remove('hidden');
          document.getElementById('keyboard').classList.remove('hidden');
          document.getElementById('playArea').classList.remove('hidden');
          addMsg('Game started!');
        }
        else if (data.type === 'invalid') {
          addMsg(data.message);
        }
        // Update state
        else if (data.type === 'update') {
          const { guess, feedbacks, fromYou } = data;
          const boardState = fromYou ? yourState : oppState;

          feedbacks.forEach((fb, boardIndex) => {
            if (!fb) return;

            const attempts = boardState.attemptsPerBoard[boardIndex].length;

            boardState.attemptsPerBoard[boardIndex].push({ guess, feedback: fb });
            applyFeedback(boardIndex, attempts, guess, fb, fromYou);

            if (!boardState.solved[boardIndex] && fb.every(c => c === 'g')) {
              boardState.solved[boardIndex] = true;
            }
          });

          if (fromYou) { yourState.solvedCount = data.solvedCount; }
          else { oppState.solvedCount = data.solvedCount; }

          updateScores();

          if (fromYou) { youCurrentGuess += 1; }
          else { opCurrentGuess += 1; }

          updateGuesses();
        }

        else if (data.type === 'finish') { addMsg(data.message); }
        else if (data.type === 'opponentLeft') {
          setStatus('Opponent disconnected');
          addMsg('Opponent left — refreshing...');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (e) { console.error(e); }
    };

    //  Connection cleanup
    ws.onclose = (event) => {
      console.log("Connection closed:", event);
      setStatus("Disconnected from server");
      addMsg("Lost connection to server — refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    };
    //  Error cleanup
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Connection error");
      addMsg("WebSocket encountered an error.");
      setTimeout(() => window.location.reload(), 1500);
    };
  }

  // Button I/O


  joinBtn.onclick = () => { const r = roomInput.value.trim() || 'default'; connect(r); };
  guessBtn.onclick = sendGuess;
  guessBtn2.onclick = sendGuess;
  showOp.addEventListener('change', function () {

    if (this.checked) {
      showsOp();
    } else {
      hidesOp();
    }
  });

  const guessInputs = [guessInput, guessInput3];


  guessInputs.forEach(input => {
    input.addEventListener('input', () => {
      const value = input.value.slice(0, 5);
      guessInputs.forEach(i => {
        if (i !== input) i.value = value;
      });
    });


    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendGuess();
    });
  });

  function sendGuess() {
    if (youCurrentGuess >= maxGuesses) return;
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess || guess.length !== 5) {
      addMsg('Guess must be 5 letters');
      return;
    }
    ws.send(JSON.stringify({ type: 'guess', guess }));
    guessInputs.forEach(i => i.value = '');
  }

  //  Functionality for the show/hide opponent
  function showsOp() {
    opCol.style.display = 'block';
    youCol.style.margin = '';
    gameArea.classList.remove('centered');
  }

  function hidesOp() {
    opCol.style.display = 'none';
    youCol.style.margin = '0 auto';
    gameArea.classList.add('centered');
  }

  const urlParams = new URLSearchParams(window.location.search);
  const r = urlParams.get('room');
  if (r) roomInput.value = r;

})();

(() => {
  //  keyboard at the bottom
  const keyboardLayout = [
    "q w e r t y u i o p".split(" "),
    "a s d f g h j k l".split(" "),
    ["Back", ..."zxcvbnm".split(""), "Enter"]
  ];

  const keyboardContainer = document.getElementById("keyboard");
  const guessInput = document.getElementById("guessInput");
  const guessInput3 = document.getElementById("guessInput3");
  const guessBtn = document.getElementById("guessBtn");
  const guessBtn2 = document.getElementById("guessBtn2");

  const boardCount = 8;
  const keyStates = {};
  //  Create the keyboard
  function createKeyboard() {
    keyboardLayout.forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("keyboard-row");

      row.forEach(key => {
        const btn = document.createElement("button");
        btn.classList.add("key");
        btn.textContent = key;
        btn.dataset.key = key;

        // Only add slices for letter keys
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
  // Event handling
  function onKeyClick(e) {
    const key = e.target.dataset.key;

    if (key === "Enter") {
      guessBtn.click();
      guessInput.value = "";
      guessInput3.value = "";
    }
    else if (key === "Back") {
      guessInput.value = guessInput.value.slice(0, -1);
      guessInput3.value = guessInput3.value.slice(0, -1);
    }
    else if (key.length === 1) {

      if (guessInput.value.length < 5) {
        guessInput.value += key.toLowerCase();
      }
      if (guessInput3.value.length < 5) {
        guessInput3.value += key.toLowerCase();
      }
    }
  }


  //  Update the keys on guess
  window.updateKeyboardColors = function (guess, feedback, boardIndex) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const fb = feedback[i];
      const btn = document.querySelector(`.key[data-key="${letter}"]`);
      if (!btn) continue;


      if (!keyStates[letter]) keyStates[letter] = Array(boardCount).fill(null);
      keyStates[letter][boardIndex] = fb;


      const slices = btn.querySelectorAll(".slice");
      slices.forEach((s, idx) => {
        const state = keyStates[letter][idx];
        let color = "#fff";
        if (state === "g") color = "var(--green)";
        else if (state === "y") color = "var(--yellow)";
        else if (state === "b") color = "var(--gray)";
        else if (state === null) color = "var(--green)";
        s.style.background = color;
      });
    }
  };

  createKeyboard();
})();