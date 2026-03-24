function metaLine(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="meta-line">
      <span class="meta-label">${label}</span>
      <span>${value}</span>
    </div>
  `;
}

function renderCaseCard(item) {
  const background = [item.undergradSchool, item.undergradMajor, item.gpa].filter(Boolean).join(" / ");

  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__meta-top">
        <span class="case-card__result">${item.applicationSeason}</span>
        <span class="case-card__date">${item.studentNameMasked}</span>
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
        <strong>${item.listTitle}</strong>
        ${item.scoreList.length ? `<span>${item.scoreList.join(" / ")}</span>` : ""}
      </div>
      <div class="meta-stack meta-stack--compact">
        ${metaLine("学生背景", background)}
        ${metaLine("录取结果", `${item.offerSchool} / ${item.offerProgram}`)}
        ${metaLine("项目说明", item.description)}
      </div>
    </button>
  `;
}

function renderFilterSummary(state) {
  const active = Object.values(state.filters).filter((value) => value !== "全部");

  if (!active.length) {
    return `<div class="filter-summary">当前展示 25Fall / 26Fall 全部真实 offer，可按申请季、本科学校、本科专业和录取院校筛选。</div>`;
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
  const featuredCases = cases.slice(0, 3);
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "资讯" },
  ];

  return `
    <header class="hero">
      <div class="status-bar status-bar--product">
        <span>i乐湖案例库</span>
        <span>真实 Base 口径</span>
      </div>
      <label class="search-box">
        <span class="search-box__icon">搜</span>
        <input id="searchInput" type="search" value="${state.query}" placeholder="搜索学校、专业、成绩、录取项目" />
      </label>
      <div class="search-note">
        <span>${cases.length} 条真实 offer</span>
        <span>数据来源：25Fall / 26Fall 飞书多维表格</span>
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
          <strong>按真实字段看案例</strong>
          <p>优先看本科学校、本科专业、GPA/均分、语言成绩和录取结果，不再沿用旧 demo 口径。</p>
        </div>
        <span class="hero-strip__badge">空字段不展示</span>
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
                <span>${state.filters[group.field]}</span>
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
                  <p class="ops-panel__label">当前前台主字段</p>
                  <div class="tag-row tag-row--tight">
                    ${["申请季", "本科学校", "本科专业", "GPA/均分", "语言成绩", "录取院校", "录取专业"]
                      .map((tag) => `<span class="pill">${tag}</span>`)
                      .join("")}
                  </div>
                </div>
                <div class="ops-panel__stat">
                  <strong>${cases.length}</strong>
                  <span>当前可看 offer</span>
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
          <p class="footer-cta__eyebrow">案例说明</p>
          <h3>前台仅展示真实 offer 与轻量派生字段，后台运营字段默认不出现在这里。</h3>
        </div>
        <button class="primary-btn">联系顾问获取同背景案例</button>
      </section>
    </main>
  `;
}
