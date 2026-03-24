function renderInfoSection(item) {
  return `
    <section class="detail-section detail-card detail-summary">
      <div class="detail-summary__head">
        <div class="detail-summary__meta">
          <span class="pill pill--season">${item.applicationSeason}</span>
          <span class="pill">${item.undergradSchoolLabel}</span>
        </div>
        <p class="detail-summary__student">${item.studentNameMasked}</p>
        <p class="detail-summary__offer">${item.offerSchool} ${item.offerProgram}</p>
      </div>
      <div class="section-title section-title--detail">
        <h2>录取详情</h2>
      </div>
      <div class="detail-info-list">
        ${item.detailSections
          .map(
            (section) => `
              <div class="detail-info-row">
                <span class="detail-info-row__label">${section.label}</span>
                <span class="detail-info-row__value">${section.value}</span>
              </div>
            `,
          )
          .join("")}
      </div>
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
        <p>如需进一步了解申请准备，可通过下方入口继续咨询。</p>
      </div>
      <div class="student-card__copy">
        <p>${card.copy}</p>
      </div>
      <div class="student-card__actions">
        <button class="primary-btn" type="button">${card.contactLabel}</button>
      </div>
    </section>
  `;
}

function renderFloatingConsult(item) {
  return `
    <aside class="detail-floating-contact">
      <div class="detail-floating-contact__copy">
        <strong>案例咨询</strong>
        <span>${item.studentCard ? "可继续了解申请节奏与准备重点" : "咨询入口与二维码后续接入"}</span>
      </div>
      <button class="primary-btn" type="button">${item.studentCard ? "立即咨询" : "咨询入口待接入"}</button>
    </aside>
  `;
}

export function renderDetailPage({ item }) {
  return `
    <main class="detail-page">
      <header class="detail-hero">
        <button class="ghost-btn" data-action="back-to-list">返回</button>
      </header>

      ${renderInfoSection(item)}
      ${renderStudentCard(item.studentCard)}
      ${renderFloatingConsult(item)}
    </main>
  `;
}
