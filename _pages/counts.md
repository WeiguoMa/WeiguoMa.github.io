---
layout: page
title: Counts
cover_image: /assets/image/sec_bg.svg
permalink: /counts/
---

<!-- 访问计数徽章（“本页访问数”）会插到 #gc-stats 容器里 -->
<div style="margin:1rem 0">
  <strong>Website visit count：</strong>
  <span id="gc-stats"></span>
</div>

<script>
  // Render helper
  function renderCount(n, note) {
    var el = document.getElementById('gc-stats');
    if (!el) return;
    el.textContent = (typeof n === 'number' ? n : '—') + (note ? ' ' + note : '');
  }

  // Resolve GoatCounter path consistently with count.js logic
  function gcPath() {
    if (window.goatcounter && window.goatcounter.get_data) {
      return window.goatcounter.get_data()['p'];
    }
    // Fallback: normalize trailing slash
    var p = location.pathname;
    if (!p.endsWith('/')) p += '/';
    return p;
  }

  (async function () {
    // 1) Try JSON API (requires enabling: Settings → "Allow adding a visitor count on your website")
    try {
      var path = encodeURIComponent(gcPath());
      var res = await fetch('https://reviving2death.goatcounter.com/counter/' + path + '.json', { credentials: 'omit' });
      if (res.ok) {
        var data = await res.json();
        return renderCount(data.count);
      }
      // If 403/404, fall through to visit_count badge as a fallback
    } catch (e) {
      // ignore and fallback
    }

    // 2) Fallback: use built-in badge via visit_count(), when available
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (window.goatcounter && window.goatcounter.visit_count) {
        clearInterval(t);
        window.goatcounter.visit_count({
          append: '#gc-stats',
          type: 'html',
          no_branding: true,
          // path: '/counts/', // uncomment to force a fixed path
        });
      } else if (tries > 100) { // ~10s timeout
        clearInterval(t);
        renderCount(null, '(unavailable)');
      }
    }, 100);
  })();
</script>

<!-- GoatCounter 主脚本（官方推荐的集成方式） -->
<script data-goatcounter="https://reviving2death.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
