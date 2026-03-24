# 人大中法升学案例库前台

这是一个为 `i乐湖` 场景重做的移动端优先案例库前台。

当前版本的重点已经从“视觉 demo”切换为“真实飞书 Base 字段映射重构”：前台案例主数据直接来自 `feishu-bitable-sync/data/rebuilt-offers.json` 中的 `25fall` / `26fall` 真实 offer 记录。

## 当前范围

- 前台案例展示页面，不接真实 API
- 本地静态数据层，但数据来源已切到真实 offer 记录
- 移动端优先，保留搜索、Tab、筛选、列表和详情的最小前台结构
- 核心数据仅使用 `25Fall` / `26Fall` 两届真实 offer

## 页面能力

- 案例列表页
  - 搜索框
  - `案例 / 资讯` Tab
  - `申请季 / 本科学校 / 本科专业 / 录取院校` 筛选面板
  - 基于真实字段的案例卡片列表
- 案例详情页
  - 真实 offer 信息卡
  - 语言与标化成绩
  - 案例说明 / 项目说明
  - 同类真实 offer
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

## 当前数据组织

当前仍保留模块化前端目录，但案例主数据已按真实字段重建：

- `cases.js`
  - 67 条真实 offer 记录（`25Fall` 44 条，`26Fall` 23 条）
  - 前台主字段仅保留 `申请季 / 匿名学生 / 本科学校 / 本科专业 / GPA/均分 / 雅思 / 托福 / GRE/GMAT / 录取院校 / 录取专业 / 案例说明`
- `mentors.js`
  - 历史遗留文件，当前前台主流程不再依赖
- `articles.js`
  - 资讯表
- `documents.js`
  - 历史遗留文件，当前前台主流程不再依赖
- `filters.js`
  - 基于真实字段动态生成筛选配置
- `fieldMap.js`
  - 明确区分真实字段与前端派生字段
- `FIELD_MAPPING.md`
  - 本次前台字段映射重构说明

其中：

- `feishuDirectCaseFields`
  - 表示当前前台直接建立在真实 offer 记录上的字段
- `derivedCaseFields`
  - 表示只允许存在于前端派生层的字段，如 `listTitle`、`logoText`、`searchText`

## 当前字段原则

1. 前台主数据直接来自真实 offer 记录
2. 后台运营字段如 `宣传完成情况`、`备注` 不前台展示
3. 空字段不展示，不保留空标签、空模块
4. 只允许做匿名化、搜索文本、列表标题、成绩合并等轻量派生

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
4. 再决定是否补充附件、顾问、资料等真实关联字段
5. 最后再补分享、埋点、咨询跳转、企微组件与审核适配

## 旧版本处理

- 旧版本目录：`project-library/`
- 当前处理方式：保留，不删除，不在其上继续开发
- 原因：它仍可作为最早的字段和方向参考，但本次交付的页面结构、数据结构、视觉和交互都在新目录中重新规划
