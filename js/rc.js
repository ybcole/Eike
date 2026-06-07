// ========================================================================
// 📖 READING COMPREHENSION
// ========================================================================

let rcDifficulty = 'middle';

let datasetCache = {
  middle: null,
  high: null
};

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    rcDifficulty = btn.dataset.diff;
  });
});

document.getElementById('rc-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  loadRaceFile();
});

async function loadRaceFile() {
  const fileName = `race_${rcDifficulty}.json`;

  if (!datasetCache[rcDifficulty]) {
    try {
      const res = await fetch(`./${fileName}`);
      if (!res.ok) throw new Error('File not found');
      datasetCache[rcDifficulty] = await res.json();
    } catch (err) {
      alert(`Could not find ${fileName}.\n\nMake sure you ran the data extraction step and are using Live Server.`);
      return;
    }
  }

  const articlesArray = datasetCache[rcDifficulty];
  const randomIndex   = Math.floor(Math.random() * articlesArray.length);
  launchRC(articlesArray[randomIndex]);
}

function launchRC(data) {
  const overlay      = document.getElementById('rc-overlay');
  const articleEl    = document.getElementById('rc-article');
  const phaseLabel   = document.getElementById('rc-phase-label');
  const progressEl   = document.getElementById('rc-progress');

  const readingPhase  = document.getElementById('rc-reading-phase');
  const questionPhase = document.getElementById('rc-question-phase');
  const resultsPhase  = document.getElementById('rc-results-phase');

  const readingTimerText = document.getElementById('rc-reading-timer-text');
  const qArea            = document.getElementById('rc-q-area');
  const finalScore       = document.getElementById('rc-final-score');
  const answersReview    = document.getElementById('rc-answers-review');

  const questions = data.questions;
  const options   = data.options;
  const answers   = data.answers;
  const readSecs  = parseInt(document.getElementById('rc-timer-input').value) || 60;
  const Q_TIME    = 10;

  articleEl.textContent   = data.article.replace(/\s+/g, ' ').trim();
  answersReview.innerHTML = '';
  finalScore.innerHTML    = '';

  readingPhase.style.display  = 'flex';
  questionPhase.style.display = 'none';
  resultsPhase.style.display  = 'none';

  overlay.classList.add('active');

  let activeInterval = null;

  function clearActive() {
    if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
  }

  // ── Phase 1: Reading ──────────────────────────────────────────────────────

  let readRemaining = readSecs;
  readingTimerText.textContent = formatTime(readRemaining);
  phaseLabel.textContent = 'READ';

  activeInterval = setInterval(() => {
    readRemaining--;
    readingTimerText.textContent = formatTime(readRemaining);
    if (readRemaining <= 0) {
      clearActive();
      startQuestions();
    }
  }, 1000);

  // ── Phase 2: Questions ────────────────────────────────────────────────────

  const userAnswers = new Array(questions.length).fill(null);

  function startQuestions() {
    readingPhase.style.display  = 'none';
    questionPhase.style.display = 'flex';
    phaseLabel.textContent      = 'ANSWER';
    showQuestion(0);
  }

  function showQuestion(qi) {
    progressEl.textContent = `${qi + 1} / ${questions.length}`;

    const labels = ['A', 'B', 'C', 'D'];

    qArea.innerHTML = `
      <div class="rc-timer-text" id="rc-q-timer-text">${formatTime(Q_TIME)}</div>
      <div class="rc-q-text">
        <span class="rc-q-num">${qi + 1}.</span>${questions[qi]}
      </div>
      <div class="rc-opts">
        ${options[qi].map((opt, oi) => `
          <button class="rc-opt-btn" data-qi="${qi}" data-oi="${oi}">
            <span class="rc-opt-label">${labels[oi]}.</span>
            <span class="rc-opt-text">${opt}</span>
          </button>
        `).join('')}
      </div>
    `;

    qArea.querySelectorAll('.rc-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        userAnswers[qi] = parseInt(btn.dataset.oi);
        clearActive();
        advanceQuestion(qi);
      });
    });

    const qTimerText = document.getElementById('rc-q-timer-text');
    let qRemaining = Q_TIME;

    activeInterval = setInterval(() => {
      qRemaining--;
      if (qTimerText) qTimerText.textContent = formatTime(qRemaining);
      if (qRemaining <= 0) {
        clearActive();
        advanceQuestion(qi);
      }
    }, 1000);
  }

  function advanceQuestion(qi) {
    if (qi + 1 < questions.length) {
      showQuestion(qi + 1);
    } else {
      showResults();
    }
  }

  // ── Phase 3: Results ──────────────────────────────────────────────────────

  function showResults() {
    questionPhase.style.display  = 'none';
    resultsPhase.style.display   = 'flex';
    resultsPhase.style.flexDirection = 'column';
    phaseLabel.textContent  = 'RESULTS';
    progressEl.textContent  = '';

    const labels = ['A', 'B', 'C', 'D'];
    let correct  = 0;

    questions.forEach((q, qi) => {
      const correctIdx = labels.indexOf(answers[qi]);
      const userIdx    = userAnswers[qi];
      if (userIdx === correctIdx) correct++;

      const block     = document.createElement('div');
      block.className = 'rc-review-block';

      const isCorrect     = userIdx === correctIdx;
      const chosenLabel   = userIdx !== null ? labels[userIdx] : '—';
      const correctOptTxt = options[qi] && options[qi][correctIdx] ? options[qi][correctIdx] : '';

      block.innerHTML = `
        <div class="review-q"><span class="rc-q-num">${qi + 1}.</span> ${q}</div>
        <div class="review-row">
          <span class="review-verdict">${isCorrect ? 'CORRECT' : 'INCORRECT'} — You chose ${chosenLabel}</span>
          <span class="review-answer-correct">Answer: ${answers[qi]} — ${correctOptTxt}</span>
        </div>
      `;
      answersReview.appendChild(block);
    });

    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    finalScore.innerHTML = `
      <span class="rc-score">${correct} / ${questions.length}</span>
      <span class="rc-score-pct">${pct}%</span>
    `;
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  document.getElementById('rc-close').onclick = () => {
    clearActive();
    overlay.classList.remove('active');
  };
}