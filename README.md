# Eike

Eike is a browser-based cognitive training suite. Seven modules, each targeting a different aspect of mental performance.

---

## Modules

### RSVP
Trains reading speed. Words flash one at a time at your chosen pace, forcing your eyes to stop subvocalizing and process faster.

**Before starting:** Paste any text anywhere on the page. The status next to TEXT will update to "Pasted". Without pasted text, a short demo sequence runs instead.

| Setting | What it does |
|---|---|
| WPM | How many words flash per minute. Start around 250 and push up as you get comfortable. |
| Chunks | How many words appear per flash. 1 is standard. Increase to 2–3 to train phrase-level reading. |

Click anywhere on the screen to exit early.

---

### READING COMPREHENSION
A timed reading exercise with comprehension questions. You read an article under a countdown, then answer multiple-choice questions — 10 seconds each, no going back.

**Flow:** Read → Answer questions → Review results

| Setting | What it does |
|---|---|
| Difficulty | Middle or High — controls the complexity of the source articles. |
| Timer | How many seconds you get to read before questions begin. |

Results show every question, what you chose, and the correct answer.

---

### REASONING
Logical reasoning questions drawn from a dataset. Read the context, read the question, pick the best answer before the timer runs out.

After each answer — whether you answered or timed out — the correct option is revealed immediately. You then choose when to move to the next question.

**Flow:** Question → Immediate answer reveal → Next → ... → Final score

| Setting | What it does |
|---|---|
| Rounds | How many questions per session (randomly sampled). |
| Timer | Seconds per question before auto-advancing. |

The running score is shown after every question. The final screen lists all questions with what you answered and what was correct.

---

### FLASH ARITHMETIC
Numbers and operators flash one at a time. You track the running total in your head and enter the final answer after the last number. No calculator, no pen.

| Setting | What it does |
|---|---|
| OPS | Which operators to use. Enter any combination of `+`, `-`, `×`, `÷` separated by commas. |
| Digits | How many digits the numbers have. `1` means single-digit (1–9), `2` means two-digit (10–99). Mix them: `1, 2`. |
| Flashes | How many numbers appear in each sequence. More flashes = longer chain to track. |
| Speed | How long each number stays visible, in seconds. Lower is harder. |

Type your answer and press Enter to submit. Press Enter again to go to the next round.

---

### SEQUENCE MAPPING
A grid of cells lights up one at a time in a random order. Then the grid goes dark. Tap the cells back in the exact same sequence.

One wrong tap ends the round immediately.

| Setting | What it does |
|---|---|
| Grid | The grid size, written as columns × rows. `3x3` is 9 cells, `4x4` is 16, and so on. |
| Flashes | How many cells in the sequence. Cannot exceed the total number of cells. |
| Speed | How long each cell stays lit, in seconds. |

---

### MEMORY RECALL
A list of words appears for a fixed study period. When the timer ends, the list disappears and you type back as many words as you can remember, in any order.

| Setting | What it does |
|---|---|
| Words | How many words are in the study list. |
| Timer | How many seconds you have to study before recall begins. |

Type each word and press Enter. You get immediate confirmation whether the word was on the list. When you're done, click Finish to see your score alongside the full original list.

Words are sourced live from an English word frequency database. A local fallback is used automatically if the connection fails.

---

### ARTICULATION
*(Coming soon)*
