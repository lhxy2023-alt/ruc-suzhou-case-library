const cases = [
  {
    id: 'case-001',
    name: 'L同学',
    cohort: '2022级',
    undergraduateMajor: '金融学',
    gpaRange: '3.2 - 3.4',
    languageScore: '雅思 6.5',
    backgroundTags: ['数学较强', '法语一般', '有实习', '不排斥统考'],
    routeType: '考研 + 申请',
    finalPath: '北大金融431冲刺 + 港新商科保底',
    destination: '北大金融431 / 港新金融类项目',
    summary: '绩点不算高，但数学基础不错，法语表现一般，更适合通过考研搏上限，同时用申请控制风险。',
    diagnosis: '这类学生在申请端不占绝对优势，但如果数学能力尚可，考研的收益更高。为了避免只押考研的风险，建议同步做港新保底。',
    recommendation: '主推北大金融431课程，同时尽早介入港新申请规划。',
  },
  {
    id: 'case-002',
    name: 'Z同学',
    cohort: '2021级',
    undergraduateMajor: '国民经济管理',
    gpaRange: '3.7 - 3.9',
    languageScore: '雅思 7.5',
    backgroundTags: ['绩点高', '目标名校', '愿意双线准备'],
    routeType: '考研 + 申请',
    finalPath: '北大冲刺 + 海外申请 + 保研一并布局',
    destination: '北大目标校 / 港新英美申请 / 保研备份',
    summary: '绩点高、语言也不差，同时非常想冲北大，适合双线甚至三线布局。',
    diagnosis: '这类学生最大的资产是绩点，必须保住绩点；考研可以冲上限，申请与保研则是安全垫。',
    recommendation: '推荐考研 + 申请组合，并将保研服务打包进入整体规划。',
  },
  {
    id: 'case-003',
    name: 'W同学',
    cohort: '2023级',
    undergraduateMajor: '法语',
    gpaRange: '3.4 - 3.6',
    languageScore: '法语 B2 / 雅思待补',
    backgroundTags: ['不想考数学', '有考研意愿', '文科方向'],
    routeType: '考研',
    finalPath: '人大国际汉硕',
    destination: '人大国际汉硕',
    summary: '希望走考研路线，但明确不想准备数学，更适合文科考研路径。',
    diagnosis: '这类学生如果硬推商科考研，阻力很大；人大国际汉硕能承接其考研意愿，同时匹配其学科背景。',
    recommendation: '重点承接人大国际汉硕产品，并补充语言与专业认知规划。',
  },
  {
    id: 'case-004',
    name: 'C同学',
    cohort: '2022级',
    undergraduateMajor: '经济学',
    gpaRange: '3.3 - 3.5',
    languageScore: '雅思 7.0',
    backgroundTags: ['讨厌统考', '应试焦虑', '偏申请'],
    routeType: '海外申请',
    finalPath: '直接走海外申请',
    destination: '港新 / 英国商科申请',
    summary: '学生主观上排斥统考，不愿再经历类似高考式应试，更适合直接申请。',
    diagnosis: '对统考排斥感强的学生，不应硬推考研，应尽快把路径切到申请，减少情绪阻力。',
    recommendation: '直接推进海外申请服务，并尽早明确学校层级与申请节奏。',
  },
  {
    id: 'case-005',
    name: 'Y同学',
    cohort: '2023级',
    undergraduateMajor: '金融科技',
    gpaRange: '3.0 - 3.2',
    languageScore: '暂无',
    backgroundTags: ['期末课学员', '持续复购', '数学基础较好'],
    routeType: '待诊断分流',
    finalPath: '先学业辅导，再进入升学诊断',
    destination: '待判断：431 / 港新 / 其他路径',
    summary: '这类学生已对课程质量建立信任，但尚未完成对长期升学产品的认知升级。',
    diagnosis: '这是最值得重点经营的次高信任人群，需要在期末课之后补专门的升学承接动作。',
    recommendation: '先做一对一诊断，再决定是推 431、申请，还是其他路径。',
  },
  {
    id: 'case-006',
    name: 'H同学',
    cohort: '2021级',
    undergraduateMajor: '国际商务',
    gpaRange: '3.5 - 3.7',
    languageScore: '雅思 7.0',
    backgroundTags: ['i修远骨干', '高信任', '熟人推荐'],
    routeType: '海外申请',
    finalPath: '港新申请 + 老学员推荐转化',
    destination: '港大 / 新加坡商科项目',
    summary: '通过社群长期互动与高年级骨干关系沉淀，较自然地完成升学服务成交。',
    diagnosis: 'i修远 的核心价值在于高信任圈层与熟人推荐机制，这类学生成交成本最低。',
    recommendation: '继续用社群活动与骨干示范带动新一届学生的自然转化。',
  },
];

const state = {
  major: '全部',
  routeType: '全部',
  cohort: '全部',
  selectedId: null,
};

const app = document.getElementById('app');
const backButton = document.getElementById('backButton');

backButton.addEventListener('click', () => {
  state.selectedId = null;
  render();
});

function uniqueOptions(key) {
  return ['全部', ...new Set(cases.map((item) => item[key]))];
}

function filterCases() {
  return cases.filter((item) => {
    const majorMatch = state.major === '全部' || item.undergraduateMajor === state.major;
    const routeMatch = state.routeType === '全部' || item.routeType === state.routeType;
    const cohortMatch = state.cohort === '全部' || item.cohort === state.cohort;
    return majorMatch && routeMatch && cohortMatch;
  });
}

