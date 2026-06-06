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

  // Parse grid input e.g. "3x3" or "2x5"
  const gridRaw   = document.getElementById('sm-grid-input').value.trim().toLowerCase();
  const gridMatch = gridRaw.match(/^(\d+)[x×](\d+)$/);
  let cols = 3, rows = 3;
  if (gridMatch) {
    cols = Math.min(10, Math.max(1, parseInt(gridMatch[1])));
    rows = Math.min(10, Math.max(1, parseInt(gridMatch[2])));
  }
  const totalCells = cols * rows;

  const flashes = Math.min(parseInt(document.getElementById('sm-flashes-input').value) || 4, totalCells);
  const speedSec = parseFloat(document.getElementById('sm-speed-input').value) || 0.8;
  const FLASH_MS = Math.round(speedSec * 1000);

  overlay.classList.add('active');

  let activeTimeout = null;

  function clearActive() {
    if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  }

  // Build a sequence of unique random cell indices
  function buildSequence(total, len) {
    const indices = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, len);
  }

  const sequence = buildSequence(totalCells, flashes);

  // Render a grid; returns a function to highlight a cell by index
  function renderGrid(interactive = false, clickHandler = null) {
    // Compute cell size so the grid fits well in the viewport
    const maxGridW = Math.min(window.innerWidth * 0.7, 600);
    const cellSize = Math.floor(Math.min(maxGridW / cols, 80));

    const gridW = cellSize * cols;
    const gap   = 6;

    let html = `
      <div id="sm-grid"
        style="
          display: grid;
          grid-template-columns: repeat(${cols}, ${cellSize}px);
          grid-template-rows:    repeat(${rows}, ${cellSize}px);
          gap: ${gap}px;
          margin: 0 auto;
          width: fit-content;
          user-select: none;
        ">`;

    for (let i = 0; i < totalCells; i++) {
      html += `
        <div
          class="sm-cell"
          data-idx="${i}"
          style="
            width:${cellSize}px; height:${cellSize}px;
            border:2px solid #000;
            background:#fff;
            cursor:${interactive ? 'pointer' : 'default'};
            display:flex; align-items:center; justify-content:center;
            transition: background 0.12s ease;
          ">
        </div>`;
    }
    html += `</div>`;
    return html;
  }

  function getCellEl(idx) {
    return body.querySelector(`.sm-cell[data-idx="${idx}"]`);
  }

  // ── Phase 1: Flash sequence ──────────────────────────────────────────────

  function startFlashing() {

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:360px; gap:28px;">
        ${renderGrid(false)}
      </div>`;

    let fi = 0;

    function flashNext() {
      if (fi >= sequence.length) {
        // All flashed — go to input phase
        activeTimeout = setTimeout(startInput, 600);
        return;
      }

      // Clear previous
      if (fi > 0) {
        getCellEl(sequence[fi - 1]).style.background = '#fff';
      }

      const cell = getCellEl(sequence[fi]);
      cell.style.background = '#000';

      fi++;
      activeTimeout = setTimeout(() => {
        // Brief blank pause between flashes
        const prev = getCellEl(sequence[fi - 1]);
        if (prev) { prev.style.background = '#fff'; }
        activeTimeout = setTimeout(flashNext, 150);
      }, FLASH_MS);
    }

    // Wait exactly 1 second before starting the first flash
    activeTimeout = setTimeout(flashNext, 1000);
  }

  // ── Phase 2: User clicks in order ───────────────────────────────────────

  function startInput() {

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:360px; gap:28px;">
        ${renderGrid(true)}
      </div>`;

    const userClicks   = [];
    let   clickIdx     = 0;
    let   wrongClicked = false;

    body.querySelectorAll('.sm-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (wrongClicked) return;
        const idx = parseInt(cell.dataset.idx);
        const expected = sequence[clickIdx];

        if (idx === expected) {
          cell.style.background = '#000';
          userClicks.push(idx);
          clickIdx++;

          if (clickIdx === sequence.length) {
            // All correct!
            activeTimeout = setTimeout(() => showResult(true, userClicks), 500);
          }
        } else {
          // Wrong cell
          wrongClicked = true;
          cell.style.background = '#e53e3e';
          userClicks.push(idx);
          activeTimeout = setTimeout(() => showResult(false, userClicks), 700);
        }
      });
    });
  }

  // ── Phase 3: Result ──────────────────────────────────────────────────────

  function showResult(isCorrect, userClicks) {

    const correctStr = sequence.map((v, i) => `#${v + 1}`).join(' → ');
    const userStr    = userClicks.map(v => `#${v + 1}`).join(' → ');

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:360px; gap:32px;">
        <div style="
          font-family:'Archivo Black',sans-serif;
          font-size:5vw;
          color:#000;
          border-bottom:2px solid #000;
          padding-bottom:16px;
          text-align:center;">
          ${isCorrect ? '✓ CORRECT' : 'WRONG'}
        </div>
        <div style="max-width:600px; width:100%; display:flex; flex-direction:column; gap:12px;">
          <div style="border:${isCorrect ? '2px solid #000' : '1px dashed #000'}; padding:16px 20px;">
            <div style="font-family:'Archivo Black',sans-serif; font-size:0.9vw; color:#aaa; letter-spacing:0.15em; margin-bottom:8px;">CORRECT SEQUENCE</div>
            <div style="font-family:monospace; font-size:1.1vw; color:#000;">${correctStr}</div>
          </div>
          ${!isCorrect ? `
          <div style="border:1px dashed #000; padding:16px 20px;">
            <div style="font-family:'Archivo Black',sans-serif; font-size:0.9vw; color:#aaa; letter-spacing:0.15em; margin-bottom:8px;">YOUR SEQUENCE</div>
            <div style="font-family:monospace; font-size:1.1vw; color:#e53e3e;">${userStr}</div>
          </div>` : ''}
        </div>
        <button id="sm-retry-btn"
          style="background:transparent; border:2px solid #000; color:#000; font-family:'Archivo Black',sans-serif;
                 font-size:1.4vw; padding:0.6vh 2.5vw; cursor:pointer; letter-spacing:0.08em;"
          onmouseover="this.style.background='#000';this.style.color='#fff';"
          onmouseout="this.style.background='transparent';this.style.color='#000';">
          TRY AGAIN →
        </button>
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