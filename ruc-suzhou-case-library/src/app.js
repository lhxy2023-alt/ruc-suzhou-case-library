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
const FLOATING_HIDE_DURATION = 180;

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

function updateFilterVisibility(nextFilterId) {
  const currentFloating = root.querySelector(".floating-contact--home");
  const isOpening = Boolean(nextFilterId) && !state.openFilterId;

  if (isOpening && currentFloating) {
    currentFloating.classList.add("is-hidden");
    window.setTimeout(() => {
      state.openFilterId = nextFilterId;
      render();
    }, FLOATING_HIDE_DURATION);
    return;
  }

  state.openFilterId = nextFilterId;
  render();
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
      updateFilterVisibility(state.openFilterId === button.dataset.filterId ? null : button.dataset.filterId);
    });
  });

  root.querySelectorAll("[data-action='set-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters[button.dataset.field] = button.dataset.value;
      render();
    });
  });

  root.querySelectorAll("[data-action='set-college']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.undergradCollege = button.dataset.college;
      state.filters.undergradMajor = "全部";
      render();
    });
  });

  root.querySelectorAll("[data-action='set-major']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.undergradMajor = button.dataset.major;
      render();
    });
  });

  root.querySelectorAll("[data-action='toggle-region']").forEach((button) => {
    button.addEventListener("click", () => {
      const region = button.dataset.region;
      const exists = state.filters.offerRegions.includes(region);
      state.filters.offerRegions = exists
        ? state.filters.offerRegions.filter((item) => item !== region)
        : [...state.filters.offerRegions, region];
      render();
    });
  });

  root.querySelectorAll("[data-action='clear-regions']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.offerRegions = [];
      render();
    });
  });

  root.querySelectorAll("[data-action='close-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      updateFilterVisibility(null);
    });
  });

  root.querySelectorAll("[data-action='reset-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters = {
        applicationSeason: "全部",
        undergradCollege: "全部",
        undergradMajor: "全部",
        offerRegions: [],
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
