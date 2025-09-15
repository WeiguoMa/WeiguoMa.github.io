// assets/terminal-tabs.js
(function () {
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  function parseLines(str) {
  try {
    return JSON.parse(str);
  } catch {
    return String(str)
      .split(/\r?\n\s*\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }
}

  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  function rngJitter(base, jitter=0.2){
    const d = base * jitter;
    return base + (Math.random()*2-1) * d;
  }

  async function typeLines(screen, lines, speed, jitter, statusEl){
    screen.textContent = ""; // clear
    statusEl.textContent = "streaming";
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (reduced) { screen.textContent += line + (li < lines.length-1 ? "\n" : ""); continue; }
      for (const ch of line) {
        screen.textContent += ch;
        screen.scrollTop = screen.scrollHeight;
        await sleep(rngJitter(speed, jitter));
      }
      if (li < lines.length-1) screen.textContent += "\n";
    }
    statusEl.textContent = "done";
  }

  function copyText(el){
    const ok = navigator.clipboard && navigator.clipboard.writeText;
    const text = el.textContent;
    if (ok) { navigator.clipboard.writeText(text); return true; }
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    return true;
  }

  function init(root){
    const header = $('.ttabs-header', root);
    const screen = $('#tscreen', root);
    const copyBtn = $('.tcopy', root);
    const resetBtn = $('.treset', root);
    const statusEl = $('.tlabel', root);
    const speed = Number(root.getAttribute('data-typing-speed')||28);
    const jitter = Number(root.getAttribute('data-token-jitter')||0.25);

    async function run(tabBtn){
      $$('.ttab', header).forEach(b=>{ b.classList.toggle('active', b===tabBtn); b.setAttribute('aria-selected', b===tabBtn); });
      const lines = parseLines(tabBtn.getAttribute('data-lines'));
      await typeLines(screen, lines, speed, jitter, statusEl);
    }

    header.addEventListener('click', (e)=>{
      const btn = e.target.closest('.ttab');
      if (!btn) return; run(btn);
    });

    copyBtn.addEventListener('click', ()=>{
      const ok = copyText(screen);
      statusEl.textContent = ok ? 'copied' : 'copy failed';
      setTimeout(()=> statusEl.textContent = 'ready', 1200);
    });

    resetBtn.addEventListener('click', ()=>{
      const active = $('.ttab.active', header) || $('.ttab', header);
      statusEl.textContent = 'reset';
      setTimeout(()=> run(active), 60);
    });

    // 初始渲染
    const first = $('.ttab.active', header) || $('.ttab', header);
    run(first);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    $$('.ttabs').forEach(init);
  });
})();
