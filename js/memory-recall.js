// ========================================================================
// 🧠 MEMORY RECALL
// ========================================================================

// ── Datamuse word fetcher ────────────────────────────────────────────────
// Fetches common English words from the Datamuse API.
// Uses `ml=common` with a high max to get a large diverse pool,
// then shuffles and slices to the count needed.

async function fetchWords(count) {
  // Datamuse: words with frequency score, sorted by frequency descending
  // We fetch a large batch so we have plenty to shuffle from
  const fetchCount = Math.max(count * 4, 500);
  const res = await fetch(`https://api.datamuse.com/words?ml=common&max=${fetchCount}&md=f`);
  if (!res.ok) throw new Error('Datamuse fetch failed');
  const data = await res.json();

  // Filter to words that are single tokens, purely alphabetical, 3–10 chars
  const filtered = data
    .map(d => d.word)
    .filter(w => /^[a-zA-Z]{3,10}$/.test(w));

  // Shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // If API gave us enough, return sliced; else repeat to fill
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(filtered[i % filtered.length].toUpperCase());
  }
  return words;
}

// ── Fallback pool (used if fetch fails) ─────────────────────────────────
const MR_FALLBACK_POOL = [
  "apple","bridge","camera","dance","eagle","flame","garden","harbor",
  "island","jungle","kettle","ladder","marble","needle","ocean","palace",
  "queen","river","silver","table","umbrella","valley","window","yellow",
  "anchor","basket","candle","dollar","engine","flower","glacier","helmet",
  "insect","jacket","kitten","lemon","mango","napkin","orange","pencil",
  "quartz","rabbit","salmon","tunnel","unicorn","vendor","walnut","yogurt",
  "zipper","acorn","barrel","carpet","desert","elbow","forest","goblin",
  "icicle","jigsaw","kernel","lantern","mirror","nickel","oyster","pillow",
  "quiver","rocket","saddle","timber","violet","wander","advice","beacon",
  "carrot","donkey","finger","guitar","hunter","impact","junior","lobster",
  "meadow","noodle","pepper","riddle","socket","teapot","vessel","walrus",
  "zombie","butter","canvas","drawer","gravel","honest","infant","journal",
  "lizard","muffin","novel","peanut","rattle","sector","throne","vendor"
];

// ── Launch ───────────────────────────────────────────────────────────────

document.getElementById('mr-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  launchMR();
});

