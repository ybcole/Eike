// ========================================================================
// 🧠 REASONING
// ========================================================================

let rnDataset = null;

document.getElementById('rn-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  loadReasoningData();
});

async function loadReasoningData() {
  if (!rnDataset) {
    try {
      const res = await fetch('./reasoning-parquet/train.json');
      if (!res.ok) throw new Error('Could not load data');
      rnDataset = await res.json();
    } catch (err) {
      alert('Could not load train.json from reasoning-parquet folder.');
      return;
    }
  }

  const rounds   = parseInt(document.getElementById('rn-rounds-input').value) || 8;
  const shuffled = [...rnDataset].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(rounds, shuffled.length));

  launchReasoning(selected);
}

function launchReasoning(questionsList) {
  const overlay    = document.getElementById('rn-overlay');
  const bodyEl     = document.getElementById('rn-body');
  const phaseLabel = document.getElementById('rn-phase-label');
  const progressEl = document.getElementById('rn-progress');

  const Q_TIME = parseInt(document.getElementById('rn-timer-input').value) || 30;
  const total  = questionsList.length;

  let currentQI      = 0;
  let score          = 0;
  let activeInterval = null;
  const testLogs     = [];

  overlay.classList.add('active');
  phaseLabel.textContent = 'QUESTION';

  function clearActive() {
    if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
  }

  function showQuestion(qi) {
    clearActive();
    progressEl.textContent = `${qi + 1} / ${total}`;

    const item = questionsList[qi];
    let time   = Q_TIME;

    bodyEl.innerHTML = `
      <div style="max-width:760px; margin:0 auto; padding:2vh 0; display:flex; flex-direction:column; gap:3vh;">

        <div id="rn-timer"
          style="font-family:'Archivo Black',sans-serif; font-size:1rem;
                 color:#aaaaaa; text-align:center; letter-spacing:0.1em;">
          ${time}s
        </div>

        <div style="font-family:Georgia,'Times New Roman',serif; font-size:1rem;
                    line-height:1.75; color:#333333;">
          ${item.context}
        </div>

        <div style="font-family:'Archivo Black',sans-serif; font-size:1.3vw;
                    color:#000000; line-height:1.4;">
          ${item.query}
        </div>

        <div style="display:flex; flex-direction:column; gap:1vh;">
          ${item.options.map((opt, oi) => `
            <button class="rn-opt-btn"
              data-oi="${oi}"
              style="
                background:transparent; border:none; padding:1.2vh 0;
                font-family:'Archivo Black',sans-serif; font-size:1.1vw;
                color:#000000; text-align:left; cursor:pointer;
                letter-spacing:0.02em; transition:opacity 0.15s ease;
                display:flex; gap:1.5vw; align-items:flex-start;
              "
              onmouseover="this.style.opacity='0.5';"
              onmouseout="this.style.opacity='1';">
              <span style="color:#cccccc; min-width:1.8vw; flex-shrink:0;">
                ${String.fromCharCode(65 + oi)}.
              </span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const timerEl = document.getElementById('rn-timer');

    activeInterval = setInterval(() => {
      time--;
      if (timerEl) timerEl.textContent = time + 's';
      if (time <= 0) {
        clearActive();
        showReview(qi, null, item);
      }
    }, 1000);

    bodyEl.querySelectorAll('.rn-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clearActive();
        showReview(qi, parseInt(btn.dataset.oi), item);
      });
    });
  }

  function showReview(qi, selected, item) {
    clearActive();

    const isCorrect = selected === item.correct_option;
    if (isCorrect) score++;
    testLogs.push({ ...item, selected });

    const isLast = (qi + 1 >= total);

    bodyEl.innerHTML = `
      <div style="max-width:760px; margin:0 auto; padding:2vh 0; display:flex; flex-direction:column; gap:3vh;">

        <div style="font-family:'Archivo Black',sans-serif; font-size:1.3vw;
                    color:#000000; line-height:1.4; margin-bottom:0.5vh;">
          ${item.query}
        </div>

        <div style="display:flex; flex-direction:column; gap:1vh;">
          ${item.options.map((opt, oi) => {
            const isCorrectOpt  = oi === item.correct_option;
            const isSelectedOpt = oi === selected;
            const isTimeout     = selected === null && isCorrectOpt;

            let labelColor = '#cccccc';
            let textColor  = '#cccccc';
            let annotation = '';

            if (isCorrectOpt) {
              labelColor = '#000000';
              textColor  = '#000000';
              annotation = `<span style="font-family:'Archivo Black',sans-serif; font-size:0.75vw;
                              color:#000000; letter-spacing:0.12em; margin-left:1vw;">CORRECT</span>`;
            }

            if (isSelectedOpt && !isCorrectOpt) {
              labelColor = '#aaaaaa';
              textColor  = '#aaaaaa';
              annotation = `<span style="font-family:'Archivo Black',sans-serif; font-size:0.75vw;
                              color:#aaaaaa; letter-spacing:0.12em; margin-left:1vw;">YOUR ANSWER</span>`;
            }

            return `
              <div style="padding:1.2vh 0; display:flex; gap:1.5vw; align-items:flex-start;">
                <span style="color:${labelColor}; font-family:'Archivo Black',sans-serif;
                             font-size:1.1vw; min-width:1.8vw; flex-shrink:0;">
                  ${String.fromCharCode(65 + oi)}.
                </span>
                <span style="font-family:'Archivo Black',sans-serif; font-size:1.1vw;
                             color:${textColor}; display:flex; align-items:center; flex-wrap:wrap; gap:0.5vw;">
                  ${opt}${annotation}
                </span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="font-family:'Archivo Black',sans-serif; font-size:0.85vw;
                    color:#aaaaaa; letter-spacing:0.12em;">
          ${selected === null ? 'TIMEOUT' : isCorrect ? 'CORRECT' : 'INCORRECT'}
          &nbsp;·&nbsp; SCORE: ${score} / ${qi + 1}
        </div>

        <button id="rn-next-btn"
          style="
            background:transparent; border:2px solid #000000; color:#000000;
            font-family:'Archivo Black',sans-serif; font-size:1.2vw;
            padding:0.6vh 2.5vw; cursor:pointer; letter-spacing:0.08em;
            align-self:flex-start; transition:background 0.15s ease, color 0.15s ease;
          "
          onmouseover="this.style.background='#000';this.style.color='#fff';"
          onmouseout="this.style.background='transparent';this.style.color='#000';">
          ${isLast ? 'SEE RESULTS →' : 'NEXT →'}
        </button>

      </div>
    `;

    document.getElementById('rn-next-btn').addEventListener('click', () => {
      if (isLast) {
        showResults(score, total, testLogs);
      } else {
        showQuestion(qi + 1);
      }
    });
  }

  function showResults(score, total, logs) {
    phaseLabel.textContent = 'RESULTS';
    progressEl.textContent = '';

    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    bodyEl.innerHTML = `
      <div style="max-width:760px; margin:0 auto; padding:2vh 0; display:flex; flex-direction:column; gap:3vh;">

        <div style="padding-bottom:2vh;">
          <span style="font-family:'Archivo Black',sans-serif; font-size:5vw; color:#000000;">
            ${score} / ${total}
          </span>
          <span style="font-family:'Archivo Black',sans-serif; font-size:2vw; color:#aaaaaa; margin-left:1vw;">
            ${pct}%
          </span>
        </div>

        <div style="display:flex; flex-direction:column; gap:2.5vh; overflow-y:auto; max-height:55vh; padding-right:0.5vw;">
          ${logs.map((l, i) => {
            const isCorrect = l.selected === l.correct_option;
            return `
              <div style="padding-bottom:2vh;">
                <div style="font-family:'Archivo Black',sans-serif; font-size:0.9vw;
                            color:#000000; margin-bottom:0.6vh; line-height:1.4;">
                  <span style="color:#cccccc; margin-right:0.5vw;">${i + 1}.</span>${l.query}
                </div>
                <div style="font-family:'Archivo Black',sans-serif; font-size:0.8vw;
                            color:#aaaaaa; letter-spacing:0.08em;">
                  ${isCorrect ? 'CORRECT' : l.selected === null ? 'TIMEOUT' : 'INCORRECT'}
                  &nbsp;·&nbsp;
                  ${l.selected !== null ? l.options[l.selected] : '—'}
                  ${!isCorrect ? `&nbsp;·&nbsp; Correct: ${l.options[l.correct_option]}` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  showQuestion(0);

  document.getElementById('rn-close').onclick = () => {
    clearActive();
    overlay.classList.remove('active');
  };
}