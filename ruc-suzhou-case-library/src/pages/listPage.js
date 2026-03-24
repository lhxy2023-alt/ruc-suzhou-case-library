import { formatDate } from "../utils/formatters.js";

function renderCaseCard(item) {
  const background = [item.undergraduateSchool, item.undergraduateMajor, item.gpaOrAverage]
    .filter(Boolean)
    .join(" / ");
  const tags = [...item.badgeLabels, item.applicantType].filter(Boolean).slice(0, 4);

  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__meta-top">
        <span class="case-card__result">${item.pathType}</span>
        <span class="case-card__date">${formatDate(item.offerDate)}</span>
      </div>
      <div class="case-card__headline">
        <div class="school-logo">${item.logoText}</div>
        <div class="case-card__title-group">
          <h3>${item.offerSchool}</h3>
          <p>${item.offerProgram}</p>
        </div>
        <span class="disclosure">详情</span>
      </div>
      <div class="case-card__summary">
        <strong>${item.title}</strong>
        <span>${item.languageScores}</span>
      </div>
      <div class="tag-row tag-row--tight">
        ${tags.map((tag) => `<span class="pill pill--accent">${tag}</span>`).join("")}
      </div>
      <div class="meta-stack meta-stack--compact">
        <div class="meta-line">
          <span class="meta-label">学生背景</span>
          <span>${background}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">背景亮点</span>
          <span>${item.experienceSummary}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">适合人群</span>
          <span>${buildCaseFit(item)}</span>
        </div>
      </div>
    </button>
  `;
}

function renderFilterSummary(state) {
  const active = Object.entries(state.filters)
    .filter(([, value]) => value !== "全部")
    .map(([, value]) => value);

  if (!active.length) {
    return `<div class="filter-summary">默认展示全部案例，可按地区、专业、背景和路径快速缩小范围。</div>`;
  }

  return `<div class="filter-summary">已筛选：${active.map((item) => `<span class="pill">${item}</span>`).join("")}</div>`;
}

function renderArticleCard(item) {
  return `
    <article class="news-card">
      <div class="news-card__head">
        <span class="pill">${item.category}</span>
        <span>${item.readTime}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="news-card__foot">${item.publishDate}</div>
    </article>
  `;
}

export function renderListPage({ cases, articles, state, filterGroups }) {
  const featuredCases = cases.filter((item) => item.featured).slice(0, 3);
  const hotTags = ["25Fall", "26Fall", "431双线", "港新保底", "国际汉硕", "商科留学"];
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "资讯" },
  ];

  return `
    <header class="hero">
      <div class="status-bar status-bar--product">
        <span>i乐湖案例库</span>
        <span>近 30 天持续更新</span>
      </div>
      <label class="search-box">
        <span class="search-box__icon">搜</span>
        <input id="searchInput" type="search" value="${state.query}" placeholder="搜索学校、项目、路径关键词" />
      </label>
      <div class="search-note">
        <span>${cases.length || 12} 条在库案例</span>
        <span>热门方向：金融 / 商科 / 国际汉教 / AI</span>
      </div>
      <nav class="top-tabs" aria-label="顶部导航">
        ${tabs
          .map(
            (tab) => `
              <button
                class="top-tabs__item ${state.activeTab === tab.id ? "is-active" : ""}"
                data-action="switch-tab"
                data-tab="${tab.id}"
              >${tab.label}</button>
            `,
          )
          .join("")}
      </nav>
      <section class="hero-strip">
        <div>
          <strong>优先看同背景上岸路径</strong>
          <p>人大中法、法语背景、中外合办都可以直接筛到对应案例。</p>
        </div>
        <span class="hero-strip__badge">案例持续补充中</span>
      </section>
    </header>

    <main class="page-body">
      <section class="filter-bar">
        ${filterGroups
          .map(
            (group) => `
              <button
                class="filter-chip ${state.openFilterId === group.id ? "is-active" : ""}"
                data-action="toggle-filter"
                data-filter-id="${group.id}"
              >
                ${group.label}
                <span>${resolveFilterValue(group, state)}</span>
              </button>
            `,
          )
          .join("")}
      </section>
      ${renderFilterSummary(state)}
      ${
        state.activeTab === "cases"
          ? `
            <section class="ops-panel">
              <div class="ops-panel__row">
                <div>
                  <p class="ops-panel__label">本周热门标签</p>
                  <div class="tag-row tag-row--tight">
                    ${hotTags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
                  </div>
                </div>
                <div class="ops-panel__stat">
                  <strong>${cases.length}</strong>
                  <span>当前可看案例</span>
                </div>
              </div>
              <div class="ops-panel__featured">
                ${featuredCases
                  .map(
                    (item) => `
                      <button class="mini-link-card" data-action="open-case" data-case-id="${item.id}">
                        <strong>${item.offerSchool}</strong>
                        <span>${item.offerProgram}</span>
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            </section>
            <section class="card-list">
              ${cases.map(renderCaseCard).join("") || `<div class="empty-card">暂无匹配案例，请放宽筛选条件。</div>`}
            </section>
          `
          : `
            <section class="section-header">
              <div>
                <h2>资讯精选</h2>
                <p>围绕申请节奏、路径判断和案例复盘持续更新。</p>
              </div>
              <span class="section-count">${articles.length} 篇</span>
            </section>
            <section class="news-list">
              ${articles.map(renderArticleCard).join("")}
            </section>
          `
      }
      <section class="footer-cta footer-cta--list">
        <div>
          <p class="footer-cta__eyebrow">升学诊断</p>
          <h3>不知道该冲刺、双线还是保底？先领一版同背景方案。</h3>
        </div>
        <button class="primary-btn">添加顾问领取方案</button>
      </section>
    </main>
  `;
}

function buildCaseFit(item) {
  if (item.pathType === "双线") {
    return "适合想冲高排名，同时又想控制申请风险的同学";
  }
  if (item.pathType === "港新保底") {
    return "适合中段绩点、希望结果稳一点的学生";
  }
  if (item.category === "国际汉教") {
    return "适合不想考数学、重视语言与表达优势的学生";
  }
  if (item.category === "AI" || item.category === "计算机") {
    return "适合想把课程项目和技术经历做强叙事的同学";
  }
  return "适合想优先看同背景申请结果与准备节奏的学生";
}

function resolveFilterValue(group, state) {
  if (group.id === "region") {
    return state.filters.region;
  }
  if (group.id === "category") {
    return state.filters.category;
  }
  if (group.id === "background") {
    return state.filters.undergraduateBackgroundTag;
  }
  if (group.id === "more") {
    const items = [state.filters.intake, state.filters.pathType, state.filters.tags].filter((item) => item !== "全部");
    return items[0] || "更多";
  }
  return "全部";
}