function launchMR() {
  const overlay    = document.getElementById('mr-overlay');
  const body       = document.getElementById('mr-body');
  const phaseLabel = document.getElementById('mr-phase-label');
  const progress   = document.getElementById('mr-progress');

  const wordCount = Math.min(1000, Math.max(3, parseInt(document.getElementById('mr-items-input').value) || 7));
  const studySecs = Math.max(3, parseInt(document.getElementById('mr-study-input').value) || 10);

  overlay.classList.add('active');
  phaseLabel.textContent = 'LOADING…';
  progress.textContent   = '';

  // Show loading state while fetching
  body.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; height:100%;">
      <span style="font-family:'Archivo Black',sans-serif; font-size:2vw; color:#aaa; letter-spacing:0.15em;">
        FETCHING WORDS…
      </span>
    </div>`;

  fetchWords(wordCount)
    .catch(() => {
      // Fallback: shuffle local pool
      console.warn('[MR] Datamuse unavailable, using fallback pool.');
      const shuffled = [...MR_FALLBACK_POOL].sort(() => Math.random() - 0.5);
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        words.push(shuffled[i % shuffled.length].toUpperCase());
      }
      return words;
    })
    .then(words => startSession(words));

  // ── Session ──────────────────────────────────────────────────────────────

  function startSession(words) {
    let studyInterval  = null;
    let studyRemaining = studySecs;

    function clearActive() {
      if (studyInterval) { clearInterval(studyInterval); studyInterval = null; }
    }

    function formatTime(s) {
      return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }

    // ── Phase 1: Study ─────────────────────────────────────────────────────

    function startStudy() {
      phaseLabel.textContent = 'STUDY';

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; gap:0;">
          <div id="mr-study-timer" style="
            font-family:'Archivo Black',sans-serif;
            font-size:1.5rem;
            text-align:center;
            padding: 0 0 16px;
            color:#000;
            font-variant-numeric:tabular-nums;
            flex-shrink:0;">
            ${formatTime(studyRemaining)}
          </div>
          <div id="mr-word-grid" style="
            display:flex;
            flex-wrap:wrap;
            gap:10px 14px;
            overflow-y:auto;
            flex:1;
            align-content:flex-start;
            padding: 4px 2px 40px;">
            ${words.map(w => `
              <span style="
                font-family:'Archivo Black',sans-serif;
                font-size:1.1vw;
                color:#000;
                border:1.5px solid #000;
                padding:4px 10px;
                letter-spacing:0.05em;
                background:#fff;">
                ${w}
              </span>`).join('')}
          </div>
        </div>`;

      studyInterval = setInterval(() => {
        studyRemaining--;
        const timerEl = document.getElementById('mr-study-timer');
        if (timerEl) timerEl.textContent = formatTime(studyRemaining);
        if (studyRemaining <= 0) {
          clearActive();
          startRecall();
        }
      }, 1000);
    }

    // ── Phase 2: Recall ────────────────────────────────────────────────────

    function startRecall() {
      phaseLabel.textContent = 'RECALL';
      progress.textContent   = `0 / ${wordCount}`;

      const entered = [];

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:20px;">
          <div style="font-family:'Archivo Black',sans-serif; font-size:1.1vw; color:#aaa; letter-spacing:0.15em;">
            Type each word you remember and press Enter
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <input
              id="mr-recall-input"
              type="text"
              autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
              placeholder="TYPE A WORD…"
              style="
                background:transparent;
                border:none;
                border-bottom:3px solid #000;
                font-family:'Archivo Black',sans-serif;
                font-size:2.5vw;
                color:#000;
                width:22ch;
                outline:none;
                text-align:center;
                text-transform:uppercase;
                letter-spacing:0.08em;
              " />
          </div>
          <div id="mr-entered-list" style="
            display:flex; flex-wrap:wrap; gap:8px 12px; max-width:700px;
            justify-content:center; margin-top:8px; min-height:40px;">
          </div>
          <div id="mr-recall-feedback" style="font-family:'Archivo Black',sans-serif; font-size:1vw; color:#aaa; min-height:1.4em;"></div>
          <button id="mr-finish-btn"
            style="background:transparent; border:2px solid #000; color:#000; font-family:'Archivo Black',sans-serif;
                   font-size:1.2vw; padding:0.5vh 2vw; cursor:pointer; letter-spacing:0.08em; margin-top:8px;"
            onmouseover="this.style.background='#000';this.style.color='#fff';"
            onmouseout="this.style.background='transparent';this.style.color='#000';">
            FINISH →
          </button>
        </div>`;

      const input      = document.getElementById('mr-recall-input');
      const listEl     = document.getElementById('mr-entered-list');
      const feedbackEl = document.getElementById('mr-recall-feedback');

      const wordSet   = new Set(words);
      const usedWords = new Set();

      input.focus();

      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const val = input.value.trim().toUpperCase();
        input.value = '';
        if (!val) return;

        if (usedWords.has(val)) {
          feedbackEl.textContent = `"${val}" already entered`;
          feedbackEl.style.color = '#e53e3e';
          return;
        }

        const isCorrect = wordSet.has(val);
        usedWords.add(val);
        entered.push({ word: val, correct: isCorrect });

        const chip = document.createElement('span');
        chip.textContent = val;
        chip.style.cssText = `
          font-family:'Archivo Black',sans-serif;
          font-size:0.9vw;
          border:1.5px solid ${isCorrect ? '#000' : '#ccc'};
          color:${isCorrect ? '#000' : '#ccc'};
          padding:3px 9px;
          letter-spacing:0.04em;`;
        listEl.appendChild(chip);

        feedbackEl.textContent = isCorrect ? `✓ "${val}" was on the list` : `"${val}" was not on the list`;
        feedbackEl.style.color = isCorrect ? '#38a169' : '#e53e3e';

        const correctCount = entered.filter(e => e.correct).length;
        progress.textContent = `${correctCount} / ${wordCount}`;
      });

      document.getElementById('mr-finish-btn').addEventListener('click', () => {
        showResults(entered, words);
      });
    }

    // ── Phase 3: Results ───────────────────────────────────────────────────

    function showResults(entered, words) {
      phaseLabel.textContent = 'RESULTS';

      const enteredSet   = new Set(entered.filter(e => e.correct).map(e => e.word));
      const correctCount = enteredSet.size;
      const pct          = wordCount > 0 ? Math.round((correctCount / wordCount) * 100) : 0;

      progress.textContent = '';

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0; height:100%;">
          <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:16px; margin-bottom:24px; flex-shrink:0;">
            <span style="font-family:'Archivo Black',sans-serif; font-size:5vw; color:#000;">${correctCount} / ${wordCount}</span>
            <span style="font-family:'Archivo Black',sans-serif; font-size:2vw; color:#aaa; margin-left:12px;">(${pct}%)</span>
          </div>
          <div id="mr-result-grid" style="
            display:flex; flex-wrap:wrap; gap:10px 14px;
            overflow-y:auto; flex:1; align-content:flex-start;
            padding:4px 2px 40px;">
            ${words.map(w => {
              const recalled = enteredSet.has(w);
              return `<span style="
                font-family:'Archivo Black',sans-serif;
                font-size:1.1vw;
                border:${recalled ? '1.5px solid #000' : '1px dashed #ccc'};
                color:${recalled ? '#000' : '#cccccc'};
                padding:4px 10px;
                letter-spacing:0.05em;
                background:#fff;">
                ${w}
              </span>`;
            }).join('')}
          </div>
        </div>`;
    }

    startStudy();
  }

  document.getElementById('mr-close').onclick = () => {
    if (studyInterval) clearInterval(studyInterval);
    overlay.classList.remove('active');
  };
}