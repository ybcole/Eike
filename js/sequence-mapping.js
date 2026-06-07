// ========================================================================
// 🔲 SEQUENCE MAPPING
// ========================================================================

document.getElementById('sm-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  launchSM();
});

function launchSM() {
  const overlay    = document.getElementById('sm-overlay');
  const body       = document.getElementById('sm-body');
  const phaseLabel = document.getElementById('sm-phase-label');
  const progress   = document.getElementById('sm-progress');

  const gridRaw   = document.getElementById('sm-grid-input').value.trim().toLowerCase();
  const gridMatch = gridRaw.match(/^(\d+)[x×](\d+)$/);
  let cols = 3, rows = 3;
  if (gridMatch) {
    cols = Math.min(10, Math.max(1, parseInt(gridMatch[1])));
    rows = Math.min(10, Math.max(1, parseInt(gridMatch[2])));
  }
  const totalCells = cols * rows;

  const flashes  = Math.min(parseInt(document.getElementById('sm-flashes-input').value) || 4, totalCells);
  const speedSec = parseFloat(document.getElementById('sm-speed-input').value) || 0.8;
  const FLASH_MS = Math.round(speedSec * 1000);

  overlay.classList.add('active');
  phaseLabel.textContent = 'WATCH';

  let activeTimeout = null;

  function clearActive() {
    if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  }

  function buildSequence(total, len) {
    const indices = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, len);
  }

  const sequence = buildSequence(totalCells, flashes);

  function renderGrid(interactive = false) {
    const maxGridW = Math.min(window.innerWidth * 0.7, 560);
    const cellSize = Math.floor(Math.min(maxGridW / cols, 80));
    const gap      = 6;

    let html = `
      <div id="sm-grid"
        style="
          display:grid;
          grid-template-columns:repeat(${cols}, ${cellSize}px);
          grid-template-rows:repeat(${rows}, ${cellSize}px);
          gap:${gap}px;
          margin:0 auto;
          width:fit-content;
          user-select:none;
        ">`;

    for (let i = 0; i < totalCells; i++) {
      html += `
        <div class="sm-cell" data-idx="${i}"
          style="
            width:${cellSize}px; height:${cellSize}px;
            border:2px solid #dddddd; background:#ffffff;
            cursor:${interactive ? 'pointer' : 'default'};
            transition:background 0.1s ease;
          ">
        </div>`;
    }
    html += `</div>`;
    return html;
  }

  function getCellEl(idx) {
    return body.querySelector(`.sm-cell[data-idx="${idx}"]`);
  }

  // ── Phase 1: Flash ────────────────────────────────────────────────────────

  function startFlashing() {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;
                  justify-content:center; height:100%; min-height:360px; gap:28px;">
        ${renderGrid(false)}
      </div>`;

    let fi = 0;

    function flashNext() {
      if (fi >= sequence.length) {
        activeTimeout = setTimeout(startInput, 600);
        return;
      }

      if (fi > 0) {
        const prev = getCellEl(sequence[fi - 1]);
        if (prev) prev.style.background = '#ffffff';
      }

      const cell = getCellEl(sequence[fi]);
      if (cell) cell.style.background = '#000000';

      fi++;
      activeTimeout = setTimeout(() => {
        const prev = getCellEl(sequence[fi - 1]);
        if (prev) prev.style.background = '#ffffff';
        activeTimeout = setTimeout(flashNext, 150);
      }, FLASH_MS);
    }

    activeTimeout = setTimeout(flashNext, 1000);
  }

  // ── Phase 2: Input ────────────────────────────────────────────────────────

  function startInput() {
    phaseLabel.textContent = 'RECALL';

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;
                  justify-content:center; height:100%; min-height:360px; gap:2vh;">
        <div style="font-family:'Archivo Black',sans-serif; font-size:0.9vw;
                    color:#aaaaaa; letter-spacing:0.15em; margin-bottom:1vh;">
          TAP CELLS IN ORDER
        </div>
        ${renderGrid(true)}
      </div>`;

    const userClicks   = [];
    let   clickIdx     = 0;
    let   wrongClicked = false;

    body.querySelectorAll('.sm-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (wrongClicked) return;
        const idx      = parseInt(cell.dataset.idx);
        const expected = sequence[clickIdx];

        if (idx === expected) {
          cell.style.background = '#000000';
          cell.style.borderColor = '#000000';
          userClicks.push(idx);
          clickIdx++;

          if (clickIdx === sequence.length) {
            activeTimeout = setTimeout(() => showResult(true, userClicks), 500);
          }
        } else {
          wrongClicked = true;
          cell.style.background = '#aaaaaa';
          cell.style.borderColor = '#aaaaaa';
          userClicks.push(idx);
          activeTimeout = setTimeout(() => showResult(false, userClicks), 700);
        }
      });
    });
  }

  // ── Phase 3: Result ───────────────────────────────────────────────────────

  function showResult(isCorrect, userClicks) {
    phaseLabel.textContent = 'RESULT';

    const correctStr = sequence.map(v => `#${v + 1}`).join(' → ');
    const userStr    = userClicks.map(v => `#${v + 1}`).join(' → ');

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;
                  justify-content:center; height:100%; min-height:360px; gap:3vh;">
        <div style="font-family:'Archivo Black',sans-serif; font-size:5vw; color:#000000;">
          ${isCorrect ? 'CORRECT' : 'WRONG'}
        </div>
        <div style="max-width:560px; width:100%; display:flex; flex-direction:column; gap:1.5vh;">
          <div style="padding:1.5vh 0;">
            <div style="font-family:'Archivo Black',sans-serif; font-size:0.75vw;
                        color:#aaaaaa; letter-spacing:0.2em; margin-bottom:0.8vh;">
              CORRECT SEQUENCE
            </div>
            <div style="font-family:monospace; font-size:1.1vw; color:#000000;">
              ${correctStr}
            </div>
          </div>
          ${!isCorrect ? `
          <div style="padding:1.5vh 0;">
            <div style="font-family:'Archivo Black',sans-serif; font-size:0.75vw;
                        color:#aaaaaa; letter-spacing:0.2em; margin-bottom:0.8vh;">
              YOUR SEQUENCE
            </div>
            <div style="font-family:monospace; font-size:1.1vw; color:#aaaaaa;">
              ${userStr}
            </div>
          </div>` : ''}
        </div>
        <button id="sm-retry-btn" class="action-btn">TRY AGAIN →</button>
      </div>`;

    document.getElementById('sm-retry-btn').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  document.getElementById('sm-close').onclick = () => {
    clearActive();
    overlay.classList.remove('active');
  };

  startFlashing();
}