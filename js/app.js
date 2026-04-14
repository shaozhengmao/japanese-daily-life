/* ═══════════════════════════════════════════════════════════════
   生活情境日语图解大百科 · 学习平台 · 主逻辑
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── 全局状态 ──────────────────────────────────────────────────────────────────
let allTracks   = [];   // 完整索引数据
let fullData    = {};   // id → 详情数据（懒加载）
let filtered    = [];   // 当前筛选结果
let activeCategory = 'all';
let searchQuery    = '';
let fullDataLoaded = false;

// ── DOM 引用 ──────────────────────────────────────────────────────────────────
const cardGrid       = document.getElementById('cardGrid');
const searchInput    = document.getElementById('searchInput');
const clearSearch    = document.getElementById('clearSearch');
const categoryFilters= document.getElementById('categoryFilters');
const resultBar      = document.getElementById('resultBar');
const headerStats    = document.getElementById('headerStats');
const modalOverlay   = document.getElementById('modalOverlay');
const modalBody      = document.getElementById('modalBody');
const emptyState     = document.getElementById('emptyState');
const backTop        = document.getElementById('backTop');

// ── 初始化 ────────────────────────────────────────────────────────────────────
async function init() {
  try {
    // 并行加载索引 + 完整数据
    const [indexRes, fullRes] = await Promise.all([
      fetch('data/tracks_index.json'),
      fetch('data/tracks_full.json'),
    ]);
    allTracks = await indexRes.json();

    // 构建 id → 详情 映射
    const fullArr = await fullRes.json();
    fullArr.forEach(t => { fullData[t.id] = t; });
    fullDataLoaded = true;

    buildCategoryFilters();
    updateHeaderStats();
    applyFilters();
  } catch (err) {
    cardGrid.innerHTML = `<div class="loading-state">
      <p style="color:#e63946">⚠️ 数据加载失败，请确认 data/ 目录存在。<br><small>${err.message}</small></p>
    </div>`;
  }
}

// ── 分类按钮 ──────────────────────────────────────────────────────────────────
function buildCategoryFilters() {
  const cats = ['all', ...new Set(allTracks.map(t => t.category))];
  const counts = {};
  allTracks.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });

  categoryFilters.innerHTML = cats.map(cat => {
    const label = cat === 'all' ? '全部' : cat;
    const count = cat === 'all' ? allTracks.length : (counts[cat] || 0);
    return `<button class="filter-btn ${cat === 'all' ? 'active' : ''}"
              data-cat="${cat}"
              onclick="setCategory('${cat}')">
              ${label} <span style="opacity:.6">${count}</span>
            </button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  applyFilters();
}

// ── 搜索 ──────────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  applyFilters();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  applyFilters();
  searchInput.focus();
});

// ── 筛选逻辑 ──────────────────────────────────────────────────────────────────
function applyFilters() {
  filtered = allTracks.filter(t => {
    const catOk = activeCategory === 'all' || t.category === activeCategory;
    if (!catOk) return false;
    if (!searchQuery) return true;

    const haystack = [
      t.title, t.topic, t.category, t.preview,
      String(t.id).padStart(3, '0'),
    ].join(' ').toLowerCase();
    return haystack.includes(searchQuery);
  });

  renderCards();
  updateResultBar();
}

function resetFilters() {
  searchInput.value = '';
  searchQuery = '';
  setCategory('all');
}
window.resetFilters = resetFilters;

// ── 渲染卡片 ──────────────────────────────────────────────────────────────────
function renderCards() {
  if (filtered.length === 0) {
    cardGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const q = searchQuery;
  cardGrid.innerHTML = filtered.map(t => {
    const numStr = String(t.id).padStart(3, '0');
    const dur = t.duration > 0 ? `🎵 ${t.duration.toFixed(0)}秒` : '🎵 音频';
    const preview = t.preview ? escHtml(t.preview).slice(0, 40) : '';

    // 提取中文标题和日文标题
    const titleParts = splitTitle(t.title);

    return `<div class="track-card" onclick="openModal(${t.id})" tabindex="0"
                 onkeydown="if(event.key==='Enter')openModal(${t.id})">
      <div class="card-header">
        <span class="track-num">Track ${numStr}</span>
        <span class="cat-tag">${escHtml(t.category)}</span>
      </div>
      <div class="card-title">
        ${highlight(titleParts.zh || t.title, q)}
        ${titleParts.ja ? `<span class="ja">${highlight(titleParts.ja, q)}</span>` : ''}
      </div>
      ${preview ? `<div class="card-preview">${highlight(preview, q)}</div>` : ''}
      <div class="card-footer">
        <span class="duration-badge">${dur}</span>
        <span class="play-hint">▶ 点击学习</span>
      </div>
    </div>`;
  }).join('');
}

// 拆分标题：括号内为中文，括号外为日文（或反之）
function splitTitle(title) {
  // 格式1: 日文（中文）
  const m1 = title.match(/^(.+?)（(.+?)）/);
  if (m1) return { ja: m1[1].trim(), zh: m1[2].trim() };
  // 格式2: 中文 (日文)
  const m2 = title.match(/^(.+?)\s*\((.+?)\)/);
  if (m2) return { zh: m2[1].trim(), ja: m2[2].trim() };
  // 纯中文
  if (/[\u4e00-\u9fff]/.test(title)) return { zh: title, ja: '' };
  return { zh: '', ja: title };
}

// ── 搜索高亮 ──────────────────────────────────────────────────────────────────
function highlight(text, query) {
  if (!query || !text) return escHtml(text);
  const escaped = escRegex(query);
  return escHtml(text).replace(new RegExp(escRegex(escHtml(query)), 'gi'),
    m => `<mark>${m}</mark>`);
}

// ── 统计栏 ────────────────────────────────────────────────────────────────────
function updateResultBar() {
  const total = allTracks.length;
  const shown = filtered.length;
  if (searchQuery || activeCategory !== 'all') {
    resultBar.textContent = `找到 ${shown} / ${total} 条结果`;
  } else {
    resultBar.textContent = `共 ${total} 课，涵盖 210 个音频主题`;
  }
}

function updateHeaderStats() {
  const cats = new Set(allTracks.map(t => t.category)).size;
  headerStats.innerHTML = `
    <span class="stat-badge">📚 ${allTracks.length} 课</span>
    <span class="stat-badge">🗂 ${cats} 分类</span>
    <span class="stat-badge">🎵 210 音频</span>
  `;
}

// ── 弹窗 ──────────────────────────────────────────────────────────────────────
async function openModal(id) {
  const track = fullData[id] || allTracks.find(t => t.id === id);
  if (!track) return;

  modalBody.innerHTML = renderModalContent(track);
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // 激活第一个 tab
  switchTab('table');
}
window.openModal = openModal;

function closeModal(e) {
  if (e && e.target !== modalOverlay) return;
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  // 停止音频
  const audio = document.querySelector('.modal audio');
  if (audio) { audio.pause(); audio.currentTime = 0; }
}
window.closeModal = closeModal;

function renderModalContent(t) {
  const numStr = String(t.id).padStart(3, '0');
  const titleParts = splitTitle(t.title);
  const audioPath = t.audio || `audio/Track ${numStr}.mp3`;

  // 三栏表格（处理多词汇用顿号分隔的情况）
  const tableRows = generateTableRows(t.table);

  // 词汇表
  const vocabRows = (t.vocab || []).map(v => `
    <tr>
      <td><span class="vocab-word">${escHtml(v.word)}</span></td>
      <td style="color:var(--text3);font-style:italic;font-size:.82rem">${escHtml(v.romaji)}</td>
      <td><span class="vocab-pos">${escHtml(v.pos)}</span></td>
      <td>${escHtml(v.meaning)}</td>
    </tr>`).join('');

  // 对话
  const dialogHtml = (t.dialog || []).length > 0
    ? `<div class="dialog-list">${(t.dialog).map(d => `
        <div class="dialog-item">
          <span class="dialog-speaker">${escHtml(d.speaker)}</span>
          <span class="dialog-text">${escHtml(d.text)}</span>
        </div>`).join('')}</div>`
    : '<p style="color:var(--text3);font-size:.88rem">暂无对话内容</p>';

  // 文化注释
  const cultureHtml = t.culture
    ? `<div class="culture-box">${formatCultureText(t.culture)}</div>`
    : '<p style="color:var(--text3);font-size:.88rem">暂无文化注释</p>';

  return `
    <div class="modal-track-num">Track ${numStr}</div>
    <div class="modal-title">
      ${escHtml(titleParts.zh || t.title)}
      ${titleParts.ja ? `<span class="ja">${escHtml(titleParts.ja)}</span>` : ''}
    </div>
    <div class="modal-cat">🗂 ${escHtml(t.category)}${t.duration > 0 ? ` · 🎵 ${t.duration.toFixed(0)}秒` : ''}</div>

    <!-- 音频播放器 -->
    <div class="audio-player">
      <audio controls preload="none" src="${escHtml(audioPath)}">
        您的浏览器不支持 audio 标签。
      </audio>
      <p class="audio-note">💡 若音频无法播放，请确认 audio/ 目录中存在对应 MP3 文件。</p>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="table"  onclick="switchTab('table')">三栏对照</button>
      <button class="tab-btn"        data-tab="vocab"  onclick="switchTab('vocab')">词汇注释</button>
      <button class="tab-btn"        data-tab="dialog" onclick="switchTab('dialog')">实用对话</button>
      <button class="tab-btn"        data-tab="culture"onclick="switchTab('culture')">文化背景</button>
    </div>

    <div class="tab-panel active" id="tab-table">
      <div class="table-wrap">
        <table class="sanlan-table">
          <thead><tr>
            <th>日语原文</th>
            <th>🔤 罗马音</th>
            <th>🇨🇳 中文翻译</th>
          </tr></thead>
          <tbody>${tableRows || '<tr><td colspan="3" style="color:var(--text3);text-align:center;padding:1rem">暂无数据</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="tab-panel" id="tab-vocab">
      <div class="table-wrap">
        <table class="vocab-table">
          <thead><tr><th>词汇</th><th>罗马音</th><th>词性</th><th>含义</th></tr></thead>
          <tbody>${vocabRows || '<tr><td colspan="4" style="color:var(--text3);text-align:center;padding:1rem">暂无词汇</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="tab-panel" id="tab-dialog">${dialogHtml}</div>
    <div class="tab-panel" id="tab-culture">${cultureHtml}</div>
  `;
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${name}`);
  });
}
window.switchTab = switchTab;

// ── 键盘关闭弹窗 ──────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── 回到顶部 ──────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  backTop.classList.toggle('hidden', window.scrollY < 400);
});

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 格式化文化背景文本（支持 Markdown 格式）
function formatCultureText(text) {
  if (!text) return '';

  // 先转义 HTML
  let result = escHtml(text);

  // 处理三级标题 ### 标题
  result = result.replace(/^###\s+(.+)$/gm, '<strong style="font-size:1rem;color:var(--text);display:block;margin-top:1rem;margin-bottom:.4rem">$1</strong>');

  // 处理二级标题 ## 标题
  result = result.replace(/^##\s+(.+)$/gm, '<strong style="font-size:1.1rem;color:var(--text);display:block;margin-top:1.2rem;margin-bottom:.5rem;border-bottom:1px solid var(--border);padding-bottom:.2rem">$1</strong>');

  // 处理一级标题 # 标题
  result = result.replace(/^#\s+(.+)$/gm, '<strong style="font-size:1.2rem;color:var(--red);display:block;margin-top:1.4rem;margin-bottom:.6rem">$1</strong>');

  // 处理无序列表 - 项目
  result = result.replace(/^-\s+(.+)$/gm, '<div style="margin-left:1.2rem;padding-left:.5rem;border-left:2px solid var(--red-light);margin-bottom:.3rem">$1</div>');

  // 处理有序列表 1. 项目
  result = result.replace(/^\d+\.\s+(.+)$/gm, '<div style="margin-left:1.2rem;padding-left:.5rem;border-left:2px solid var(--red-light);margin-bottom:.3rem">$1</div>');

  // 处理粗体 **文本**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 按双换行分割成段落，分别处理
  const paragraphs = result.split(/\n\n+/);
  const formattedParagraphs = paragraphs.map(para => {
    // 将段落内的单换行转换为 <br>
    const withBr = para.replace(/\n/g, '<br>');
    return `<p style="margin:0;margin-bottom:.6rem">${withBr}</p>`;
  });

  return formattedParagraphs.join('');
}

// 生成三栏表格行（处理多词汇用顿号/逗号分隔的情况）
function generateTableRows(table) {
  if (!table || table.length === 0) return '';

  // 检查是否是单条记录但包含多个用顿号/逗号分隔的词汇
  if (table.length === 1) {
    const row = table[0];
    // 使用更灵活的分隔符：顿号、逗号（可选空格）、或逗号+空格组合
    const jaItems = row.ja ? row.ja.split(/[、,]\s*/).filter(s => s.trim()) : [];
    const romaItems = row.romaji ? row.romaji.split(/[、,]\s*/).filter(s => s.trim()) : [];
    const zhItems = row.zh ? row.zh.split(/[、,]\s*/).filter(s => s.trim()) : [];

    // 如果检测到多条（至少2条），则按词汇分行显示
    if (jaItems.length >= 2 && jaItems.length === romaItems.length && jaItems.length === zhItems.length) {
      return jaItems.map((ja, i) => `
        <tr>
          <td class="td-ja">${escHtml(ja.trim())}</td>
          <td class="td-roma">${escHtml(romaItems[i]?.trim() || '')}</td>
          <td class="td-zh">${escHtml(zhItems[i]?.trim() || '')}</td>
        </tr>`).join('');
    }
  }

  // 正常情况：按行显示
  return table.map(row => `
    <tr>
      <td class="td-ja">${escHtml(row.ja)}</td>
      <td class="td-roma">${escHtml(row.romaji)}</td>
      <td class="td-zh">${escHtml(row.zh)}</td>
    </tr>`).join('');
}

function escRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── 启动 ──────────────────────────────────────────────────────────────────────
init();
