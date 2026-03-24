export function filterCases(cases, state) {
  const query = state.query.trim().toLowerCase();

  return cases.filter((item) => {
    const matchesQuery = !query || item.searchText.toLowerCase().includes(query);
    const matchesSeason =
      state.filters.applicationSeason === "全部" ||
      item.applicationSeason === state.filters.applicationSeason;
    const matchesSchool =
      state.filters.undergradSchool === "全部" ||
      item.undergradSchool === state.filters.undergradSchool;
    const matchesMajor =
      state.filters.undergradMajor === "全部" ||
      item.undergradMajor === state.filters.undergradMajor;
    const matchesRegion =
      state.filters.offerRegion === "全部" ||
      item.offerRegion === state.filters.offerRegion;

    return matchesQuery && matchesSeason && matchesSchool && matchesMajor && matchesRegion;
  });
}

export function findCase(cases, caseId) {
  return cases.find((item) => item.id === caseId) || null;
}
