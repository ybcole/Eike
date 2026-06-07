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
  const progressEl = document.getElementById('fa-progress');

  const opsRaw    = document.getElementById('fa-ops-input').value;
  const digitsRaw = document.getElementById('fa-digits-input').value;
  const flashes   = parseInt(document.getElementById('fa-flashes-input').value) || 3;
  const speed     = parseFloat(document.getElementById('fa-speed-input').value) || 1.0;
  const FLASH_MS  = Math.round(speed * 1000);

  let availableOps = opsRaw.split(',').map(s => s.trim()).filter(s => ['+', '-', '*', '/', '×', '÷'].includes(s));
  if (availableOps.length === 0) availableOps = ['+'];
  availableOps = availableOps.map(op => {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
  });

  let availableDigits = digitsRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
  if (availableDigits.length === 0) availableDigits = [2];

  overlay.classList.add('active');
  phaseLabel.textContent = 'WATCH';

  let activeTimeout = null;
  let roundIndex    = 0;
  let score         = 0;

  function clearActive() {
    if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getNumFromDigits(digitsArr) {
    const d   = digitsArr[Math.floor(Math.random() * digitsArr.length)];
    const min = d === 1 ? 1 : Math.pow(10, d - 1);
    const max = Math.pow(10, d) - 1;
    return randInt(min, max);
  }

  function generateSequence(opsArr, digitsArr) {
    let sequence     = [];
    let currentTotal = 0;

    let firstNum = getNumFromDigits(digitsArr);
    sequence.push(firstNum);
    currentTotal = firstNum;

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
        let factors = [];
        for (let f = 1; f <= Math.abs(currentTotal); f++) {
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
    progressEl.textContent = `ROUND ${ri + 1}`;
    phaseLabel.textContent = 'WATCH';

    const { sequence, correctAnswer } = generateSequence(availableOps, availableDigits);

    body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:300px;">
        <div id="fa-flash-display"
          style="font-family:'Archivo Black',sans-serif; font-size:10vw; color:#000000;
                 min-width:4ch; text-align:center; letter-spacing:0.02em;">
          &nbsp;
        </div>
      </div>
    `;

    const flashEl = document.getElementById('fa-flash-display');
    let fi = 0;

    function flashNext() {
      if (fi >= sequence.length) {
        flashEl.textContent = '?';
        flashEl.style.color = '#cccccc';
        showAnswerInput(correctAnswer);
        return;
      }
      flashEl.style.color = '#000000';
      flashEl.textContent = sequence[fi];
      fi++;
      activeTimeout = setTimeout(flashNext, FLASH_MS);
    }

    activeTimeout = setTimeout(flashNext, 400);
  }

  function showAnswerInput(correctAnswer) {
    phaseLabel.textContent = 'ANSWER';

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;
                  height:100%; min-height:300px; gap:2.5vh;">
        <input id="fa-answer-input" type="number" autocomplete="off"
          style="
            background:transparent; border:none; border-bottom:3px solid #000000;
            font-family:'Archivo Black',sans-serif; font-size:8vw; color:#000000;
            width:8ch; text-align:center; outline:none;
            -moz-appearance:textfield; appearance:textfield;
          "
          placeholder="?" />
        <div id="fa-btn-row" style="display:flex; gap:1.5vw; margin-top:1vh;">
          <button id="fa-submit-btn" class="action-btn">SUBMIT →</button>
        </div>
        <div id="fa-feedback" style="font-family:'Archivo Black',sans-serif; font-size:1vw;
                                     color:#aaaaaa; letter-spacing:0.12em; min-height:1.5em;"></div>
      </div>
    `;

    const input      = document.getElementById('fa-answer-input');
    const btnRow     = document.getElementById('fa-btn-row');
    const feedbackEl = document.getElementById('fa-feedback');

    input.focus();

    function submitAnswer() {
      const val = input.value.trim();
      if (val === '') return;

      const userVal   = parseFloat(val);
      input.disabled  = true;

      if (userVal === correctAnswer) {
        score++;
        feedbackEl.textContent = 'CORRECT';
        feedbackEl.style.color = '#000000';
      } else {
        feedbackEl.textContent = `WRONG — Answer: ${correctAnswer}`;
        feedbackEl.style.color = '#aaaaaa';
      }

      btnRow.innerHTML = `
        <button id="fa-retry-btn" class="action-btn filled">NEXT ROUND →</button>
      `;

      document.getElementById('fa-retry-btn').addEventListener('click', () => {
        runRound(roundIndex + 1);
      });
    }

    document.getElementById('fa-submit-btn').addEventListener('click', submitAnswer);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!input.disabled) {
          submitAnswer();
        } else {
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