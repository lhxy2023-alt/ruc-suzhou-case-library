import { pageConfig } from "../data/index.js";

function hasActiveFilters(state) {
  return (
    state.filters.applicationSeason !== "不限" ||
    state.filters.undergradCollege !== "不限" ||
    state.filters.undergradMajor !== "不限" ||
    state.filters.offerRegions.length > 0
  );
}

function buildProgramFilterLabel(state, filterGroups) {
  const group = filterGroups.find((item) => item.id === "program");

  if (state.filters.undergradCollege === "不限") {
    return group?.label || "学院专业";
  }

  const college = group?.colleges?.find((item) => item.value === state.filters.undergradCollege);
  if (!college) {
    return group?.label || "学院专业";
  }

  if (state.filters.undergradMajor === "不限") {
    return college.label;
  }

  return `${college.label}${state.filters.undergradMajor}`;
}

function buildBackgroundLine(item) {
  return [item.undergradCollegeLabel, item.undergradMajor, item.gpa].filter(Boolean).join(" / ");
}

function buildScoreLine(item) {
  return item.scoreList.join(" / ");
}

function buildRegionFilterLabel(state) {
  if (!state.filters.offerRegions.length) {
    return "国家（地区）";
  }
  if (state.filters.offerRegions.length === 1) {
    return state.filters.offerRegions[0];
  }
  return "多地区";
}

function buildFilterChipLabel(group, state, filterGroups) {
  if (group.id === "program") {
    return buildProgramFilterLabel(state, filterGroups);
  }
  if (group.id === "region") {
    return buildRegionFilterLabel(state);
  }
  return state.filters[group.field] === "不限" ? group.label : state.filters[group.field];
}

function renderTagList(tags = []) {
  if (!tags.length) {
    return "";
  }

  return `
    <div class="tag-list">
      ${tags
        .map(
          (tag) => `
            <span class="pill ${tag.type === "season" ? "pill--season" : ""}">${tag.label}</span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCaseCard(item) {
  const scoreLine = buildScoreLine(item);

  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__head">
        <div class="school-badge" aria-hidden="true">${item.logoText}</div>
        <div class="case-card__title-group">
          <h3>${item.listTitle}</h3>
          ${renderTagList(item.tags)}
        </div>
      </div>
      <div class="case-card__content">
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
      <section class="section-header section-header--empty">
        <div>
          <h2>${pageConfig["articles.sectionTitle"] || "乐湖专访"}</h2>
        </div>
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
  const showReset = hasActiveFilters(state);
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "专访" },
  ];

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
                      <strong>${buildFilterChipLabel(group, state, filterGroups)}</strong>
                    </button>
                  `,
                )
                .join("")}
              ${
                showReset
                  ? `
                    <button class="ghost-btn filter-reset-btn" data-action="reset-filters" type="button">重置</button>
                  `
                  : ""
              }
            </section>
            <div class="result-meta" id="resultMeta">${cases.length} 个案例</div>
          `
          : ""
      }
      <div id="listContent">
        ${renderListContent({ cases, articles, state })}
      </div>
    </main>
    <aside class="floating-contact floating-contact--home ${state.openFilterId || state.searchFocused ? "is-hidden" : ""}">
      <div class="floating-contact__copy">
        <strong>${pageConfig["home.contactTitle"] || "联系我们"}</strong>
        <span>${pageConfig["home.contactDescription"] || "想了解案例匹配、申请规划或合作方式，可直接联系顾问。"}</span>
      </div>
      <button class="primary-btn" type="button" data-action="open-contact-modal">${pageConfig["home.contactButtonText"] || "立即联系"}</button>
    </aside>
  `;
}
