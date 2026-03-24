function renderInfoGrid(item) {
  return `
    <section class="detail-section detail-section--grid">
      ${item.detailSections
        .map(
          (section) => `
            <article class="info-card">
              <span>${section.label}</span>
              <strong>${section.value}</strong>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderScoreSection(item) {
  if (!item.scoreList.length) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="section-title">
        <h2>语言与标化</h2>
        <p>只展示该条真实 offer 记录里实际填写的成绩字段。</p>
      </div>
      <div class="tag-row">
        ${item.scoreList.map((score) => `<span class="pill pill--accent">${score}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderDescriptionSection(item) {
  if (!item.description) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="section-title">
        <h2>案例说明 / 项目说明</h2>
        <p>该字段直接来自真实 Base 原始记录，未做业务扩写。</p>
      </div>
      <article class="insight-card">
        <strong>${item.description}</strong>
      </article>
    </section>
  `;
}

function renderRelatedCases(relatedCases) {
  return `
    <section class="detail-section">
      <div class="section-title">
        <h2>同类真实 offer</h2>
        <p>优先补充同专业或同录取院校的真实记录。</p>
      </div>
      <div class="related-list">
        ${
          relatedCases.length
            ? relatedCases
                .map(
                  (caseItem) => `
                    <button class="related-card" data-action="open-case" data-case-id="${caseItem.id}">
                      <strong>${caseItem.offerSchool}</strong>
                      <span>${caseItem.offerProgram}</span>
                      <em>${caseItem.applicationSeason} · ${caseItem.undergradMajor}</em>
                    </button>
                  `,
                )
                .join("")
            : `<div class="empty-card">暂无更接近的同类记录。</div>`
        }
      </div>
    </section>
  `;
}

export function renderDetailPage({ item, relatedCases }) {
  return `
    <main class="detail-page">
      <header class="detail-hero">
        <button class="ghost-btn" data-action="back-to-list">返回</button>
        <div class="detail-hero__copy">
          <p class="eyebrow">${item.applicationSeason} · ${item.studentNameMasked}</p>
          <h1>${item.offerSchool} · ${item.offerProgram}</h1>
          <div class="tag-row">
            <span class="pill pill--accent">${item.undergradSchool}</span>
            <span class="pill pill--accent">${item.undergradMajor}</span>
            <span class="pill pill--accent">${item.gpa}</span>
          </div>
        </div>
      </header>

      <section class="detail-section detail-summary">
        <div class="detail-summary__result">
          <span class="pill pill--accent">${item.applicationSeason}</span>
          <strong>${item.listTitle}</strong>
          <p>当前详情页仅围绕真实 offer 记录展示，未再补写申请故事、时间线或顾问话术。</p>
        </div>
        <div class="detail-summary__cta">
          <p class="detail-summary__eyebrow">数据来源</p>
          <h2>飞书多维表格真实记录</h2>
          <p>可展示字段来自 25Fall / 26Fall 重建后的真实 offer 数据；空字段自动隐藏，后台字段不前台展示。</p>
          <div class="detail-summary__actions">
            <button class="primary-btn">领取同背景案例</button>
            <button class="ghost-btn">咨询案例筛选规则</button>
          </div>
        </div>
      </section>

      ${renderInfoGrid(item)}
      ${renderScoreSection(item)}
      ${renderDescriptionSection(item)}
      ${renderRelatedCases(relatedCases)}

      <section class="footer-cta footer-cta--detail">
        <div>
          <p class="footer-cta__eyebrow">当前记录</p>
          <h3>${item.studentNameMasked} 的这条 ${item.applicationSeason} offer 已按真实字段完成前台映射。</h3>
        </div>
        <div class="footer-cta__actions">
          <button class="ghost-btn" data-action="back-to-list">继续看案例</button>
          <button class="primary-btn">咨询同类案例</button>
        </div>
      </section>
    </main>
  `;
}
