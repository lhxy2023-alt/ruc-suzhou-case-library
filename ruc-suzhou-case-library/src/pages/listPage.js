import { formatDate } from "../utils/formatters.js";

function renderCaseCard(item) {
  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__header">
        <div class="school-logo">${item.logoText}</div>
        <div class="case-card__title-group">
          <h3>${item.offerSchool}</h3>
          <p>${item.offerProgram}</p>
        </div>
        <span class="disclosure">查看</span>
      </div>
      <div class="tag-row">
        ${item.badgeLabels.map((tag) => `<span class="pill pill--accent">${tag}</span>`).join("")}
      </div>
      <div class="meta-stack">
        <div class="meta-line">
          <span class="meta-label">学生背景</span>
          <span>${item.undergraduateSchool} / ${item.undergraduateMajor} / ${item.gpaOrAverage}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">经历摘要</span>
          <span>${item.experienceSummary}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">录取时间</span>
          <span>${formatDate(item.offerDate)}</span>
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
    return `<div class="filter-summary">当前展示全部案例，已内置 25Fall / 26Fall 两届 offer。</div>`;
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
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "资讯" },
  ];

  return `
    <header class="hero">
      <div class="status-bar">
        <span>案例库</span>
        <span>i乐湖前台原型</span>
      </div>
      <div class="hero__copy">
        <p class="eyebrow">人大中法升学案例库</p>
        <h1>像真实运营中的小程序前台一样展示 offer 案例</h1>
      </div>
      <label class="search-box">
        <span class="search-box__icon">搜</span>
        <input id="searchInput" type="search" value="${state.query}" placeholder="搜索学校 / 项目 / 背景关键词" />
      </label>
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
            <section class="section-header">
              <div>
                <h2>真实案例库</h2>
                <p>12 条案例，覆盖商科 / 金融 / 经济 / 计算机 / AI / 国际汉教。</p>
              </div>
              <span class="section-count">${cases.length} 条</span>
            </section>
            <section class="card-list">
              ${cases.map(renderCaseCard).join("") || `<div class="empty-card">暂无匹配案例，请放宽筛选条件。</div>`}
            </section>
          `
          : `
            <section class="section-header">
              <div>
                <h2>资讯精选</h2>
                <p>轻量占位页，但维持与案例页一致的运营感。</p>
              </div>
              <span class="section-count">${articles.length} 篇</span>
            </section>
            <section class="news-list">
              ${articles.map(renderArticleCard).join("")}
            </section>
          `
      }
      <section class="footer-cta">
        <div>
          <p class="footer-cta__eyebrow">咨询入口</p>
          <h3>不知道自己适合哪条路径？先做一次升学诊断。</h3>
        </div>
        <button class="primary-btn">添加企微领取方案</button>
      </section>
    </main>
  `;
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
