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

  let ws, playerId, boardCount=8, maxGuesses=13;
  let yourState, oppState;

  function setStatus(s){ statusEl.innerText=s; }
  function addMsg(m){ 
    const p=document.createElement('div'); 
    p.innerText=m; 
    messages.appendChild(p); 
    messages.scrollTop=messages.scrollHeight;
  }

  function makeBoards(n){
    yourBoardsEl.innerHTML='';
    oppBoardsEl.innerHTML='';
    yourState={attemptsPerBoard:Array.from({length:n},()=>[]),solved:Array.from({length:n},()=>false),solvedCount:0};
    oppState={attemptsPerBoard:Array.from({length:n},()=>[]),solved:Array.from({length:n},()=>false),solvedCount:0};

    for(let b=0;b<n;b++){
      // Your board
      const bd=document.createElement('div'); bd.className='board'; bd.id=`your-board-${b}`;
      for(let r=0;r<maxGuesses;r++){
        const row=document.createElement('div'); row.className='row';
        for(let c=0;c<5;c++){ const t=document.createElement('div'); t.className='tile'; t.innerText=''; row.appendChild(t);}
        bd.appendChild(row);
      }
      yourBoardsEl.appendChild(bd);

      // Opponent board
      const obd=document.createElement('div'); obd.className='board'; obd.id=`opp-board-${b}`;
      for(let r=0;r<maxGuesses;r++){
        const row=document.createElement('div'); row.className='row';
        for(let c=0;c<5;c++){ const t=document.createElement('div'); t.className='tile'; t.innerText=''; row.appendChild(t);}
        obd.appendChild(row);
      }
      oppBoardsEl.appendChild(obd);
    }
  }

  function updateScores(){ 
    youScore.innerText=`${yourState.solvedCount}/${boardCount}`; 
    opScore.innerText=`${oppState.solvedCount}/${boardCount}`;
  }

  function applyFeedback(board, attemptIndex, guess, feedback, fromYou){
    const bd = document.getElementById(fromYou?`your-board-${board}`:`opp-board-${board}`);
    if(!bd) return;
    if(attemptIndex>=bd.children.length) return;
    const row = bd.children[attemptIndex];
    for(let i=0;i<5;i++){
      const tile=row.children[i];
      tile.classList.remove('g','y','b','op-hidden','op-solved');
      if(fromYou){
        tile.classList.add(feedback[i]);
        tile.innerText=guess[i].toUpperCase();
      } else {
        tile.classList.add(feedback[i]); // colors only
        tile.innerText='';
      }
    }
  }

  function connect(room){
    const loc = window.location;
    const wsUrl = `ws://${loc.hostname}:8080/?room=${encodeURIComponent(room)}`;
    ws = new WebSocket(wsUrl);
    setStatus('Connecting...');
    ws.onopen=()=>setStatus('Connected');
    ws.onmessage=(ev)=>{
      try{
        const data=JSON.parse(ev.data);
        if(data.type==='joined'){
          playerId=data.playerId; boardCount=data.boardCount||boardCount; maxGuesses=data.maxGuesses||maxGuesses;
          makeBoards(boardCount);
          setStatus(`Joined as ${playerId}. Waiting for opponent...`);
        } else if(data.type==='wait'){ setStatus(data.message); }
        else if(data.type==='start'){ 
          setStatus(data.message); 
          gameArea.classList.remove('hidden'); 
          document.getElementById('inputArea').classList.remove('hidden'); 
          addMsg('Game started!');
        }
        else if(data.type==='invalid'){
          addMsg(data.message);
        }
        else if(data.type==='update'){
          const {guess, feedbacks, fromYou} = data;
          feedbacks.forEach((fb, b) => {
            if (!fb) return; // this line can actually be removed now
                    
            const boardState = fromYou ? yourState : oppState;
            const attempts = boardState.attemptsPerBoard[b].length;
                    
            // Always apply this guess's feedback
            boardState.attemptsPerBoard[b].push({ guess, feedback: fb });
            applyFeedback(b, attempts, guess, fb, fromYou);
                    
            // Mark solved AFTER applying feedback
            if (fb.every(c => c === 'g')) boardState.solved[b] = true;
          });



          if(fromYou){ yourState.solvedCount=data.solvedCount; } else { oppState.solvedCount=data.solvedCount; }
          updateScores();
          if(fromYou) addMsg(`${data.guesser} guessed "${guess.toUpperCase()}"`);
        }
        else if(data.type==='finish'){ addMsg(data.message);}
        else if(data.type==='opponentLeft'){ setStatus('Opponent disconnected'); addMsg('Opponent left');}
      } catch(e){console.error(e);}
    };
  }

  joinBtn.onclick=()=>{ const r=roomInput.value.trim()||'default'; connect(r); };

  guessBtn.onclick=sendGuess;
  guessInput.addEventListener('keydown',e=>{if(e.key==='Enter') sendGuess();});

  function sendGuess(){
    const guess=(guessInput.value||'').trim().toLowerCase();
    if(!guess || guess.length!==5){ addMsg('Guess must be 5 letters'); return;}
    ws.send(JSON.stringify({type:'guess',guess}));
    guessInput.value='';
  }

  // Auto-connect if room in URL
  const urlParams = new URLSearchParams(window.location.search); 
  const r = urlParams.get('room'); 
  if(r) roomInput.value=r;

})();
