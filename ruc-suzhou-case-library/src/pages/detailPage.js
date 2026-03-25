import { pageConfig } from "../data/index.js";

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

function renderIdentityValue(item) {
  return `
    <div class="detail-identity">
      <span class="detail-identity__name">${item.studentDisplayName}</span>
      ${renderTagList(item.tags)}
    </div>
  `;
}

function renderInfoRows(item) {
  const rows = [
    item.studentDisplayName
      ? { label: "学生姓名", value: renderIdentityValue(item) }
      : null,
    ...item.detailSections.map((section) => ({
      label: section.label,
      value: `<span>${section.value}</span>`,
    })),
  ].filter(Boolean);

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

function renderStudentCard(card) {
  if (!card) {
    return "";
  }

  return `
    <section class="detail-section detail-card student-card">
      <div class="section-title">
        <h2>${pageConfig["detail.studentCardTitle"] || "学生名片"}</h2>
        <p>${pageConfig["detail.studentCardDescription"] || "这部分保留为留白说明与后续联系入口，不重复展示案例主信息。"}</p>
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
  const hasCard = Boolean(item.studentCard);
  return `
    <aside class="floating-contact">
      <div class="floating-contact__copy">
        <strong>${pageConfig["detail.contactTitle"] || "案例咨询"}</strong>
        <span>${
          hasCard
            ? pageConfig["detail.contactDescriptionWithCard"] || "可继续了解申请节奏与准备重点"
            : pageConfig["detail.contactDescriptionWithoutCard"] || "咨询入口与二维码后续接入"
        }</span>
      </div>
      <button class="primary-btn" type="button">${
        hasCard
          ? pageConfig["detail.contactButtonTextWithCard"] || "立即咨询"
          : pageConfig["detail.contactButtonTextWithoutCard"] || "咨询入口待接入"
      }</button>
    </aside>
  `;
}

export function renderDetailPage({ item }) {
  return `
    <main class="detail-page">
      <header class="detail-hero">
        <button class="ghost-btn" data-action="back-to-list">返回</button>
      </header>

      <section class="detail-section detail-card detail-sheet">
        <div class="section-title section-title--detail">
          <p>录取详情</p>
          <h2>${item.listTitle}</h2>
        </div>
        <div class="detail-info-list">
          ${renderInfoRows(item)}
        </div>
      </section>
      ${renderStudentCard(item.studentCard)}
      ${renderFloatingConsult(item)}
    </main>
  `;
}
