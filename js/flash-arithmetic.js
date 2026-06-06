// ========================================================================
// ⚡ FLASH ARITHMETIC
// ========================================================================

document.getElementById('fa-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  launchFA();
});

function launchFA() {
  const overlay    = document.getElementById('fa-overlay');
  const body       = document.getElementById('fa-body');
  const phaseLabel = document.getElementById('fa-phase-label');
  const progress   = document.getElementById('fa-progress');

  const opsRaw    = document.getElementById('fa-ops-input').value;
  const digitsRaw = document.getElementById('fa-digits-input').value;
  const flashes   = parseInt(document.getElementById('fa-flashes-input').value) || 3;
  const speed     = parseFloat(document.getElementById('fa-speed-input').value) || 1.0;

  const FLASH_MS = Math.round(speed * 1000);

  // Parse comma-separated operators and normalize symbols
  let availableOps = opsRaw.split(',').map(s => s.trim()).filter(s => ['+', '-', '*', '/', '×', '÷'].includes(s));
  if (availableOps.length === 0) availableOps = ['+']; 
  
  availableOps = availableOps.map(op => {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
  });

  // Parse comma-separated digits
  let availableDigits = digitsRaw.split(',')
                                 .map(s => parseInt(s.trim()))
                                 .filter(n => !isNaN(n) && n > 0);
  if (availableDigits.length === 0) availableDigits = [2];

  overlay.classList.add('active');

  let activeTimeout = null;
  let roundIndex    = 0;
  let score         = 0;

  function clearActive() {
    if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generates a random number with an EXACT number of digits chosen from the array
  function getNumFromDigits(digitsArr) {
    const d = digitsArr[Math.floor(Math.random() * digitsArr.length)];
    const min = d === 1 ? 1 : Math.pow(10, d - 1);
    const max = Math.pow(10, d) - 1;
    return randInt(min, max);
  }

  // Generates a mixed sequence of Numbers and Operators
  function generateSequence(opsArr, digitsArr) {
    let sequence = [];
    let currentTotal = 0;

    // Start with the first number
    let firstNum = getNumFromDigits(digitsArr);
    sequence.push(firstNum);
    currentTotal = firstNum;

    // Generate subsequent operators and numbers
    for (let i = 1; i < flashes; i++) {
      let op = opsArr[Math.floor(Math.random() * opsArr.length)];
      sequence.push(op);

      let nextNum;
      if (op === '+') {
        nextNum = getNumFromDigits(digitsArr);
        currentTotal += nextNum;
      } else if (op === '-') {
        nextNum = getNumFromDigits(digitsArr);
        currentTotal -= nextNum;
      } else if (op === '×') {
        nextNum = getNumFromDigits(digitsArr);
        currentTotal *= nextNum;
      } else if (op === '÷') {
        // Ensure clean division
        let factors = [];
        for(let f = 1; f <= Math.abs(currentTotal); f++) {
          if (currentTotal % f === 0) factors.push(f);
        }
        nextNum = factors.length > 1 ? factors[Math.floor(Math.random() * factors.length)] : 1;
        currentTotal /= nextNum;
      }
      sequence.push(nextNum);
    }
    return { sequence, correctAnswer: currentTotal };
  }

  function runRound(ri) {
    roundIndex = ri;

    const { sequence, correctAnswer } = generateSequence(availableOps, availableDigits);

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:300px; gap:20px;">
        <div id="fa-flash-display" style="font-family:'Archivo Black',sans-serif; font-size:10vw; color:#000; min-width:4ch; text-align:center; letter-spacing:0.02em;">
          &nbsp;
        </div>
      </div>
    `;

    const flashEl = document.getElementById('fa-flash-display');
    let fi = 0;

    function flashNext() {
      if (fi >= sequence.length) {
        flashEl.innerHTML  = '?';
        flashEl.style.color = '#aaa';
        showAnswerInput(correctAnswer);
        return;
      }
      
      flashEl.style.color = '#000';
      flashEl.textContent = sequence[fi]; 
      fi++;
      
      // Removed the 200ms blank space delay. Transitions instantly to the next frame.
      activeTimeout = setTimeout(flashNext, FLASH_MS);
    }

    activeTimeout = setTimeout(flashNext, 400);
  }

  function showAnswerInput(correctAnswer) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:300px; gap:24px;">
        <input id="fa-answer-input" type="number" autocomplete="off"
          style="background:transparent; border:none; border-bottom:3px solid #000; font-family:'Archivo Black',sans-serif;
                 font-size:8vw; color:#000; width:8ch; text-align:center; outline:none; -moz-appearance:textfield; appearance:textfield;"
          placeholder="?" />
        
        <div id="fa-button-container" style="display:flex; gap:16px; margin-top:8px;">
          <button id="fa-submit-btn"
            style="background:transparent; border:2px solid #000; color:#000; font-family:'Archivo Black',sans-serif;
                   font-size:1.4vw; padding:0.6vh 2.5vw; cursor:pointer; letter-spacing:0.08em;"
            onmouseover="this.style.background='#000';this.style.color='#fff';"
            onmouseout="this.style.background='transparent';this.style.color='#000';">
            SUBMIT →
          </button>
        </div>

        <div id="fa-feedback-msg" style="font-family:'Archivo Black',sans-serif; font-size:2vw; height:3vw; margin-top:10px;"></div>
      </div>
    `;

    const input = document.getElementById('fa-answer-input');
    const submitBtn = document.getElementById('fa-submit-btn');
    const btnContainer = document.getElementById('fa-button-container');
    const feedbackMsg = document.getElementById('fa-feedback-msg');
    
    input.focus();

    function submitAnswer() {
      const val = input.value.trim();
      if (val === '') return;
      const userVal = parseFloat(val);
      
      // 1. Disable the input so they can't change it
      input.disabled = true;

      // 2. Show feedback
      if (userVal === correctAnswer) {
        score++;
        input.style.color = 'green';
        input.style.borderBottomColor = 'green';
        feedbackMsg.style.color = 'green';
        feedbackMsg.textContent = 'CORRECT!';
      } else {
        input.style.color = 'red';
        input.style.borderBottomColor = 'red';
        feedbackMsg.style.color = 'red';
        feedbackMsg.textContent = `WRONG! Answer: ${correctAnswer}`;
      }
      
      // 3. Swap the Submit button for just the Next Round button
      btnContainer.innerHTML = `
        <button id="fa-retry-btn"
          style="background:#000; border:2px solid #000; color:#fff; font-family:'Archivo Black',sans-serif;
                 font-size:1.4vw; padding:0.6vh 2.5vw; cursor:pointer; letter-spacing:0.08em;"
          onmouseover="this.style.background='transparent';this.style.color='#000';"
          onmouseout="this.style.background='#000';this.style.color='#fff';">
          NEXT ROUND ↻
        </button>
      `;

      // 4. Add logic to the new button
      document.getElementById('fa-retry-btn').addEventListener('click', () => {
        runRound(roundIndex + 1);
      });
    }

    submitBtn.addEventListener('click', submitAnswer);
    
    input.addEventListener('keydown', (e) => { 
      if (e.key === 'Enter') {
        if (!input.disabled) {
          submitAnswer();
        } else {
          // QoL feature: Hitting Enter a second time automatically triggers "Next Round"
          const retryBtn = document.getElementById('fa-retry-btn');
          if (retryBtn) retryBtn.click();
        }
      } 
    });
  }

  document.getElementById('fa-close').onclick = () => {
    clearActive();
    overlay.classList.remove('active');
  };

  runRound(0);
}