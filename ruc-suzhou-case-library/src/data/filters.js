import { cases } from "./cases.js";

function optionsFor(field) {
  return ["全部", ...new Set(cases.map((item) => item[field]).filter(Boolean))];
}

export const filterGroups = [
  {
    id: "season",
    label: "申请季",
    field: "applicationSeason",
    options: optionsFor("applicationSeason"),
  },
  {
    id: "school",
    label: "本科学校",
    field: "undergradSchool",
    options: optionsFor("undergradSchool"),
  },
  {
    id: "major",
    label: "本科专业",
    field: "undergradMajor",
    options: optionsFor("undergradMajor"),
  },
  {
    id: "offer",
    label: "录取院校",
    field: "offerSchool",
    options: optionsFor("offerSchool"),
  },
];
