export const filterGroups = [
  {
    id: "region",
    label: "地区",
    field: "region",
    options: ["全部", "港新", "英国", "中国大陆", "英港混申"],
  },
  {
    id: "category",
    label: "专业类别",
    field: "category",
    options: ["全部", "商科", "金融", "经济", "计算机", "AI", "国际汉教"],
  },
  {
    id: "background",
    label: "本科背景",
    field: "undergraduateBackgroundTag",
    options: ["全部", "人大中法", "中外合办", "法语背景", "商科基础", "转码背景"],
  },
  {
    id: "more",
    label: "更多",
    field: "composite",
    sections: [
      {
        title: "届别",
        field: "intake",
        options: ["全部", "25Fall", "26Fall"],
      },
      {
        title: "路径",
        field: "pathType",
        options: ["全部", "海外申请", "考研", "双线", "港新保底"],
      },
      {
        title: "标签",
        field: "tags",
        options: ["全部", "431", "港新", "英港混申", "国际汉硕", "AI"],
      },
    ],
  },
];
