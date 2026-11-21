// Shared helpers for the three design demos. Each demo styles the markup with its own CSS.
(function () {
  const FC = window.FC;
  const map = Object.fromEntries(FC.venues.map(v => [v.id, v]));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TIER = { core: '核心', detour: '顺路', nightcap: '酒吧 / 早午餐', extended: '补充' };

  function spiceLevel(v) {
    const s = (v.spice || '').toLowerCase();
    if (/max|very hot|gila|hot|nashville/.test(s) || /nashville/i.test(v.style)) return 3;
    if (/medium|selectable/.test(s)) return 2;
    return 1;
  }
  function halalLabel(v) {
    const h = (v.halal || '').toLowerCase();
    if (h.startsWith('certified')) return h.includes('rivervale') ? 'Halal 认证（仅 Rivervale）' : 'Halal 认证';
    if (h.startsWith('options')) return '有 halal 选项';
    if (h.includes('claimed')) return '店家称 halal';
    return '';
  }
  function styleGroup(v) {
    const s = v.style.toLowerCase();
    if (s.includes('korean')) return 'korean';
    if (s.includes('nashville')) return 'nashville';
    if (s.includes('indonesian') || s.includes('ayam')) return 'indo';
    return 'other';
  }
  function closedDay(v) {
    const m = (v.hours || '').match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(?:likely\s+)?closed/);
    const zh = { Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六', Sun: '周日' };
    return m ? zh[m[1]] + '休' : '';
  }

  const FILTERS = [
    { key: 'all', label: '全部', test: () => true },
    { key: 'core', label: '核心 7 家', test: v => v.tier === 'core' },
    { key: 'spicy', label: '想吃辣', test: v => spiceLevel(v) === 3 },
    { key: 'korean', label: '韩式', test: v => styleGroup(v) === 'korean' },
    { key: 'group', label: '多人', test: v => v.groupFriendly },
    { key: 'late', label: '晚一点', test: v => v.lateNight },
    { key: 'budget', label: '便宜', test: v => v.priceFrom <= 15 },
    { key: 'halal', label: 'Halal', test: v => /certified|options|claimed/i.test(v.halal || '') },
  ];

  function linkBtns(v, cls) {
    const out = [`<a class="${cls} primary" href="${esc(v.maps)}" target="_blank" rel="noopener">打开 Google Maps</a>`];
    if (v.website) out.push(`<a class="${cls}" href="${esc(v.website)}" target="_blank" rel="noopener">官网</a>`);
    if (v.instagram) out.push(`<a class="${cls}" href="${esc(v.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
    return out.join('');
  }

  // Semantic detail markup; each design styles .dt-* classes.
  function detailHTML(v) {
    const imgs = [v.image, ...(v.imageGallery || [])].filter(Boolean);
    const gallery = imgs.length
      ? `<div class="dt-gallery">${imgs.map(s => `<img src="${esc(s)}" alt="${esc(v.name)}">`).join('')}</div>` +
        (v.imageKind === 'map' ? '<p class="dt-note">地图位置 · 暂无店家照片</p>' : '')
      : `<div class="dt-noimg">暂无照片 · 到店补拍</div>`;
    const hours = (v.hours || '').split(/;\s*|\.\s+(?=[A-Z])/).map(h => `<li>${esc(h)}</li>`).join('');
    const tags = [v.styleZh, v.suburb, TIER[v.tier], v.chain ? '本地连锁' : '', halalLabel(v)].filter(Boolean);
    const rating = v.rating && v.rating.value ? `<p class="dt-rating">${esc(v.rating.source)} · ${esc(v.rating.value)}</p>` : '';
    const sources = (v.sources || []).map((s, i) => `<a href="${esc(s)}" target="_blank" rel="noopener">来源 ${i + 1}</a>`).join(' · ');
    return `
      ${gallery}
      <div class="dt-body">
        <p class="dt-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>
        <h2 class="dt-name">${esc(v.name)}</h2>
        <p class="dt-zh">${esc(v.nameZh)}</p>
        <p class="dt-why">${esc(v.why)}</p>
        <div class="dt-actions">${linkBtns(v, 'dt-btn')}</div>
        <div class="dt-grid">
          <div><h3>人均</h3><p>${esc(v.price)}</p></div>
          <div><h3>辣度</h3><p>${'●'.repeat(spiceLevel(v))}${'○'.repeat(3 - spiceLevel(v))} <small>${esc(v.spice)}</small></p></div>
        </div>
        <h3>必点</h3><ul class="dt-list">${v.signature.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <h3>注意</h3><p class="dt-watch">${esc(v.watch)}</p>
        <h3>营业时间</h3><ul class="dt-hours">${hours}</ul>
        <h3>地址</h3><p>${esc(v.address)}</p>
        ${(v.otherLocations || []).length ? `<p class="dt-small">其他门店：${v.otherLocations.map(esc).join('；')}</p>` : ''}
        ${rating}
        <p class="dt-small">图片：${esc(v.imageCredit || '—')}<br>${sources}</p>
      </div>`;
  }

  // Bottom sheet: needs #sheet > .sheet-panel > .sheet-content, plus #sheet .sheet-close
  function initSheet() {
    const sheet = document.getElementById('sheet');
    const content = sheet.querySelector('.sheet-content');
    const close = () => { sheet.classList.remove('open'); document.body.style.overflow = ''; };
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.sheet-close')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open]');
      if (!t) return;
      e.preventDefault();
      const v = map[t.dataset.open];
      if (!v) return;
      content.innerHTML = detailHTML(v);
      sheet.querySelector('.sheet-panel').scrollTop = 0;
      sheet.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  window.FCX = { FC, map, esc, TIER, FILTERS, spiceLevel, halalLabel, styleGroup, closedDay, detailHTML, linkBtns, initSheet };
})();
