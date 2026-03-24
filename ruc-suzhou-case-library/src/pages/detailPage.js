function renderInfoSection(item) {
  return `
    <section class="detail-section detail-card">
      <div class="section-title">
        <h2>录取详情</h2>
      </div>
      <div class="detail-info-list">
        ${item.detailSections
          .map(
            (section) => `
              <div class="detail-info-row">
                <span>${section.label}</span>
                <strong>${section.value}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTextSection(title, value) {
  if (!value) {
    return "";
  }

  return `
    <section class="detail-section detail-card">
      <div class="section-title">
        <h2>${title}</h2>
      </div>
      <article class="detail-paragraph">${value}</article>
    </section>
  `;
}

function renderStudentCard(card) {
  if (!card) {
    return "";
  }

  return `
    <section class="detail-section detail-card student-card">
      <div class="section-title">
        <h2>学生名片</h2>
        <p>乐湖会协助学弟学妹与已录取学长学姐建立沟通桥梁。</p>
      </div>
      <div class="student-card__body">
        <div class="student-card__avatar">${card.name.slice(0, 1)}</div>
        <div class="student-card__copy">
          <div class="student-card__head">
            <strong>${card.name}</strong>
            <span class="pill pill--accent">开放咨询</span>
          </div>
          <p>${card.school} / ${card.major}</p>
          <p>${card.seasonTags.join(" / ")} · ${card.regionSummary}</p>
          <p>${card.note}</p>
        </div>
      </div>
      <div class="student-card__foot">
        <span>该同学当前共有 ${card.routeCount} 条 offer 展示在案例库中。</span>
        <button class="ghost-btn" type="button">咨询入口待接入</button>
      </div>
    </section>
  `;
}

export function renderDetailPage({ item }) {
  return `
    <main class="detail-page">
      <header class="detail-hero detail-hero--offer">
        <button class="ghost-btn" data-action="back-to-list">返回</button>
        <div class="detail-hero__main">
          <div class="detail-hero__logo" aria-hidden="true">${item.logoText}</div>
          <div class="detail-hero__copy">
            <div class="detail-hero__meta">
              <h1>${item.studentNameMasked}</h1>
              <span class="pill pill--season">${item.applicationSeason}</span>
            </div>
            <p>${item.offerSchool}</p>
            <strong>${item.offerProgram}</strong>
          </div>
        </div>
      </header>

      ${renderInfoSection(item)}
      ${renderTextSection("实习", item.internships)}
      ${renderTextSection("科研", item.research)}
      ${renderTextSection("备注", item.notes)}
      ${renderStudentCard(item.studentCard)}
    </main>
  `;
}
