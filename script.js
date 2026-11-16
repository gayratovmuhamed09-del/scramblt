/* ===== 1. Заголовок: буквы «собираются» из беспорядка ===== */
(function titleAnimation() {
  const title = document.getElementById('title');
  const text = title.textContent.trim();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  title.textContent = '';
  const tiles = [...text].map((ch) => {
    const span = document.createElement('span');
    span.className = 'tile';
    span.textContent = ch;
    span.setAttribute('aria-hidden', 'true');
    title.appendChild(span);
    return span;
  });

  if (reduce) return;

  tiles.forEach((t) => {
    const x = (Math.random() - 0.5) * 120;
    const y = (Math.random() - 0.5) * 80;
    const r = (Math.random() - 0.5) * 120;
    t.style.transition = 'none';
    t.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      tiles.forEach((t, i) => {
        t.style.transition = '';
        t.style.transitionDelay = `${300 + i * 70}ms`;
        t.style.transform = 'none';
      });
    });
  });
})();

/* ===== 2. Мини-игра: собери кубик ===== */
(function puzzle() {
  const COLORS = ['red', 'yellow', 'green'];
  const SOLVED = () => COLORS.map((c) => [c, c, c]);

  const board = document.getElementById('board');
  const status = document.getElementById('status');
  const root = document.querySelector('.puzzle');
  const btnScramble = document.getElementById('btnScramble');
  const btnSolve = document.getElementById('btnSolve');

  let state = SOLVED();
  let history = [];      // все сделанные ходы, чтобы можно было «отмотать»
  let busy = false;
  let moves = 0;

  const cells = [];
  const arrowButtons = [];

  /* --- построение поля 4x4: стрелки + 3x3 клетки --- */
  function build() {
    board.innerHTML = '';
    board.appendChild(document.createElement('span')); // пустой угол

    for (let c = 0; c < 3; c++) {
      board.appendChild(makeArrow('↑', `Сдвинуть столбец ${c + 1} вверх`, { type: 'col', i: c, dir: 1 }, 'col'));
    }
    for (let r = 0; r < 3; r++) {
      board.appendChild(makeArrow('←', `Сдвинуть строку ${r + 1} влево`, { type: 'row', i: r, dir: 1 }, 'row'));
      cells[r] = [];
      for (let c = 0; c < 3; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        board.appendChild(cell);
        cells[r][c] = cell;
      }
    }
  }

  function makeArrow(label, aria, move, kind) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `arrow ${kind}`;
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', () => {
      if (busy) return;
      doMove(move, true);
    });
    arrowButtons.push(b);
    return b;
  }

  /* --- ходы --- */
  function applyMove({ type, i, dir }) {
    if (type === 'row') {
      const row = state[i];
      state[i] = dir > 0 ? [...row.slice(1), row[0]] : [row[2], ...row.slice(0, 2)];
    } else {
      const col = state.map((r) => r[i]);
      const shifted = dir > 0 ? [...col.slice(1), col[0]] : [col[2], ...col.slice(0, 2)];
      shifted.forEach((v, r) => { state[r][i] = v; });
    }
  }

  const inverse = (m) => ({ ...m, dir: -m.dir });

  function doMove(m, record) {
    applyMove(m);
    if (record) { history.push(m); moves++; }
    render();
  }

  function isSolved() {
    return state.every((row) => row.every((v) => v === row[0])) &&
      new Set(state.map((r) => r[0])).size === 3;
  }

  /* --- отображение --- */
  function render() {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells[r][c].className = `cell ${state[r][c]}`;
      }
    }
    const solved = isSolved();
    root.classList.toggle('solved', solved);
    if (solved) {
      status.textContent = moves > 0 ? 'Готово! Кубик собран и счастлив.' : 'Кубик собран. Попробуй его перемешать.';
    } else {
      status.textContent = 'Помоги мне собраться…';
    }
  }

  function setBusy(v) {
    busy = v;
    btnScramble.disabled = v;
    btnSolve.disabled = v;
    arrowButtons.forEach((b) => { b.disabled = v; });
  }

  /* --- перемешать --- */
  function randomMove() {
    return {
      type: Math.random() < 0.5 ? 'row' : 'col',
      i: Math.floor(Math.random() * 3),
      dir: Math.random() < 0.5 ? 1 : -1,
    };
  }

  function scramble(count = 10) {
    setBusy(true);
    let n = 0;
    const timer = setInterval(() => {
      doMove(randomMove(), true);
      n++;
      if (n >= count) {
        clearInterval(timer);
        if (isSolved()) { doMove({ type: 'row', i: 0, dir: 1 }, true); }
        setBusy(false);
      }
    }, 110);
  }

  /* --- собрать: отматываем историю в обратную сторону --- */
  function solve() {
    if (isSolved()) { history = []; moves = 0; render(); return; }
    setBusy(true);
    const timer = setInterval(() => {
      const last = history.pop();
      if (!last) {
        clearInterval(timer);
        state = SOLVED();
        moves = 0;
        setBusy(false);
        render();
        return;
      }
      doMove(inverse(last), false);
      if (history.length === 0) {
        clearInterval(timer);
        moves = 0;
        setBusy(false);
        render();
      }
    }, 90);
  }

  btnScramble.addEventListener('click', () => { moves = 0; history = []; scramble(); });
  btnSolve.addEventListener('click', solve);

  build();
  render();
  // к приходу посетителя кубик уже перемешан
  setTimeout(() => scramble(8), 900);
})();
