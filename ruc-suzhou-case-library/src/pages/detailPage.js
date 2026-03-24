function buildIdentityMeta(item) {
  return [item.applicationSeason].filter(Boolean);
}

function renderIdentityValue(item) {
  const meta = buildIdentityMeta(item);

  return `
    <div class="detail-identity">
      <span class="detail-identity__name">${item.studentNameMasked}</span>
      ${
        meta.length
          ? `
            <div class="detail-identity__meta">
              ${meta.map((value) => `<span>${value}</span>`).join("")}
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderInfoRows(item) {
  const rows = [
    { label: "学生姓名", value: renderIdentityValue(item) },
    ...item.detailSections
      .filter((section) => !["投递时间", "录取时间"].includes(section.label))
      .map((section) => ({
        label: section.label,
        value: `<span>${section.value}</span>`,
      })),
  ];

  return rows
    .map(
      (row) => `
        <div class="detail-info-row">
          <span class="detail-info-row__label">${row.label}</span>
          <div class="detail-info-row__value">${row.value}</div>
        </div>
      `,
    )
    .join("");
}

function renderTimeline(item) {
  const entries = [
    { label: "提交申请", value: item.submittedAt },
    { label: "收到录取", value: item.admissionAt },
  ].filter((entry) => entry.value);

  if (!entries.length) {
    return "";
  }

  return `
    <div class="detail-timeline">
      ${entries
        .map(
          (entry) => `
            <div class="detail-timeline__item">
              <span class="detail-timeline__label">${entry.label}</span>
              <strong class="detail-timeline__value">${entry.value}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderInfoSection(item) {
  return `
    <section class="detail-section detail-card detail-sheet">
      <div class="section-title section-title--detail">
        <h2>录取详情</h2>
      </div>
      ${renderTimeline(item)}
      <div class="detail-info-list">
        ${renderInfoRows(item)}
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
        <p>这部分保留为留白说明与后续联系入口，不重复展示案例主信息。</p>
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
