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

  async function typeLines(screen, lines, speed, jitter, statusEl, isCanceled, align) {
    screen.innerHTML = "";                // 用 innerHTML 清空，后面我们插入节点
    if (statusEl) statusEl.textContent = "streaming";
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let li = 0; li < lines.length; li++) {
      if (isCanceled && isCanceled()) return;

      const line = String(lines[li]);

      const lineEl = document.createElement("div");
      lineEl.style.whiteSpace = "pre";
      lineEl.style.textAlign = (align === "center") ? "center" : "left";
      screen.appendChild(lineEl);

      if (reduced) {
        lineEl.textContent = line;
      } else {
        for (const ch of line) {
          if (isCanceled && isCanceled()) return;
          lineEl.textContent += ch;
          screen.scrollTop = screen.scrollHeight;
          await sleep(rngJitter(speed, jitter));
        }
      }
    }

    if (statusEl) statusEl.textContent = "done";
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
    const $ = (sel, el=document) => el.querySelector(sel);
    const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

    const header = $('.ttabs-header', root);
    const screen = $('#tscreen', root);
    const copyBtn = $('.tcopy', root);
    const resetBtn = $('.treset', root);
    const statusEl = $('.tlabel', root);
    const speed = Number(root.getAttribute('data-typing-speed')||28);
    const jitter = Number(root.getAttribute('data-token-jitter')||0.25);

    // --- 并发控制：当前任务 token + 轻度防抖 ---
    let currentToken = 0;
    let lastClickTs = 0;
    const CLICK_COOLDOWN = 120; // ms

    function parseLines(str) {
      try { return JSON.parse(str); } catch {
        // 非 JSON：按空行拆段
        return String(str).split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
      }
    }

    function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
    function rngJitter(base, j=0.2){ const d = base*j; return base + (Math.random()*2-1)*d; }

    async function typeLines(screen, lines, speed, jitter, statusEl, isCanceled){
      screen.textContent = ""; // clear
      statusEl.textContent = "streaming";
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      for (let li = 0; li < lines.length; li++) {
        if (isCanceled && isCanceled()) {
          return;
        }
        const line = lines[li];
        if (reduced) {
          screen.textContent += line + (li < lines.length-1 ? "\n\n" : "");
          continue;
        }
        for (const ch of line) {
          if (isCanceled && isCanceled()) {
          return;
        }
          screen.textContent += ch;
          screen.scrollTop = screen.scrollHeight;
          await sleep(rngJitter(speed, jitter));
        }
        if (li < lines.length-1) screen.textContent += "\n\n"; // 段落之间空一行
      }
      statusEl.textContent = "done";
    }

    async function run(tabBtn){
      const now = Date.now();
      if (now - lastClickTs < CLICK_COOLDOWN) return;
      lastClickTs = now;

      $$('.ttab', header).forEach(b=>{
        b.classList.toggle('active', b===tabBtn);
        b.setAttribute('aria-selected', b===tabBtn ? 'true' : 'false');
      });

      const lines = parseLines(tabBtn.getAttribute('data-lines') || "");
      const myToken = ++currentToken; // 生成新任务 token

      const align = tabBtn.getAttribute('data-align') || 'left';
      screen.style.textAlign = (align === 'center') ? 'center' : 'left';
      await typeLines(screen, lines, speed, jitter, statusEl, () => myToken !== currentToken, align);
    }

    header.addEventListener('click', (e)=>{
      const btn = e.target.closest('.ttab');
      if (!btn) return;
      run(btn);
    });

    copyBtn?.addEventListener('click', ()=>{
      const ok = navigator.clipboard && navigator.clipboard.writeText;
      const text = screen.textContent;
      if (ok) navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
      }
      statusEl.textContent = 'copied';
      setTimeout(()=> statusEl.textContent = 'ready', 1200);
    });

    resetBtn?.addEventListener('click', ()=>{
      statusEl.textContent = 'reset';
      const active = $('.ttab.active', header) || $('.ttab', header);
      setTimeout(()=> run(active), 60);
    });

    // 初始渲染
    const first = $('.ttab.active', header) || $('.ttab', header);
    if (first) run(first);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    $$('.ttabs').forEach(init);
  });
})();
