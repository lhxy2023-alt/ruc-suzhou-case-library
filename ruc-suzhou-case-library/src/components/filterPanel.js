function renderOption(field, option, selected) {
  return `
    <button
      class="option-chip ${selected === option ? "is-selected" : ""}"
      data-action="set-filter"
      data-field="${field}"
      data-value="${option}"
    >${option}</button>
  `;
}

export function renderFilterPanel(group, state) {
  if (!group) {
    return "";
  }

  return `
    <div class="sheet-backdrop" data-action="close-filter"></div>
    <section class="sheet">
      <div class="sheet__head">
        <h3>${group.label}</h3>
        <button class="ghost-btn" data-action="close-filter">关闭</button>
      </div>
      ${
        group.sections
          ? group.sections
              .map(
                (section) => `
                  <div class="sheet__section">
                    <strong>${section.title}</strong>
                    <div class="sheet__options">
                      ${section.options
                        .map(
                          (option) => `
                            <button
                              class="option-chip ${
                                state.filters.undergradSchool === section.schoolValue &&
                                state.filters.undergradMajor === option
                                  ? "is-selected"
                                  : ""
                              }"
                              data-action="set-school-major"
                              data-school="${section.schoolValue}"
                              data-major="${option}"
                            >${option}</button>
                          `,
                        )
                        .join("")}
                    </div>
                  </div>
                `,
              )
              .join("")
          : `
            <div class="sheet__options">
              ${group.options.map((option) => renderOption(group.field, option, state.filters[group.field])).join("")}
            </div>
          `
      }
      <div class="sheet__foot">
        <button class="ghost-btn" data-action="reset-filters">重置筛选</button>
        <button class="primary-btn" data-action="close-filter">完成</button>
      </div>
    </section>
  `;
}
