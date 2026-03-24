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
    const matchesOffer =
      state.filters.offerSchool === "全部" ||
      item.offerSchool === state.filters.offerSchool;

    return matchesQuery && matchesSeason && matchesSchool && matchesMajor && matchesOffer;
  });
}

export function findCase(cases, caseId) {
  return cases.find((item) => item.id === caseId) || null;
}