function renderFilters(filteredCases) {
  return `
    <section class="filters">
      <h2>筛选案例</h2>
      <div class="filter-row">
        ${renderSelect('本科专业', 'major', uniqueOptions('undergraduateMajor'), state.major)}
        ${renderSelect('升学路径', 'routeType', uniqueOptions('routeType'), state.routeType)}
        ${renderSelect('学生届别', 'cohort', uniqueOptions('cohort'), state.cohort)}
        <div class="filter-group">
          <label>当前结果</label>
          <div class="summary-box">
            <div class="summary-label">筛选后案例数</div>
            <div class="summary-value">${filteredCases.length} 个</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderSelect(label, key, options, value) {
  return `
    <div class="filter-group">
      <label for="${key}">${label}</label>
      <select id="${key}" data-key="${key}">
        ${options.map((option) => `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderStats(filteredCases) {
  const routeCount = new Set(filteredCases.map((item) => item.routeType)).size;
  const majorCount = new Set(filteredCases.map((item) => item.undergraduateMajor)).size;
  const highTrustCount = filteredCases.filter((item) => item.backgroundTags.includes('i修远骨干') || item.backgroundTags.includes('期末课学员')).length;

  return `
    <section class="stats">
      <div class="stat-item">
        <div class="stat-label">案例总数</div>
        <div class="stat-value">${filteredCases.length}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">覆盖路径</div>
        <div class="stat-value">${routeCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">覆盖专业</div>
        <div class="stat-value">${majorCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">高信任样本</div>
        <div class="stat-value">${highTrustCount}</div>
      </div>
    </section>
  `;
}

function renderList(filteredCases) {
  if (!filteredCases.length) {
    return '<div class="empty-state">当前筛选条件下没有案例，可以放宽筛选看看。</div>';
  }

  return `
    <div class="list-header">
      <h2>案例列表</h2>
      <div class="list-note">先用简洁结构表达“学生背景 → 最终升学路径”。</div>
    </div>
    <section class="case-list">
      ${filteredCases.map(renderCard).join('')}
    </section>
  `;
}

function renderCard(item) {
  return `
    <article class="case-card" data-id="${item.id}">
      <div class="case-top">
        <div>
          <div class="case-name">${item.name}</div>
          <div class="case-meta">${item.cohort} · ${item.undergraduateMajor}</div>
        </div>
        <div class="path-badge">${item.routeType}</div>
      </div>
      <div class="case-summary">
        <div class="summary-box">
          <div class="summary-label">GPA / 均分</div>
          <div class="summary-value">${item.gpaRange}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">语言成绩</div>
          <div class="summary-value">${item.languageScore || '暂无'}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">最终路径</div>
          <div class="summary-value">${item.finalPath}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">最终去向</div>
          <div class="summary-value">${item.destination}</div>
        </div>
      </div>
      <div class="tag-list">
        ${item.backgroundTags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderDetail(item) {
  return `
    <section class="detail-view">
      <div class="detail-panel">
        <div class="detail-title">
          <div>
            <h2>${item.name}</h2>
            <div class="detail-subtitle">${item.cohort} · ${item.undergraduateMajor} · ${item.routeType}</div>
          </div>
          <div class="path-badge">${item.finalPath}</div>
        </div>

        <div class="detail-grid">
          ${detailInfo('本科专业', item.undergraduateMajor)}
          ${detailInfo('学生届别', item.cohort)}
          ${detailInfo('GPA / 均分区间', item.gpaRange)}
          ${detailInfo('语言成绩', item.languageScore || '暂无')}
          ${detailInfo('最终去向', item.destination)}
          ${detailInfo('升学路径', item.finalPath)}
        </div>

        <div class="section-block">
          <div class="section-title">背景标签</div>
          <div class="tag-list">${item.backgroundTags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
        </div>

        <div class="section-block">
          <div class="section-title">案例概述</div>
          <p>${item.summary}</p>
        </div>

        <div class="section-block">
          <div class="section-title">诊断逻辑</div>
          <p>${item.diagnosis}</p>
        </div>

        <div class="section-block">
          <div class="section-title">推荐动作</div>
          <p>${item.recommendation}</p>
        </div>
      </div>

      <aside class="side-cta">
        <h3>为什么这个 MVP 够用</h3>
        <p>第一版不追求复杂筛选和后台系统，只先把“背景—路径—结果”三件事展示清楚，方便后续放到 i乐湖 或扩成 H5 / 小程序。</p>
        <ul>
          <li>可以先当案例库原型</li>
          <li>后续可补家长视图与咨询入口</li>
          <li>也可扩成“升学路径库”而不只是案例库</li>
        </ul>
        <a class="cta-button" href="#">下一步可接：微信咨询 / 路径诊断</a>
      </aside>
    </section>
  `;
}

function detailInfo(label, value) {
  return `
    <div class="info-item">
      <div class="info-label">${label}</div>
      <div class="info-value">${value}</div>
    </div>
  `;
}

function attachEvents() {
  document.querySelectorAll('select[data-key]').forEach((select) => {
    select.addEventListener('change', (event) => {
      state[event.target.dataset.key] = event.target.value;
      render();
    });
  });

  document.querySelectorAll('.case-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedId = card.dataset.id;
      render();
    });
  });
}

function render() {
  const filteredCases = filterCases();
  const selectedCase = cases.find((item) => item.id === state.selectedId);

  backButton.classList.toggle('hidden', !selectedCase);

  app.innerHTML = selectedCase
    ? renderDetail(selectedCase)
    : `${renderFilters(filteredCases)}${renderStats(filteredCases)}${renderList(filteredCases)}`;

  attachEvents();
}

render();
