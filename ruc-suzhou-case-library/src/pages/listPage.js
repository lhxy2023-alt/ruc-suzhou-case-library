import { pageConfig } from "../data/index.js";

function buildProgramFilterLabel(state, filterGroups) {
  const group = filterGroups.find((item) => item.id === "program");

  if (state.filters.undergradSchool === "全部") {
    return "全部";
  }

  const section = group?.sections?.find((item) => item.schoolValue === state.filters.undergradSchool);
  if (!section) {
    return "全部";
  }

  if (state.filters.undergradMajor === "全部") {
    return `${section.title}·全部`;
  }

  return `${section.title}·${state.filters.undergradMajor}`;
}

function buildBackgroundLine(item) {
  return [item.undergradSchoolLabel, item.undergradMajor, item.gpa].filter(Boolean).join(" / ");
}

function buildScoreLine(item) {
  return item.scoreList.join(" / ");
}

function renderCaseCard(item) {
  const scoreLine = buildScoreLine(item);

  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__top">
        <span class="pill pill--season">${item.applicationSeason}</span>
      </div>
      <div class="case-card__body">
        <div class="school-badge" aria-hidden="true">${item.logoText}</div>
        <div class="case-card__content">
          <h3>${item.listTitle}</h3>
          <div class="case-card__line">
            <span class="case-card__icon">学</span>
            <span>${buildBackgroundLine(item)}</span>
          </div>
          ${
            scoreLine
              ? `
                <div class="case-card__line">
                  <span class="case-card__icon">分</span>
                  <span>${scoreLine}</span>
                </div>
              `
              : ""
          }
        </div>
      </div>
    </button>
  `;
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

export function renderListContent({ cases, articles, state }) {
  if (state.activeTab === "articles") {
    return `
      <section class="section-header">
        <div>
          <h2>${pageConfig["articles.sectionTitle"] || "乐湖专访"}</h2>
          <p>${pageConfig["articles.sectionDescription"] || "后续用于承接 i乐湖 公众号内的学员专访内容。"}</p>
        </div>
        <span class="section-count">${articles.length} 篇</span>
      </section>
      <section class="news-list">
        ${articles.map(renderArticleCard).join("")}
      </section>
    `;
  }

  return `
    <section class="card-list">
      ${cases.length ? cases.map(renderCaseCard).join("") : `<div class="empty-card">暂无匹配案例，请放宽筛选条件。</div>`}
    </section>
  `;
}

export function renderListPage({ cases, articles, state, filterGroups }) {
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "专访" },
  ];

  const displayFilters = {
    ...state.filters,
    undergradProgram: buildProgramFilterLabel(state, filterGroups),
  };

  return `
    <header class="hero hero--brand">
      <div class="hero-brand">
        <p class="hero-brand__eyebrow">${pageConfig["home.heroEyebrow"] || "i乐湖"}</p>
        <h1>${pageConfig["home.heroTitle"] || "i乐湖案例库"}</h1>
      </div>
      <label class="search-box">
        <span class="search-box__icon">搜</span>
        <input
          id="searchInput"
          type="search"
          value="${state.query}"
          placeholder="${pageConfig["home.searchPlaceholder"] || "搜索学校、专业、成绩、国家（地区）"}"
          autocomplete="off"
          spellcheck="false"
        />
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
      ${
        state.activeTab === "cases"
          ? `
            <section class="filter-bar">
              ${filterGroups
                .map(
                  (group) => `
                    <button
                      class="filter-chip ${state.openFilterId === group.id ? "is-active" : ""}"
                      data-action="toggle-filter"
                      data-filter-id="${group.id}"
                    >
                      <span>${group.label}</span>
                      <strong>${group.id === "program" ? displayFilters.undergradProgram : displayFilters[group.field]}</strong>
                    </button>
                  `,
                )
                .join("")}
            </section>
            <div class="result-meta" id="resultMeta">${cases.length} 个案例</div>
          `
          : ""
      }
      <div id="listContent">
        ${renderListContent({ cases, articles, state })}
      </div>
    </main>
    <aside class="floating-contact floating-contact--home">
      <div class="floating-contact__copy">
        <strong>${pageConfig["home.contactTitle"] || "联系我们"}</strong>
        <span>${pageConfig["home.contactDescription"] || "想了解案例匹配、申请规划或合作方式，可直接联系顾问。"}</span>
      </div>
      <button class="primary-btn" type="button">${pageConfig["home.contactButtonText"] || "立即联系"}</button>
    </aside>
  `;
}
