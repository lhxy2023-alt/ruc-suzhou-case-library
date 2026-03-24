import { articles, cases, filterGroups } from "./data/index.js";
import { renderFilterPanel } from "./components/filterPanel.js";
import { renderPreviewModal } from "./components/previewModal.js";
import { renderShell } from "./components/shell.js";
import { renderDetailPage } from "./pages/detailPage.js";
import { renderListContent, renderListPage } from "./pages/listPage.js";
import { findCase, filterCases } from "./utils/selectors.js";
import { state } from "./utils/state.js";

const root = document.getElementById("app");
let isComposing = false;

function getFilteredCases() {
  return filterCases(cases, state);
}

function updateListResults() {
  if (state.selectedCaseId || state.activeTab !== "cases") {
    return;
  }

  const filtered = getFilteredCases();
  const resultMeta = root.querySelector("#resultMeta");
  const listContent = root.querySelector("#listContent");

  if (resultMeta) {
    resultMeta.textContent = `${filtered.length} 个案例`;
  }

  if (listContent) {
    listContent.innerHTML = renderListContent({ cases: filtered, articles, state });
    bindListActionEvents();
  }
}

function render() {
  const currentCase = findCase(cases, state.selectedCaseId);
  const currentFilterGroup = filterGroups.find((item) => item.id === state.openFilterId) || null;

  const body = currentCase
    ? renderDetailPage({
      item: currentCase,
    })
    : renderListPage({ cases: getFilteredCases(), articles, state, filterGroups });

  root.innerHTML = renderShell(body) + renderFilterPanel(currentFilterGroup, state) + renderPreviewModal(state.previewImage);

  bindEvents();
}

function bindListActionEvents() {
  root.querySelectorAll("[data-action='open-case']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCaseId = button.dataset.caseId;
      state.openFilterId = null;
      render();
    });
  });
}

function bindEvents() {
  const searchInput = root.querySelector("#searchInput");
  searchInput?.addEventListener("compositionstart", () => {
    isComposing = true;
  });
  searchInput?.addEventListener("compositionend", (event) => {
    isComposing = false;
    state.query = event.target.value;
    updateListResults();
  });
  searchInput?.addEventListener("input", (event) => {
    if (isComposing) {
      return;
    }
    state.query = event.target.value;
    updateListResults();
  });

  root.querySelectorAll("[data-action='switch-tab']").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
  });

  root.querySelectorAll("[data-action='toggle-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.openFilterId = state.openFilterId === button.dataset.filterId ? null : button.dataset.filterId;
      render();
    });
  });

  root.querySelectorAll("[data-action='set-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters[button.dataset.field] = button.dataset.value;
      render();
    });
  });

  root.querySelectorAll("[data-action='set-school-major']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.undergradSchool = button.dataset.school;
      state.filters.undergradMajor = button.dataset.major;
      render();
    });
  });

  root.querySelectorAll("[data-action='close-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.openFilterId = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='reset-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters = {
        applicationSeason: "全部",
        undergradSchool: "全部",
        undergradMajor: "全部",
        offerRegion: "全部",
      };
      render();
    });
  });

  bindListActionEvents();

  root.querySelectorAll("[data-action='back-to-list']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCaseId = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='close-preview']").forEach((button) => {
    button.addEventListener("click", () => {
      state.previewImage = null;
      render();
    });
  });
}

render();
