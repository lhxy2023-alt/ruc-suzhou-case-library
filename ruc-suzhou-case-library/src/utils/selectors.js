import { includesTag } from "./formatters.js";

export function filterCases(cases, state) {
  const query = state.query.trim().toLowerCase();

  return cases.filter((item) => {
    const matchesQuery =
      !query || item.searchText.toLowerCase().includes(query);
    const matchesRegion =
      state.filters.region === "全部" || item.region === state.filters.region;
    const matchesCategory =
      state.filters.category === "全部" ||
      item.category === state.filters.category;
    const matchesBackground =
      state.filters.undergraduateBackgroundTag === "全部" ||
      item.undergraduateBackgroundTag === state.filters.undergraduateBackgroundTag;
    const matchesIntake =
      state.filters.intake === "全部" || item.intake === state.filters.intake;
    const matchesPath =
      state.filters.pathType === "全部" ||
      item.pathType === state.filters.pathType;
    const matchesTag = includesTag(item.experienceTags, state.filters.tags);

    return (
      matchesQuery &&
      matchesRegion &&
      matchesCategory &&
      matchesBackground &&
      matchesIntake &&
      matchesPath &&
      matchesTag
    );
  });
}

export function findCase(cases, caseId) {
  return cases.find((item) => item.id === caseId) || null;
}

export function findMentor(mentors, mentorId) {
  return mentors.find((item) => item.id === mentorId) || null;
}
