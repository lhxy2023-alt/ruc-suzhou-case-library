import { pageConfig } from "../data/index.js";

function renderQrCard(label, image) {
  return `
    <div class="contact-modal__qr-card">
      <div class="contact-modal__qr-image">
        <img src="${image}" alt="${label}" loading="lazy" />
      </div>
      <strong>${label}</strong>
    </div>
  `;
}

export function renderContactModal(isOpen) {
  if (!isOpen) {
    return "";
  }

  const wechatLabel = pageConfig["contact.wechatQrLabel"] || "微信二维码";
  const wechatImage = pageConfig["contact.wechatQrImage"] || "";
  const wenjuanxingLabel = pageConfig["contact.formQrLabel"] || pageConfig["contact.wenjuanxingQrLabel"] || "问卷星二维码";
  const wenjuanxingImage = pageConfig["contact.formQrImage"] || pageConfig["contact.wenjuanxingQrImage"] || "";

  return `
    <div class="modal-backdrop" data-action="close-contact-modal"></div>
    <section class="modal contact-modal">
      <div class="modal__head">
        <h3>${pageConfig["contact.modalTitle"] || "联系顾问"}</h3>
        <button class="ghost-btn" data-action="close-contact-modal">关闭</button>
      </div>
      <div class="modal__body">
        <p class="contact-modal__description">${pageConfig["contact.modalDescription"] || "可扫码添加微信，或填写问卷星表单。"}</p>
        <div class="contact-modal__grid">
          ${renderQrCard(wechatLabel, wechatImage)}
          ${renderQrCard(wenjuanxingLabel, wenjuanxingImage)}
        </div>
      </div>
    </section>
  `;
}
