/* 档案与内容数据。呼号 / 姓名 / 简介可在页面上直接编辑，存 localStorage。 */

const KEY = 'orbit-home.profile.v1';

export const DEFAULT_PROFILE = {
  callsign: 'ORBIT-01',
  name: '在轨操作员',
  role: '产品 · 数据 · 可视化',
  base: '地面站 · 十堰',
  bio: '做商用车数字仪表的产品定义，做座舱 Agent 的验收体系，做车路协同的数据治理。业余把时间花在三维可视化和文创生产上——这个页面本身就是其中一件。',
  status: '在轨 · 系统正常',
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch { /* 隐私模式或存储被禁时退回默认 */ }
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* 忽略 */ }
}

export const WORKS = [
  {
    id: 'cluster',
    code: 'PRD-2026-014',
    title: '商用车数字仪表 PRD',
    tag: '产品定义',
    year: '2026',
    summary: '面向商用车的数字仪表产品需求定义：信号矩阵、告警分级、法规项与 HMI 状态机。',
    detail: '把整车 CAN 信号映射到仪表呈现层，定义 12 类告警的优先级与抑制规则，覆盖法规强制项。用状态机描述开机自检、行车、驻车、诊断四种模式下的页面流转，并给出可验收的判定条件。',
    stack: ['CAN / J1939', '状态机', 'HMI', '法规符合性'],
    metric: '信号 214 项 · 告警 12 级',
  },
  {
    id: 'agent',
    code: 'QA-2026-007',
    title: '座舱 Agent 验收体系',
    tag: '质量工程',
    year: '2026',
    summary: '为座舱语音 Agent 建立可重跑的验收流程：当前模型 + 原始资料 + 新会话，不靠重复用例凑数。',
    detail: '定义意图覆盖、误唤醒、多轮上下文、打断与恢复五类用例族，每族给出通过阈值与证据留存方式。验收一律重跑，不复用旧产物；数量不足时如实说明，而不是复制用例填充。',
    stack: ['用例设计', '证据留存', '回归基线'],
    metric: '5 类用例族 · 全量重跑',
  },
  {
    id: 'v2x',
    code: 'DATA-2026-021',
    title: '车路协同数据治理',
    tag: '数据工程',
    year: '2026',
    summary: 'RSU 侧 MEC 数据的采集、解码与治理：从 pcap 到结构化消息，再到可分析的业务事件。',
    detail: '解析 MEC 与 RSU 之间的私有协议，还原消息层结构，识别 SPAT 相位与倒计时、RSI 事件、RSM 参与者等业务内容。建立字段字典与质量规则，把原始抓包变成可追溯的数据资产。',
    stack: ['pcap', '协议解码', 'SPAT / RSI / RSM', '数据字典'],
    metric: '单文件 3619 条 SPAT 相位',
  },
  {
    id: 'tiangong',
    code: 'VIS-2026-003',
    title: '天宫三维可视化',
    tag: '可视化',
    year: '2026',
    summary: '按公开资料真实尺寸建模的中国空间站：三舱 T 字构型、六片柔性太阳翼、十米七自由度机械臂。',
    detail: '1 单位 = 1 米。天和 16.6 × ⌀4.2 m、问天 17.9 m、梦天 17.88 m，实验舱单翼约 28 m。程序化贴图、剖切、舱段聚焦、太阳翼对日跟踪，全部控件实时生效，零外部资产。',
    stack: ['three.js', '程序化贴图', '自定义着色器'],
    metric: '翼展 56 m · 7 自由度',
  },
];

export const LOGS = [
  { date: '2026-11-12', title: '轨道终端开工', body: '决定复用 NASA Blue Marble 贴图与 12 步积分大气着色器，视角改成 400 km 第一人称。站点距离做伴飞视觉压缩，否则 56 米的站在真实轨道间距下只有两个像素。' },
  { date: '2026-11-10', title: '天宫模型交付', body: '三舱 T 字构型完成，全部控件点击式实测通过。修掉三个真实缺陷：按需渲染下控件未触发重绘、低画质绕过 composer 导致自定义着色器偏色、入场动画 fill-mode 覆盖视角条居中变换。' },
  { date: '2026-11-08', title: 'RSU 抓包解码', body: '用权威脚本重跑 mec2rsu 抓包，还原消息层结构。SPAT 相位与倒计时是业务核心，字段字典比原始字节更有价值。' },
  { date: '2026-10-24', title: '座舱验收基线', body: '确立"重跑不复用"的验收原则。旧产物只能作参考，不能作证据。' },
];

export const SKILLS = [
  { name: '产品定义 / PRD', level: .92 },
  { name: '数据治理 / 协议解码', level: .86 },
  { name: '验收体系 / 质量工程', level: .84 },
  { name: '三维可视化 / three.js', level: .78 },
  { name: '文创生产', level: .7 },
];

export const TIMELINE = [
  { period: '2025 — 至今', org: '商用车智能化', role: '产品负责人', note: '数字仪表 PRD、座舱 Agent 验收、车路协同数据治理' },
  { period: '2023 — 2025', org: '车联网数据平台', role: '数据工程', note: 'RSU / MEC 数据接入与治理，字段字典与质量规则' },
  { period: '2021 — 2023', org: '智能座舱', role: 'HMI 产品', note: '仪表与中控交互定义，告警分级与法规符合性' },
];

export const CONTACTS = [
  { label: '邮箱', value: 'operator@orbit.local', href: 'mailto:operator@orbit.local' },
  { label: 'GitHub', value: 'github.com/orbit-01', href: 'https://github.com/' },
  { label: '所在地', value: '中国 · 十堰', href: null },
];

export const STATION_INFO = {
  title: '天宫 · CSS',
  rows: [
    ['构型', '三舱 T 字基本构型'],
    ['天和核心舱', '16.6 × ⌀4.2 m · 22.5 t'],
    ['问天实验舱', '17.9 × ⌀4.2 m · ≈23 t'],
    ['梦天实验舱', '17.88 × ⌀4.2 m · ≈23 t'],
    ['实验舱单翼', '≈28 m · 110 m²'],
    ['大机械臂', '10 m · 7 自由度 · 25 t'],
    ['轨道高度', '≈400 km'],
    ['轨道速度', '7.66 km/s'],
  ],
  note: '画面中的站点距离为伴飞视觉压缩（300–3000 m），非真实轨道间距。真实尺寸下 56 m 的站在数十公里外不足 2 像素。',
};