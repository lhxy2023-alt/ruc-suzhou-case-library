import {
  articles,
  cases,
  documents,
  filterGroups,
  mentors,
} from "./data/index.js";
import { renderFilterPanel } from "./components/filterPanel.js";
import { renderPreviewModal } from "./components/previewModal.js";
import { renderShell } from "./components/shell.js";
import { renderDetailPage } from "./pages/detailPage.js";
import { renderListPage } from "./pages/listPage.js";
import { findCase, findMentor, filterCases } from "./utils/selectors.js";
import { state } from "./utils/state.js";

const root = document.getElementById("app");

function render() {
  const filtered = filterCases(cases, state);
  const currentCase = findCase(cases, state.selectedCaseId);
  const currentMentor = currentCase ? findMentor(mentors, currentCase.advisorId) : null;
  const currentDocs = currentCase
    ? documents.filter((doc) => currentCase.relatedPdf.includes(doc.id))
    : [];
  const currentFilterGroup = filterGroups.find((item) => item.id === state.openFilterId) || null;

  const body = currentCase
    ? renderDetailPage({ item: currentCase, mentor: currentMentor, documents: currentDocs })
    : renderListPage({ cases: filtered, articles, state, filterGroups });

  root.innerHTML = renderShell(body) + renderFilterPanel(currentFilterGroup, state) + renderPreviewModal(state.previewImage);

  bindEvents();
}

function bindEvents() {
  root.querySelector("#searchInput")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
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

  root.querySelectorAll("[data-action='close-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.openFilterId = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='reset-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters = {
        region: "全部",
        category: "全部",
        undergraduateBackgroundTag: "全部",
        intake: "全部",
        pathType: "全部",
        tags: "全部",
      };
      render();
    });
  });

  root.querySelectorAll("[data-action='open-case']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCaseId = button.dataset.caseId;
      state.openFilterId = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='back-to-list']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCaseId = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='preview-image']").forEach((button) => {
    button.addEventListener("click", () => {
      state.previewImage = { title: button.dataset.previewTitle };
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
