// ========================================================================
// ⚡ RSVP
// ========================================================================

let pastedText = null;

document.addEventListener('paste', (e) => {
  const text = e.clipboardData.getData('text/plain').trim();
  if (text) {
    pastedText = text;
    document.getElementById('text-status').textContent = 'Pasted';
  }
});

document.getElementById('start-btn').addEventListener('click', () => {
  const wpm    = parseInt(document.getElementById('wpm-input').value) || 250;
  const chunks = parseInt(document.getElementById('chunks-input').value) || 1;
  const words  = pastedText
    ? pastedText.split(/\s+/).filter(Boolean)
    : generateDemoWords(30);

  const delay   = Math.round((60 / wpm) * 1000);
  const overlay = document.getElementById('rsvp-overlay');
  const wordEl  = document.getElementById('rsvp-word');

  const chunked = [];
  for (let i = 0; i < words.length; i += chunks) {
    chunked.push(words.slice(i, i + chunks).join(' '));
  }

  let index = 0;
  overlay.classList.add('active');
  wordEl.textContent = chunked[0];

  const interval = setInterval(() => {
    index++;
    if (index >= chunked.length) {
      clearInterval(interval);
      wordEl.textContent = '✓';
      setTimeout(() => overlay.classList.remove('active'), 800);
      return;
    }
    wordEl.textContent = chunked[index];
  }, delay);

  overlay.addEventListener('click', () => {
    clearInterval(interval);
    overlay.classList.remove('active');
  }, { once: true });
});

function generateDemoWords(count) {
  const pool = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'speed', 'reading', 'helps', 'focus', 'and', 'retain', 'information',
    'faster', 'than', 'normal', 'methods', 'of', 'reading', 'text', 'on', 'a', 'screen',
  ];
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}