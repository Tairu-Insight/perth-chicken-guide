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
  ];

  function linkBtns(v, cls) {
    const out = [`<a class="${cls} primary" href="${esc(v.maps)}" target="_blank" rel="noopener">打开 Google Maps</a>`];
    if (v.website) out.push(`<a class="${cls}" href="${esc(v.website)}" target="_blank" rel="noopener">官网</a>`);
    if (v.instagram) out.push(`<a class="${cls}" href="${esc(v.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
    return out.join('');
  }

  // ---- detail helpers -------------------------------------------------

  function parseRating(v) {
    const r = v.rating;
    if (!r || !r.value) return null;
    const match = String(r.value).match(/(\d+(?:\.\d+)?)\s*\(([^)]+)\)/);
    if (!match) return null;
    const segments = String(r.value).split(/;|\//).map(s => s.trim());
    const segment = segments.find(s => s.includes(match[0])) || '';
    const before = segment.slice(0, segment.indexOf(match[0])).trim();
    let label = before.replace(/[^A-Za-z ]/g, '').trim();
    if (!label) label = String(r.source || '').split(/[/(]/)[0].trim();
    return { score: match[1], count: match[2].trim(), label: label || '评分' };
  }

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5-5.9-3.3-5.9 3.3 1.3-6.5L2.5 9.6l6.6-.8z"/></svg>';

  function ratingRow(v) {
    const r = parseRating(v);
    if (!r) return '<p class="dt-rating-row empty">暂无评分 · 可查 Google Maps</p>';
    const filled = Math.max(0, Math.min(5, Math.round(Number(r.score))));
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="dt-star${i < filled ? ' on' : ''}">${STAR}</span>`).join('');
    return `<p class="dt-rating-row"><span class="dt-stars">${stars}</span><b>${r.score}</b><span class="dt-rating-meta">${esc(r.count)} 条评分 · ${esc(r.label)}</span></p>`;
  }

  function formatClock(mins) {
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const suffix = h24 < 12 ? 'am' : 'pm';
    let h = h24 % 12;
    if (h === 0) h = 12;
    return `${h}${m ? ':' + String(m).padStart(2, '0') : ''}${suffix}`;
  }

  function formatRange(startText, endText) {
    const start = startText.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/i);
    const end = endText.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/i);
    if (!start || !end) return null;
    const sh = Number(start[1]);
    const sm = Number(start[2] || 0);
    const ss = (start[3] || '').toLowerCase();
    const eh = Number(end[1]);
    const em = Number(end[2] || 0);
    const es = (end[3] || '').toLowerCase();

    let startMins;
    if (ss === 'am') startMins = (sh % 12) * 60 + sm;
    else if (ss === 'pm') startMins = ((sh % 12) + 12) * 60 + sm;
    else if (sh === 12) startMins = 12 * 60 + sm;
    else if (sh >= 11) startMins = sh * 60 + sm;
    else startMins = (sh + 12) * 60 + sm;

    let endMins;
    if (es === 'am') {
      endMins = (eh % 12) * 60 + em;
      if (endMins < startMins) endMins += 24 * 60;
    } else if (es === 'pm') {
      endMins = ((eh % 12) + 12) * 60 + em;
      if (endMins < startMins) endMins += 24 * 60;
    } else if (eh === 12) {
      endMins = (startMins < 12 * 60 ? 12 : 24) * 60 + em;
    } else if (eh > startMins / 60) {
      endMins = (eh + (eh < 12 ? 12 : 0)) * 60 + em;
    } else if (eh === startMins / 60) {
      endMins = (eh + 12) * 60 + em;
    } else if (eh >= 5) {
      endMins = (eh + 12) * 60 + em;
    } else if (startMins < 15 * 60) {
      endMins = (eh + 12) * 60 + em;
    } else {
      endMins = (eh + 24) * 60 + em;
    }

    return `${formatClock(startMins)}–${formatClock(endMins)}`;
  }

  function formatTime(text) {
    return String(text).split(/(\s*&\s*|\s*,\s*)/).map(part => {
      if (!/\d/.test(part)) return part;
      const m = part.match(/^(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)$/i);
      if (!m) return part;
      const formatted = formatRange(m[1], m[2]);
      return formatted || part;
    }).join('');
  }

  function formatTimeLoose(text) {
    return String(text).replace(
      /(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)/gi,
      (all, a, b) => formatRange(a, b) || all
    );
  }

  function hoursBlock(hoursText) {
    const text = String(hoursText || '').trim();
    if (!text) return '<p class="dt-hours-plain">未提供</p>';
    if (/^check\s+google/i.test(text)) return '<p class="dt-hours-plain">请查 Google Maps</p>';

    const DAY = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:\s*[–-]\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))?(?:\s*&\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:\s*[–-]\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))?)*)\s+(.+)$/;
    const parts = text.split(/\s*;\s*|\.\s+(?=[A-Z][A-Za-z ]{1,20}:\s)/);
    const blocks = [];
    let current = { loc: '', rows: [] };

    for (const raw of parts) {
      let part = raw.trim();
      if (!part) continue;
      const loc = part.match(/^([A-Za-z][A-Za-z ]{1,20}):\s*(.*)$/);
      if (loc) {
        if (current.rows.length) blocks.push(current);
        current = { loc: loc[1].trim(), rows: [] };
        part = loc[2].trim();
      }
      const day = part.match(DAY);
      if (day) {
        let time = day[2].trim();
        let noteText = '';
        const note = time.match(/\(([^)]*)\)\s*$/);
        if (note) {
          noteText = note[1];
          time = time.slice(0, note.index).trim();
        }
        let formatted = formatTime(time);
        if (formatted === time) formatted = formatTimeLoose(time);
        if (noteText) formatted += ` (${noteText})`;
        current.rows.push({ day: day[1], time: formatted });
      } else {
        current.rows.push({ day: '', time: formatTimeLoose(part) });
      }
    }
    if (current.rows.length) blocks.push(current);

    const usable = blocks.filter(b => b.rows.some(r => r.day));
    if (!usable.length) return `<p class="dt-hours-plain">${esc(formatTimeLoose(text))}</p>`;

    return usable.map(b => `
      ${b.loc ? `<p class="dt-hours-loc">${esc(b.loc)}</p>` : ''}
      <div class="dt-hours">${b.rows.map(r => `<div class="dt-hour-row"><span class="dt-hour-day">${esc(r.day)}</span><span class="dt-hour-time">${esc(r.time)}</span></div>`).join('')}</div>
    `).join('');
  }

  function itemPrice(item, priceText) {
    const own = String(item).match(/A?\$\s?\d[\d.,–-]*/);
    if (own) return own[0];
    const mentions = [...String(priceText || '').matchAll(/(?:^|[;,])\s*([^;,]+?)\s+(A?\$\s?\d[\d.,–-]*)/g)];
    const words = String(item).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    for (const m of mentions) {
      const phrase = m[1].toLowerCase();
      if (words.some(w => phrase.includes(w))) return m[2];
    }
    return '';
  }

  function photoBlock(v, imgs) {
    if (!imgs.length) return '<div class="dt-noimg">暂无照片 · 到店补拍</div>';
    const main = `<button class="dt-photo-main" data-photo="0"><img src="${esc(imgs[0])}" alt="${esc(v.name)}">${imgs.length > 1 ? `<span class="dt-photo-count">查看全部 ${imgs.length} 张</span>` : ''}</button>`;
    const thumbs = imgs.slice(1, 4)
      .map((s, i) => `<button class="dt-photo-thumb" data-photo="${i + 1}"><img src="${esc(s)}" alt=""></button>`)
      .join('');
    return `<div class="dt-photos">${main}${thumbs ? `<div class="dt-photo-grid">${thumbs}</div>` : ''}</div>` +
      (v.imageKind === 'map' ? '<p class="dt-note">地图位置 · 暂无店家照片</p>' : '');
  }

  // Semantic detail markup; each design styles .dt-* classes.
  function detailHTML(v) {
    const imgs = [v.image, ...(v.imageGallery || [])].filter(Boolean);
    const tags = [v.styleZh, v.suburb, TIER[v.tier], v.chain ? '本地连锁' : ''].filter(Boolean);
    const sources = (v.sources || []).map((s, i) => `<a href="${esc(s)}" target="_blank" rel="noopener">来源 ${i + 1}</a>`).join(' · ');
    const priceHead = String(v.price || '').split(';')[0].replace(' pp', '').trim();
    return `
      ${photoBlock(v, imgs)}
      <div class="dt-body">
        <p class="dt-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>
        <h2 class="dt-name">${esc(v.name)}</h2>
        <p class="dt-zh">${esc(v.nameZh)}</p>
        ${ratingRow(v)}
        <p class="dt-why">${esc(v.why)}</p>
        <div class="dt-actions">${linkBtns(v, 'dt-btn')}</div>
        <div class="dt-grid">
          <div><h3>人均</h3><p>${esc(String(v.price).replace(' pp', ''))}</p></div>
          <div><h3>辣度</h3><p>${'●'.repeat(spiceLevel(v))}${'○'.repeat(3 - spiceLevel(v))} <small>${esc(v.spice)}</small></p></div>
        </div>
        <h3>必点${priceHead ? ` <span class="dt-item-note">人均 ${esc(priceHead)}</span>` : ''}</h3>
        <ul class="dt-list">${v.signature.map(s => {
          const price = itemPrice(s, v.price);
          return `<li><span>${esc(s)}</span>${price ? `<span class="dt-item-price">${esc(price)}</span>` : ''}</li>`;
        }).join('')}</ul>
        ${v.signature.some(s => !itemPrice(s, v.price)) ? '<p class="dt-price-note">未标价的菜品以店内菜单为准</p>' : ''}
        <h3>注意</h3><p class="dt-watch">${esc(v.watch)}</p>
        <h3>营业时间</h3>${hoursBlock(v.hours)}
        <h3>地址</h3><button class="dt-address" data-copy="${esc(v.address)}"><span>${esc(v.address)}</span><span class="dt-copy-label">复制</span></button>
        ${(v.otherLocations || []).length ? `<p class="dt-small">其他门店：${v.otherLocations.map(esc).join('；')}</p>` : ''}
        <p class="dt-small">${sources}</p>
      </div>`;
  }

  // Bottom sheet: needs #sheet > .sheet-panel > .sheet-content, plus #sheet .sheet-close
  function initSheet() {
    const sheet = document.getElementById('sheet');
    const content = sheet.querySelector('.sheet-content');
    const pv = document.getElementById('photo-view');
    let gallery = [];
    let photoIndex = 0;

    const close = () => { sheet.classList.remove('open'); document.body.style.overflow = ''; };

    const showPhoto = (i) => {
      if (!gallery.length || !pv) return;
      photoIndex = (i + gallery.length) % gallery.length;
      pv.querySelector('.pv-img').src = gallery[photoIndex];
      pv.querySelector('.pv-count').textContent = `${photoIndex + 1} / ${gallery.length}`;
    };
    const closePhotos = () => { if (pv) pv.classList.remove('open'); };

    if (pv) {
      pv.querySelector('.pv-close').addEventListener('click', closePhotos);
      pv.querySelector('.pv-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
      pv.querySelector('.pv-next').addEventListener('click', () => showPhoto(photoIndex + 1));
      pv.addEventListener('click', e => { if (e.target === pv) closePhotos(); });
      document.addEventListener('keydown', e => {
        if (!pv.classList.contains('open')) return;
        if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.stopImmediatePropagation();
          if (e.key === 'Escape') closePhotos();
          if (e.key === 'ArrowLeft') showPhoto(photoIndex - 1);
          if (e.key === 'ArrowRight') showPhoto(photoIndex + 1);
        }
      });
    }

    const copyText = async (text, button) => {
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
      if (!ok) {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '0';
        area.style.left = '0';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.focus();
        area.select();
        area.setSelectionRange(0, area.value.length);
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        area.remove();
      }
      const label = button.querySelector('.dt-copy-label');
      if (label) {
        label.textContent = ok ? '已复制' : '复制失败';
        setTimeout(() => { label.textContent = '复制'; }, 1400);
      }
    };

    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.sheet-close')) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !(pv && pv.classList.contains('open'))) close();
    });
    document.addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) {
        e.preventDefault();
        const v = map[open.dataset.open];
        if (!v) return;
        gallery = [v.image, ...(v.imageGallery || [])].filter(Boolean);
        content.innerHTML = detailHTML(v);
        sheet.querySelector('.sheet-panel').scrollTop = 0;
        sheet.classList.add('open');
        document.body.style.overflow = 'hidden';
        return;
      }

      const photo = e.target.closest('[data-photo]');
      if (photo && pv) {
        e.preventDefault();
        pv.classList.add('open');
        showPhoto(Number(photo.dataset.photo));
        return;
      }

      const copy = e.target.closest('[data-copy]');
      if (copy) {
        e.preventDefault();
        copyText(copy.dataset.copy, copy);
      }
    });
  }

  window.FCX = { FC, map, esc, TIER, FILTERS, spiceLevel, halalLabel, styleGroup, closedDay, detailHTML, linkBtns, initSheet };
})();
