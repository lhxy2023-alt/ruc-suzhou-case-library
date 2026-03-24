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

export function renderDetailPage({ item, mentor, documents, relatedCases }) {
  const fitCopy = resolveFitCopy(item);
  const leadMagnet = resolveLeadMagnet(item);

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

      <section class="detail-section detail-summary">
        <div class="detail-summary__result">
          <span class="pill pill--accent">${item.pathType}</span>
          <strong>${item.title}</strong>
          <p>${item.shareDesc}</p>
        </div>
        <div class="detail-summary__cta">
          <p class="detail-summary__eyebrow">同背景路线判断</p>
          <h2>${fitCopy.title}</h2>
          <p>${fitCopy.body}</p>
          <div class="detail-summary__actions">
            <button class="primary-btn">领取完整案例</button>
            <button class="ghost-btn">预约 15 分钟诊断</button>
          </div>
        </div>
      </section>

      <section class="detail-section detail-section--grid">
        ${info("学生情况", `${item.applicantNameMasked} · ${item.applicantType}`)}
        ${info("录取结果", `${item.offerSchool} / ${item.offerProgram}`)}
        ${info("本科背景", `${item.undergraduateSchool} / ${item.undergraduateMajor}`)}
        ${info("成绩语言", `${item.gpaOrAverage} / ${item.languageScores}`)}
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>这位同学为什么能拿到结果</h2>
          <p>${item.experienceSummary}</p>
        </div>
        <div class="tag-row">
          ${item.experienceTags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
        </div>
        <div class="insight-grid">
          <article class="insight-card">
            <span>背景判断</span>
            <strong>${fitCopy.analysis}</strong>
          </article>
          <article class="insight-card">
            <span>准备重点</span>
            <strong>${fitCopy.prep}</strong>
          </article>
        </div>
      </section>

      <section class="detail-section lead-card">
        <div class="section-title">
          <h2>${leadMagnet.title}</h2>
          <p>${leadMagnet.copy}</p>
        </div>
        <div class="lead-card__body">
          <div>
            <strong>${leadMagnet.highlight}</strong>
            <p>${leadMagnet.subCopy}</p>
          </div>
          <button class="primary-btn">${leadMagnet.cta}</button>
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>申请推进时间线</h2>
          <p>适合拿来对照自己当前所处阶段，判断还来不来得及补。</p>
        </div>
        ${renderTimeline(item.timeline)}
      </section>

      <section class="detail-section mentor-card">
        <div class="section-title">
          <h2>顾问建议</h2>
          <p>如果你和这位同学背景接近，可以先把目标、成绩和时间点发给顾问做判断。</p>
        </div>
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
          <h2>Offer 结果展示</h2>
          <p>可先看结果，再领取完整版案例解读与同类路径建议。</p>
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
            <span>点击查看录取展示</span>
          </div>
        </button>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <h2>资料领取</h2>
          <p>同背景学生通常最关心的，是完整案例、时间线和可复制的准备重点。</p>
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

      <section class="detail-section">
        <div class="section-title">
          <h2>同类案例</h2>
          <p>继续看接近的项目、背景和路径，会比只盯一个结果更有参考价值。</p>
        </div>
        <div class="related-list">
          ${relatedCases
            .map(
              (caseItem) => `
                <button class="related-card" data-action="open-case" data-case-id="${caseItem.id}">
                  <strong>${caseItem.offerSchool}</strong>
                  <span>${caseItem.offerProgram}</span>
                  <em>${caseItem.gpaOrAverage} · ${caseItem.pathType}</em>
                </button>
              `,
            )
            .join("") || `<div class="empty-card">同类案例正在补充中，先咨询顾问获取更接近你背景的样本。</div>`}
        </div>
      </section>

      <section class="footer-cta footer-cta--detail">
        <div>
          <p class="footer-cta__eyebrow">立即咨询</p>
          <h3>${item.ctaText}</h3>
        </div>
        <div class="footer-cta__actions">
          <button class="ghost-btn">领取同类方案</button>
          <button class="primary-btn">咨询同类案例</button>
        </div>
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

function resolveFitCopy(item) {
  if (item.pathType === "双线") {
    return {
      title: "同背景同学通常更适合先做双线判断",
      body: "如果你也处在成绩不差、想冲高但又不想把风险全押在统考上的阶段，这类路径会更有参考价值。",
      analysis: "核心不是材料堆得多，而是尽早把冲刺线和保底线一起排好，避免后期临时补救。",
      prep: "优先排申请节奏、语言节点和主线目标，再决定是否同步补港新或其他保底项目。",
    };
  }
  if (item.pathType === "港新保底") {
    return {
      title: "这类案例更适合先把结果稳住",
      body: "如果你绩点处在中段、希望结果更确定，先看港新保底样本会更接近真实决策。",
      analysis: "关键在于把课程、实习和语言分数凑成一条可信路径，而不是盲目追名校。",
      prep: "先看能否补语言、实习和项目叙事，再决定是否加申更高梯队的项目。",
    };
  }
  if (item.category === "国际汉教") {
    return {
      title: "语言类背景更要先判断路径匹配",
      body: "不想考数学、又希望尽快上岸的同学，通常会优先参考汉硕或语言教育方向案例。",
      analysis: "这类申请更看重表达、课程匹配和经历的连贯性，不是单看绩点。",
      prep: "先整理语言与教学相关经历，再判断是纯考研、申请还是双路径准备。",
    };
  }
  return {
    title: "可以先看自己是否属于同一申请梯队",
    body: "如果学校、专业和成绩接近，这个案例的准备顺序、材料重点和结果区间会很有参考价值。",
    analysis: "真实差距通常不是单一分数，而是课程结构、经历质量和时间线管理。",
    prep: "先把个人背景发给顾问，快速判断应主冲、稳申还是同时做两手准备。",
  };
}

function resolveLeadMagnet(item) {
  if (item.pathType === "双线") {
    return {
      title: "领取双线规划完整版",
      copy: "包含冲刺院校、保底项目、时间节点和常见踩坑点，适合准备 431 或同类高风险路径的同学。",
      highlight: "会重点告诉你：什么情况值得双线，什么情况其实不必双线。",
      subCopy: "如果你已经有目标院校，但还没决定是否要加保底，这份资料最有参考价值。",
      cta: "领取双线规划",
    };
  }

  return {
    title: "领取完整案例解读",
    copy: "包括背景拆解、准备重点、时间线和同类项目推荐，适合想照着真实样本做判断的学生和家长。",
    highlight: "你会看到的不只是结果，还有这位同学为什么能拿到这个结果。",
    subCopy: "把成绩、专业和目标方向发给顾问，也可以同步拿到更接近你背景的建议。",
    cta: "领取完整案例",
  };
}
