// ========================================================================
// ⚙️ DATASET CACHE & SETTINGS
// ========================================================================
let rcDifficulty = 'middle'; 

// We will store the massive dataset in memory so we only fetch it once
let datasetCache = {
  middle: null,
  high: null
};

// ─── Difficulty toggle ────────────────────────────────────────────────────────
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    rcDifficulty = btn.dataset.diff;
  });
});

// ─── Start button → Load from compiled JSON ───────────────────────────────────
document.getElementById('rc-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  loadRaceFile();
});

async function loadRaceFile() {
  const fileName = `race_${rcDifficulty}.json`;

  // If we haven't loaded the data yet, fetch it from our compiled file
  if (!datasetCache[rcDifficulty]) {
    console.log(`[DEBUG] Fetching entire compiled dataset: ${fileName}...`);
    try {
      // Look for the file in the root directory
      const res = await fetch(`./${fileName}`);
      if (!res.ok) throw new Error("File not found");
      
      datasetCache[rcDifficulty] = await res.json();
      console.log(`[SUCCESS] Loaded ${datasetCache[rcDifficulty].length} articles into memory!`);
    } catch (err) {
      console.error(err);
      alert(`Could not find ${fileName}.\n\nDid you run 'node extract.js' in your terminal to generate the files? Make sure you are using Live Server.`);
      return;
    }
  }

  // Pick a random article from our loaded memory cache
  const articlesArray = datasetCache[rcDifficulty];
  const randomIndex = Math.floor(Math.random() * articlesArray.length);
  const randomArticleData = articlesArray[randomIndex];

  console.log(`[DEBUG] Launching article ID: ${randomArticleData.id}`);
  launchRC(randomArticleData);
}

// ─── RC launcher (three-phase flow) ──────────────────────────────────────────

// ─── RC launcher (Monochrome & Centered Flow) ────────────────────────────────

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
  const Q_TIME    = 10; // seconds per question

  // Clean raw text formatting
  articleEl.textContent  = data.article.replace(/\s+/g, ' ').trim();
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

  function formatTime(s) {
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  }

  // ── Phase 1: Reading countdown ──────────────────────────────────────────────

  let readRemaining = readSecs;
  readingTimerText.textContent = formatTime(readRemaining);
  // Ensure timer is wrapped in our new centered class
  readingTimerText.className = "rc-timer-wrapper";

  activeInterval = setInterval(() => {
    readRemaining--;
    readingTimerText.textContent = formatTime(readRemaining);
    if (readRemaining <= 0) {
      clearActive();
      startQuestions();
    }
  }, 1000);

  // ── Phase 2: Questions (one at a time, 10s each) ────────────────────────────

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
    
    // Injected a numerical timer at the top center of the question area
    qArea.innerHTML = `
      <div id="rc-q-timer-text" class="rc-timer-wrapper">0:10</div>
      <div class="rc-q-text" style="max-width: 750px; margin: 0 auto; text-align: left;">
        <span class="rc-q-num">${qi + 1}.</span> ${questions[qi]}
      </div>
      <div class="rc-opts" style="max-width: 750px; margin: 20px auto;">
        ${options[qi].map((opt, oi) => `
          <button class="rc-opt-btn" data-qi="${qi}" data-oi="${oi}" style="display:block; width:100%; margin-bottom:10px; padding:15px; border:1px solid #000; background:#fff; cursor:pointer; text-align:left;">
            <strong style="margin-right: 10px;">${labels[oi]}.</strong>
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
    qTimerText.textContent = formatTime(qRemaining);

    activeInterval = setInterval(() => {
      qRemaining--;
      qTimerText.textContent = formatTime(qRemaining);
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

  // ── Phase 3: Results (Monochrome) ───────────────────────────────────────────

  function showResults() {
    questionPhase.style.display = 'none';
    resultsPhase.style.display  = 'flex';
    resultsPhase.style.flexDirection = 'column';
    phaseLabel.textContent      = 'RESULTS';
    progressEl.textContent      = '';

    const labels = ['A', 'B', 'C', 'D'];
    let correct  = 0;

    questions.forEach((q, qi) => {
      const correctIdx = labels.indexOf(answers[qi]);
      const userIdx    = userAnswers[qi];
      if (userIdx === correctIdx) correct++;

      const block       = document.createElement('div');
      const isCorrect   = userIdx === correctIdx;
      block.className   = `rc-review-block ${isCorrect ? 'review-correct' : 'review-wrong'}`;
      const chosenLabel = userIdx !== null ? labels[userIdx] : '—';
      const correctOptText = options[qi] && options[qi][correctIdx] ? options[qi][correctIdx] : '';

      block.innerHTML = `
        <div class="review-q"><span class="rc-q-num">${qi + 1}.</span> ${q}</div>
        <div class="review-row">
          <span class="review-yours ${isCorrect ? 'right' : 'wrong-label'}">Selected: ${chosenLabel}</span>
          <span class="review-correct-label">Correct Answer: ${answers[qi]} - ${correctOptText}</span>
        </div>
      `;
      answersReview.appendChild(block);
    });

    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    finalScore.innerHTML = `
      <div style="text-align:center; font-size: 2rem; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px;">
        <span class="rc-score">${correct} / ${questions.length}</span>
        <span class="rc-score-pct">(${pct}%)</span>
      </div>
    `;
  }

  // ── Close ───────────────────────────────────────────────────────────────────

  document.getElementById('rc-close').onclick = () => {
    clearActive();
    overlay.classList.remove('active');
  };
}