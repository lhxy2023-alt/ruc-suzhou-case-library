export function renderShell(content) {
  return `
    <div class="app-bg">
      <div class="phone-stage">
        <div class="phone-frame">
          ${content}
          <aside class="floating-contact">
            <div class="floating-contact__copy">
              <strong>想看更适合你的案例？</strong>
              <span>咨询入口与二维码后续接入</span>
            </div>
            <div class="floating-contact__qr" aria-hidden="true">联</div>
          </aside>
        </div>
      </div>
    </div>
  `;
}
