// ========================================================================
// 🧠 MEMORY RECALL
// ========================================================================

async function fetchWords(count) {
  const fetchCount = Math.max(count * 4, 500);
  const res = await fetch(`https://api.datamuse.com/words?ml=common&max=${fetchCount}&md=f`);
  if (!res.ok) throw new Error('Datamuse fetch failed');
  const data = await res.json();

  const filtered = data
    .map(d => d.word)
    .filter(w => /^[a-zA-Z]{3,10}$/.test(w));

  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(filtered[i % filtered.length].toUpperCase());
  }
  return words;
}

const MR_FALLBACK_POOL = [
  'apple','bridge','camera','dance','eagle','flame','garden','harbor',
  'island','jungle','kettle','ladder','marble','needle','ocean','palace',
  'queen','river','silver','table','umbrella','valley','window','yellow',
  'anchor','basket','candle','dollar','engine','flower','glacier','helmet',
  'insect','jacket','kitten','lemon','mango','napkin','orange','pencil',
  'quartz','rabbit','salmon','tunnel','unicorn','vendor','walnut','yogurt',
  'zipper','acorn','barrel','carpet','desert','elbow','forest','goblin',
  'icicle','jigsaw','kernel','lantern','mirror','nickel','oyster','pillow',
  'quiver','rocket','saddle','timber','violet','wander','advice','beacon',
  'carrot','donkey','finger','guitar','hunter','impact','junior','lobster',
  'meadow','noodle','pepper','riddle','socket','teapot','vessel','walrus',
  'zombie','butter','canvas','drawer','gravel','honest','infant','journal',
  'lizard','muffin','novel','peanut','rattle','sector','throne','vendor'
];

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
  phaseLabel.textContent = 'LOADING';
  progress.textContent   = '';

  body.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; height:100%;">
      <span style="font-family:'Archivo Black',sans-serif; font-size:1.5vw;
                   color:#aaaaaa; letter-spacing:0.15em;">
        FETCHING WORDS…
      </span>
    </div>`;

  // Bind close button here at top level so it always works
  document.getElementById('mr-close').onclick = () => {
    if (studyIntervalRef) clearInterval(studyIntervalRef);
    overlay.classList.remove('active');
  };

  let studyIntervalRef = null;

  fetchWords(wordCount)
    .catch(() => {
      const shuffled = [...MR_FALLBACK_POOL].sort(() => Math.random() - 0.5);
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        words.push(shuffled[i % shuffled.length].toUpperCase());
      }
      return words;
    })
    .then(words => startSession(words));

  function startSession(words) {
    let studyInterval  = null;
    let studyRemaining = studySecs;
    studyIntervalRef   = null;

    function clearActive() {
      if (studyInterval) { clearInterval(studyInterval); studyInterval = null; studyIntervalRef = null; }
    }

    // ── Phase 1: Study ──────────────────────────────────────────────────────

    function startStudy() {
      phaseLabel.textContent = 'STUDY';

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; gap:0;">
          <div id="mr-study-timer"
            style="font-family:'Archivo Black',sans-serif; font-size:1rem; color:#aaaaaa;
                   text-align:center; padding:0 0 1.5vh; letter-spacing:0.1em; flex-shrink:0;">
            ${formatTime(studyRemaining)}
          </div>
          <div id="mr-word-grid"
            style="display:flex; flex-wrap:wrap; gap:8px 12px; overflow-y:auto;
                   flex:1; align-content:flex-start; padding:4px 2px 40px;">
            ${words.map(w => `
              <span style="
                font-family:'Archivo Black',sans-serif; font-size:1.1vw; color:#000000;
                padding:4px 10px; letter-spacing:0.05em;">
                ${w}
              </span>`).join('')}
          </div>
        </div>`;

      studyInterval     = setInterval(() => {
        studyRemaining--;
        studyIntervalRef = studyInterval;
        const timerEl = document.getElementById('mr-study-timer');
        if (timerEl) timerEl.textContent = formatTime(studyRemaining);
        if (studyRemaining <= 0) {
          clearActive();
          startRecall();
        }
      }, 1000);
      studyIntervalRef = studyInterval;
    }

    // ── Phase 2: Recall ─────────────────────────────────────────────────────

    function startRecall() {
      phaseLabel.textContent = 'RECALL';
      progress.textContent   = `0 / ${wordCount}`;

      const entered = [];

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;
                    justify-content:center; height:100%; gap:2.5vh;">
          <div style="font-family:'Archivo Black',sans-serif; font-size:0.9vw;
                      color:#aaaaaa; letter-spacing:0.15em;">
            TYPE EACH WORD AND PRESS ENTER
          </div>
          <input
            id="mr-recall-input" type="text"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            placeholder="TYPE A WORD…"
            style="
              background:transparent; border:none; border-bottom:3px solid #000000;
              font-family:'Archivo Black',sans-serif; font-size:2.5vw; color:#000000;
              width:22ch; outline:none; text-align:center;
              text-transform:uppercase; letter-spacing:0.08em;
            " />
          <div id="mr-entered-list"
            style="display:flex; flex-wrap:wrap; gap:6px 10px; max-width:700px;
                   justify-content:center; margin-top:0.5vh; min-height:40px;">
          </div>
          <div id="mr-recall-feedback"
            style="font-family:'Archivo Black',sans-serif; font-size:0.9vw;
                   color:#aaaaaa; letter-spacing:0.08em; min-height:1.4em;"></div>
          <button id="mr-finish-btn" class="action-btn" style="margin-top:1vh;">
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
          return;
        }

        const isCorrect = wordSet.has(val);
        usedWords.add(val);
        entered.push({ word: val, correct: isCorrect });

        const chip = document.createElement('span');
        chip.textContent = val;
        chip.style.cssText = `
          font-family:'Archivo Black',sans-serif; font-size:0.9vw;
          color:${isCorrect ? '#000000' : '#cccccc'};
          padding:3px 9px; letter-spacing:0.04em;`;
        listEl.appendChild(chip);

        feedbackEl.textContent = isCorrect ? `"${val}" — on the list` : `"${val}" — not on the list`;
        feedbackEl.style.color = isCorrect ? '#000000' : '#aaaaaa';

        const correctCount = entered.filter(e => e.correct).length;
        progress.textContent = `${correctCount} / ${wordCount}`;
      });

      document.getElementById('mr-finish-btn').addEventListener('click', () => {
        showResults(entered, words);
      });
    }

    // ── Phase 3: Results ────────────────────────────────────────────────────

    function showResults(entered, words) {
      phaseLabel.textContent = 'RESULTS';

      const enteredSet   = new Set(entered.filter(e => e.correct).map(e => e.word));
      const correctCount = enteredSet.size;
      const pct          = wordCount > 0 ? Math.round((correctCount / wordCount) * 100) : 0;

      progress.textContent = '';

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0; height:100%;">
          <div style="text-align:center; padding-bottom:2vh; margin-bottom:2.5vh; flex-shrink:0;">
            <span style="font-family:'Archivo Black',sans-serif; font-size:5vw; color:#000000;">
              ${correctCount} / ${wordCount}
            </span>
            <span style="font-family:'Archivo Black',sans-serif; font-size:2vw;
                         color:#aaaaaa; margin-left:1.2vw;">
              (${pct}%)
            </span>
          </div>
          <div id="mr-result-grid"
            style="display:flex; flex-wrap:wrap; gap:8px 12px; overflow-y:auto;
                   flex:1; align-content:flex-start; padding:4px 2px 40px;">
            ${words.map(w => {
              const recalled = enteredSet.has(w);
              return `<span style="
                font-family:'Archivo Black',sans-serif; font-size:1.1vw;
                color:${recalled ? '#000000' : '#cccccc'};
                padding:4px 10px; letter-spacing:0.05em;">
                ${w}
              </span>`;
            }).join('')}
          </div>
        </div>`;
    }

    startStudy();
  }
}