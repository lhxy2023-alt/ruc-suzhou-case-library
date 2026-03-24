import { formatDate, formatShortDate } from "../utils/formatters.js";

function renderTimeline(items) {
  return `
    <div class="timeline">
      ${items
        .map(
          (item) => `
            <div class="timeline__item">
              <span class="timeline__date">${formatShortDate(item.date)}</span>
              <div class="timeline__content">
                <strong>${item.label}</strong>
                <span>${formatDate(item.date)}</span>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderDetailPage({ item, mentor, documents }) {
  return `
    <main class="detail-page">
      <header class="detail-hero">
        <button class="ghost-btn" data-action="back-to-list">返回</button>
        <div class="detail-hero__copy">
          <p class="eyebrow">${item.offerMonthLabel}</p>
          <h1>${item.offerSchool} · ${item.offerProgram}</h1>
          <div class="tag-row">
            ${item.badgeLabels.map((tag) => `<span class="pill pill--accent">${tag}</span>`).join("")}
          </div>
        </div>
      </header>

      <section class="detail-section detail-section--grid">
        ${info("学生姓名", item.applicantNameMasked)}
        ${info("是否应届", item.applicantType)}
        ${info("录取学校", item.offerSchool)}
        ${info("录取专业", item.offerProgram)}
        ${info("毕业学校", item.undergraduateSchool)}
        ${info("本科专业", item.undergraduateMajor)}
        ${info("均分 / GPA", item.gpaOrAverage)}
        ${info("语言成绩", item.languageScores)}
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>申请时间线</h2>
          <p>保留未来直接映射 Feishu Base 子表的结构。</p>
        </div>
        ${renderTimeline(item.timeline)}
      </section>

      <section class="detail-section mentor-card">
        <div class="mentor-card__profile">
          <div class="mentor-avatar">${mentor.avatarText}</div>
          <div>
            <h2>${mentor.name}</h2>
            <p>${mentor.title}</p>
            <span>${mentor.intro}</span>
          </div>
        </div>
        <div class="tag-row">
          ${mentor.highlights.map((tag) => `<span class="pill">${tag}</span>`).join("")}
        </div>
        <div class="mentor-actions">
          <button class="primary-btn">${mentor.wechatLabel}</button>
          ${mentor.quickQuestions
            .map((item) => `<button class="quick-btn">${item}</button>`)
            .join("")}
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>主要经历</h2>
          <p>${item.experienceSummary}</p>
        </div>
        <div class="tag-row">
          ${item.experienceTags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>Offer 展示</h2>
          <p>当前为交互占位，后续可替换为 Feishu 图片附件字段。</p>
        </div>
        <button
          class="offer-preview"
          data-action="preview-image"
          data-preview-title="${item.offerSchool} ${item.offerProgram}"
        >
          <div class="offer-preview__paper">
            <span class="offer-preview__badge">${item.intake}</span>
            <strong>${item.offerSchool}</strong>
            <p>${item.offerProgram}</p>
            <span>点击查看大图</span>
          </div>
        </button>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>资料领取</h2>
          <p>围绕案例库做强转化，而不是停留在信息展示。</p>
        </div>
        <div class="doc-list">
          ${documents
            .map(
              (doc) => `
                <article class="doc-card">
                  <span class="pill pill--accent">${doc.badge}</span>
                  <h3>${doc.title}</h3>
                  <p>${doc.description}</p>
                  <button class="primary-btn">${doc.cta}</button>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="footer-cta footer-cta--detail">
        <div>
          <p class="footer-cta__eyebrow">转化入口</p>
          <h3>${item.ctaText}</h3>
        </div>
        <button class="primary-btn">咨询同类案例</button>
      </section>
    </main>
  `;
}

function info(label, value) {
  return `
    <article class="info-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}
