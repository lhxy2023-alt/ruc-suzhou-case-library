# 人大中法升学案例库前台

这是一个为 `i乐湖` 场景重做的移动端优先案例库前台，聚焦更接近真实微信小程序的首页浏览、案例阅读与咨询转化体验。

当前目录是独立重做版本，不依赖旧 `project-library/` 的轻量结构；旧目录仅保留为历史参考。

## 当前范围

- 前台案例展示页面，不接真实 API
- 本地静态 mock 数据
- 移动端优先，模拟微信小程序前台的搜索、Tab、筛选、列表、详情和转化入口
- 核心数据聚焦 `25Fall` / `26Fall` 两届 offer

## 页面能力

- 案例列表页
  - 搜索框
  - `案例 / 资讯` Tab
  - `地区 / 专业类别 / 本科背景 / 更多` 筛选面板
  - 案例卡片列表
- 案例详情页
  - 标题区、标签区、录取详情
  - 申请时间线
  - 导师模块
  - 同背景路径解读
  - Offer 结果预览
  - PDF 资料领取模块
- 资讯页
  - 资讯卡片列表

## 目录结构

```text
ruc-suzhou-case-library/
├── index.html
├── README.md
└── src
    ├── app.js
    ├── components
    │   ├── filterPanel.js
    │   ├── previewModal.js
    │   └── shell.js
    ├── data
    │   ├── articles.js
    │   ├── cases.js
    │   ├── documents.js
    │   ├── fieldMap.js
    │   ├── filters.js
    │   ├── index.js
    │   └── mentors.js
    ├── pages
    │   ├── detailPage.js
    │   └── listPage.js
    ├── styles
    │   ├── base.css
    │   ├── components.css
    │   ├── layout.css
    │   └── tokens.css
    └── utils
        ├── formatters.js
        ├── selectors.js
        └── state.js
```

## 如何本地运行

在工作区根目录执行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/ruc-suzhou-case-library/
```

如果只想静态查看，也可以直接打开 `index.html`，但建议用本地服务以保证模块加载行为稳定。

## Mock 数据组织

数据已经按未来 Feishu Base 的拆分方式组织：

- `cases.js`
  - 案例主表，包含 `id`、`slug`、`intake`、`pathType`、`timeline`、`advisorId`、`relatedPdf` 等字段
- `mentors.js`
  - 导师表
- `articles.js`
  - 资讯表
- `documents.js`
  - 资料领取表
- `filters.js`
  - 前台筛选配置
- `fieldMap.js`
  - 明确区分未来可直接映射 Feishu Base 的字段，与前端派生字段

其中：

- `feishuDirectCaseFields`
  - 表示未来可以直接映射 Base 列字段或附件字段
- `derivedCaseFields`
  - 表示当前前台为了展示便利而生成的派生字段，比如 `badgeLabels`、`searchText`、`logoText`

## 未来如何接 Feishu Base

建议后续接入方式：

1. 把 `cases / mentors / articles / documents` 分别映射为多张 Feishu Base 表
2. 用 `advisorId`、`relatedPdf` 等字段在前端做关联解析
3. 用同步脚本或接口层把 Feishu 返回值转换为当前 `src/data` 的结构
4. 保留派生层逻辑在前端或 BFF 中生成，避免污染 Base 原始数据

## 未来如何迁移成微信小程序

当前代码已经按页面、组件、数据、工具层拆开，迁移时可以直接映射为：

- `pages/list`
- `pages/detail`
- `components/filter-panel`
- `components/mentor-card`
- `components/pdf-card`

建议迁移步骤：

1. 把 `state` 与筛选逻辑移到小程序页面数据层
2. 把 DOM 事件改写为小程序事件绑定
3. 把 CSS 视觉 tokens 转成 WXSS 变量或主题配置
4. 把 Offer 图片、导师头像、资料附件切换为云存储或 Feishu 附件 URL
5. 补分享、埋点、咨询跳转、企微组件与审核适配

## 旧版本处理

- 旧版本目录：`project-library/`
- 当前处理方式：保留，不删除，不在其上继续开发
- 原因：它仍可作为最早的字段和方向参考，但本次交付的页面结构、数据结构、视觉和交互都在新目录中重新规划
