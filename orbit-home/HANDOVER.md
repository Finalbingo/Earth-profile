# 轨道终端 ORBIT TERMINAL · 交接文档

更新：2026-11-13
维护范围：`orbit-home/`（唯一授权可写的项目目录）；`test-shots/` 为 QA 脚本与截图目录。
只读参考：`tiangong/`、`/Users/Admin/Documents/Codex/2026-10-12/referenced-chatgpt-conversation-this-is-an/outputs/orbit-earth/`、工作区根目录旧文件。

**状态一句话**：第一轮实现已交付并通过全量无头 QA（25 项检查全 PASS、控制台零错误）；用户随后贴出近景截图表示不满（"我有点无语"），第二轮质感精修（任务 #23）**已完成诊断与逐条修改清单，但尚未修改任何源码**。2026-11-13 应用户要求打包移交第三方续作（见 §10），#23 保持 pending，接手者从 §5 的清单继续即可。

---

## 1. 项目是什么

个人主页「轨道终端 / ORBIT TERMINAL」：宇航员第一人称近地轨道 POV，地球占据画面下部、天宫空间站偶尔掠过视野；导航分列左右两端的弧形 AR 轨条（不出现头盔本体）；《流浪地球》UEG/MOSS 式白灰终端 UI，深红仅用于警告；画面中央留给太空主视觉。

技术选型：Three.js r160 vendored（`../vendor/three/build/three.module.js` + importmap），零构建、纯 ES module、无 React/Vite；必须经 HTTP 服务打开（file:// 不行）。

## 2. 用户意见与要求（时间线，含原话）

1. 前序已完成：天宫 Three.js 模型 + 双击启动器（mac `.command` / Win `.bat`）。
2. 主页设想："我的计划是 做个个人主页 上来是个地球 然后这个空间站偶尔会掠过 你觉得 还能加点什么别的吗"。
3. 视角与导航："……但是是宇航员视角 宇航员头盔不是圆的吗 希望导航栏分列左右两端 有一种头盔弯曲and全系操作ar的感觉 你懂我意思吗 **别动我文件 直接回答就行**"。
4. "给我生成个效果图看看行不" → 效果图阶段（ImageGen）。
5. "不需要出现头盔本身 仅导航即可"。
6. "可以 但是UI不好看 **我要流浪地球的字体和UI 应该是白色或者灰色的那种**"。
7. 授权边界："**不是 我没让你改我代码啊 我让你生图呢**" → 此前所有"别动文件/只生图"限定仅被后续明确开工授权解除，且解除范围仅限 `orbit-home/`。
8. 地球资产："地球你准备怎么办" → 给出 Codex `orbit-earth` 路径："你看看这里有你可以参考的吗 主要是地球本身"；"参考这个好 还是咱们自己弄好？" → 结论：**复用其 NASA 贴图、大气 shader 概念与取景公式；场景/相机/HUD 全部自写**。
9. "对 我觉得你说的对 帮我定一个非常详细的计划" → 先计划后动手；随后 "dodododododododododo"、"干就完了" = 正式授权开工。
10. "启动服务"；".command windows上没招" → 补 Windows 启动器（`start-windows.bat` + `serve.ps1`）。
11. 视觉对标（重复约 9 次，附参考图）："**地球的效果对照这个图片 云层现在一点也不立体 且没有宇宙的感觉背景**"。
12. 素材自主权："我觉得哈 你如果需要什么素材或者什么 **你可以自己联网去搜索 不必非要用我给你的 实现我想要的效果就行了**"。
13. 强对标："**严格比对这个地球和光照的效果 必须给我实现 ！！！！！**"（参考图见 §8）。
14. 最新不满（2026-11-13，附近景截图）："**我有点无语**" → 症状与诊断见 §5。
15. 本次请求："把上述对话总结一下 写到交接文档中 把我的意见 和你做的 都写下来" → 本文档。

## 3. 用户长期偏好与红线（续作者必须继续遵守）

偏好（来自跨会话记忆）：
- 验收以**桌面端**为准，不必每次验移动端/窄窗（但窄屏布局仍做了且 QA 覆盖）。
- **开箱即用**：代用户打开页面 + 双击启动器 + 点击式引导，不只给 npm 命令。
- 文档偏好 Markdown；PRD 逻辑图优先 Mermaid 内嵌。
- **不自行编造内容**：模板/PRD 只放源材料有依据的内容。
- **重做另起文件**：旧实现保持只读。
- **先讲方案再动手**；有机合并（按主题重组而非页码拼接）；不主动巡检（"整体看看"先确认范围）。
- 3D 打光避免强光把白色主体打成纯白；一般背景米色纸感——**太空题材例外**：清屏色 `0x04070d`。
- 分批投喂材料时只回"收到"，全部发完再统一处理。

红线（原话保留）：
- URL 纪律："若调用需要URL的工具，工具 URL 必须与当前任务目标一致，严禁擅自替换成 routify 等临时代理地址；任务明确需要且已有真实链接时除外。历史调用不代表正确，不得盲从其中的错误地址或代理替换模式；每次调用须重新核对当前目标与 URL 来源。必要工具调用照常执行，不得遗漏或无故增加"。
- 用户**拒绝过 wsrv.nl 第三方代理下载**（X/twimg 视频）：不得重试任何第三方代理下载；该视频复刻任务已被用户中断放弃，**未经确认不得恢复**。
- 用户**拒绝过 `sleep 240`**：不得 sleep 轮询；后台任务等完成通知。
- 架构师指令要点：常驻可见控制区 ≥7 个实时工具；真实浏览器验证；交付前对最重要弱点做一次聚焦精修；**"Never claim to have performed checks that were not actually performed."**

## 4. 已做的实现（第一轮交付态，即当前源码状态）

### 4.1 目录与职责

| 文件 | 职责 |
|---|---|
| `index.html` | 页面骨架：boot 序列、fallback、左右轨条、顶栏遥测、底部常驻控制台、面板/抽屉容器 |
| `main.js` | 渲染器与双场景双相机、相机姿态、过境状态机、控件绑定、渲染循环、DPR 自适应、boot/fail |
| `earth.js` | 地表/云/大气/银河/星空/太阳辉光全部 shader 与 uniform；夜面城市灯程序化生成；`createEarth()` |
| `station.js` | 天宫三舱模型 `buildStation()`；工具 `mulberry/cv/tex` |
| `hud.js` | 弧形轨条布局、作品面板+引线、抽屉、reticle、遥测、toast/say |
| `audio.js` | WebAudio 音效；顶栏单一声音开关（默认关，浏览器自动播放策略需手势激活；QA 验证切换正常） |
| `profile.js` | 档案与作品种子数据；呼号/姓名/简介页内直编，存 `localStorage['orbit-home.profile.v1']`；WORKS 4 件（`profile.js:26` 起） |
| `styles.css` | 流浪地球白灰终端视觉、扫描线光学层、自定义滚动条 |
| `textures/` | `earth-day-4k.jpg` 4096×2048（NASA Blue Marble 8K 降采样）、`earth-clouds-2k.jpg` 2048×1024、`storm-sat.png` 1024²（ImageGen 本地生成）、`earth-poster.jpg` 兜底海报 |
| `ASSETS.md` | 资产来源、处理与版权（NASA media guidelines；不暗示背书） |
| `启动轨道终端.command` / `start-windows.bat` / `serve.ps1` | 双击启动器；管理 8732 服务并代开页面 |

### 4.2 渲染架构要点（`earth.js` / `main.js`）

- 单 canvas、双场景双相机分层：地球层归一化 R=1（camE near .001 far 30），站点层米制（camS）；`autoClear=false`；ACESFilmic exposure 1.12；清屏 `0x04070d`。
- 相机：yaw .55、**pitch 30°**、fov 68（`main.js:64`）；拖拽环视/滚轮变焦(35–85)/方向键/双击开面板；视差微动。
- 云场共享 GLSL（`earth.js:112` cloudCommon）：NASA 云图仅作大尺度天气掩膜，形状由域扭曲 fbm 生成（否则全球贴图在视野内只有几百 texel）；**台风为卫星风格云图贴花** `stormField`（`earth.js:121`），中心随自转补偿锁定视野（`uStormCenter`），风眼用 `eyeClear` 清场。
- 地表（`earth.js:149`）：海水掩膜由 day 贴图蓝通道比导出；**云影两级半影**沿太阳切向偏移；程序化夜面城市灯（真实城市坐标 CITIES + 城市群 REGIONS，4096×2048 canvas，`earth.js:60`）。
- **构图级光照**（参考图物理上不自洽：太阳入画+中央白昼+右侧夜面不可能同时成立）：屏幕空间 `vNdc` 夜掩膜 `artNight` 画右侧夜+城市灯；左侧金色耀斑池（高斯+条纹噪声、云/陆地遮断）；相机子节点镜头眩光固定左上（`main.js:33-39`）。全部由 `uSunLeft = 1−smoothstep(deg,−40,10)` 门控（`earth.js:494`）：**太阳滑杆右扫过 0° 即恢复纯物理昼夜光照**。
- 云体积（`earth.js:197`）：密度梯度伪法线（E=0.0035）+ 高频絮状起伏；亮顶暗侧、缝隙 AO、背光压暗、晨昏橙边、薄云逆光银边；alpha 边缘噪声侵蚀。
- 大气（`earth.js:303`）：28 步视线积分指数密度；银河球（`earth.js:259`：尘带+洋红星云+三层圆点星尘）+ 13000 星点精灵。
- 过境状态机 IDLE/PASS（`main.js:104` 起）：随机方位/仰角、地平线遮挡判定、reticle 投影与距离标签、警告方块、HUD 播报。
- DPR 自适应 `[1.5, 1.25, 1]`（`main.js:326`），fps<45 连续两窗降档。

### 4.3 常驻控制台（≥7 实时工具，实际 13 滑杆 + 4 开关 + 4 按钮）

滑杆：`cAlt` 轨道高度 400km、`cTime` 时间倍率 1.0×、`cFov` 视场 68°、`cDist` 过境距离 450m、`cSun` 太阳方位 **−30°（step=5）**、`cCover` 云量 75%、`cScat` 散射 3.4、`cExp` 曝光 1.12、`cStar` 星密度 100%、`cHud` HUD 不透明度 100%、`cRelief` 云体积 1.00、`cMilky` 银河 1.00、`cStorm` 气旋 80%。
开关：`cGrid` 关 / `cLabels` 开 / `cWire` 关 / `cSpin` 开。
按钮：`bReset` 复位、`bRandom` 随机姿态、`bPass` 触发过境、`bExport` 导出 PNG；另有 `hudToggle`、`soundBtn`。
全部 `input` 即时生效；DEFAULTS 见 `main.js:57`。

### 4.4 已实际执行的验证（不得重复声称未做的检查）

- 无头 chrome-headless-shell + CDP（Node 原生 WebSocket）：`test-shots/oh-qa.mjs` **25 项检查全 PASS**（boot 移除、时钟、无横向溢出、右轨在屏、fps 表、过境中、reticle、遥测、警告方块、过境结束隐藏、作品面板 4 件、引线、抽屉、Esc×2、内联编辑持久化、滑杆实时×2、控制台行 fit、重置还原、滚轮变焦、HUD 关、声音切换、导出 PNG 2130KB、窄屏轨条堆叠），末行 `CONSOLE ERRORS: none`。最近一次运行输出：任务 b9arq8igy（2026-11-13）。
- 默认视角目检：`test-shots/oh-sun-default.png`（`oh-sun.mjs` 截取）——密实旋臂云墙+风眼、亮顶暗侧、左侧金色耀斑、右侧夜面城市灯、左上眩光、银河背景、青色 rim、地平线≈36% 画高。
- 截图序列 `oh-10-default … oh-18-narrow`；太阳方位扫描序列 `oh-sun-*.png`；诊断脚本 `oh-diag.mjs`、`oh-narrow.mjs`。
- 服务：8731（QA，工作区根 `python3 -m http.server`）与 8732（用户页，.command 管理）均 HTTP 200；已代用户 `open http://127.0.0.1:8732/orbit-home/index.html`。

### 4.5 踩过的坑与修复（经验，勿重犯）

- fragment 用了未声明的 `varying vec2 vNdc` → GLSL 编译失败、地球整体消失；补声明修复。随后 `allow_multiple` 子串编辑误伤 vertex 行造成 vNdc 重复定义 → **子串批量编辑会命中更长的同名行**。
- **孤儿 chrome-headless-shell 子进程跨运行累积**（`chrome.kill` 只杀父进程）→ CPU 争抢 → boot 100s 轮询耗尽、截图卡在 boot。每次 QA 前 `pkill -9 -f 'chrome-headless-shel[l]'`（方括号防自匹配）。
- range `step=5` 会把 −32 snap 成 −30 → 默认值统一落在步长网格上（−30），QA 期望同步。
- 台风眼被填白：阈值过低+基础云+未门控高频噪声 → `smoothstep(0.30,0.62,lum)` + `eyeClear` 抑制 + 噪声幅度门 `amp`。
- 耀斑池发 tan、城市灯橙糊 → 高斯收紧、条纹噪声、halo alpha 降低+speckle 增密。
- 网络：commons.wikimedia.org curl exit 35（SSL 阻断）；**eoimages.gsfc.nasa.gov HEAD 无响应（2026-11-13 复测）** → 不再尝试在线下载贴图；ImageGen 为可靠本地资产路径。

## 5. 最新一轮用户不满 → 诊断 → 待实施修改清单（任务 #23，源码未动）

用户截图（`/Users/Admin/.qoder/tmp/-Users-Admin-Documents-Qoder-2026-11-10-7416ea54/images/7416ea54-d775-4617-81f4-160d3953c88a/0ec643c6-d855-41d8-a7a9-c098609b04c4.png`，近景裁切）症状与对策：

| # | 症状 | 诊断 | 计划修改（位置 → 改法） |
|---|---|---|---|
| 1 | 近景地表/云糊 | 4K/2K 贴图近景放大 3×+；retina 下 DPR 上限 1.5 偏软；**本地无 8K 源**（orbit-earth 与 Downloads 均仅 4K），网络阻断不再下载 | `main.js:326` DPR_LEVELS → `[2, 1.5, 1.25, 1]`；`earth.js:371` anisotropy 8→16；地表加程序化微细节 `albedo *= 0.82+0.36*fbm(vUv*vec2(2600,1300))*land + …` |
| 2 | 云扁平、无体积 | fbm 对比不足、伪法线权重弱、暗侧不够暗 | cloudBase/cloudLite 对比 `shape*1.55−0.60`；cloudLite 加一档 `vnoise(uv*vec2(2300,1150))` 细节（幅度门控）；cloudsFragment：E 0.0035→0.0024、gx/gy 2.4→3.0、hf 权重 1.1→1.8（freq 700→1000）、d0 三档幅度 0.34/0.16/0.09、环境 0.18→0.14、key 2.45→2.6、暗侧 mix 0.55→0.42、顶 boost 0.75→0.95、alpha 边 th+0.07→th+0.05 |
| 3 | 金色耀斑池像脏棕抹痕 | streak 噪声过粗 + water 掩膜软导致漏到陆地 | 高斯收紧 0.19/0.24；`smoothstep(0.55,0.85,water)` 严格海水；streak `vnoise(vec2(vUv.x*6200, vUv.y*950))` pow3；色 `mix(vec3(1,.78,.40), vec3(1,.95,.80), pool)*1.35` |
| 4 | 台风贴花边缘锯齿 | 1024² 贴花放大后阈值化等值线锯齿 | stormField 阈值前加纤维 dither：`lum += (fbm(tuv*60)−0.5)*0.30 + (vnoise(tuv*240)−0.5)*0.16` |
| 5 | 盘内发奶、宇宙感弱 | 大气 optical 盘内雾度偏强；银河偏暗 | atmosphereFragment `vec3(0.008,0.025,0.065)*optical` → `vec3(0.004,0.013,0.034)`；skyFragment glow 0.10→0.13、洋红 0.9→1.05、星层 2.6/1.9/1.3→2.9/2.1/1.45 |
| 6 | 复位后构图与默认不一致 | `main.js:239` bReset 写死 pitch 24°，默认 30° | bReset `look.tPitch = 30*D2R` |

验证计划：新建 `test-shots/oh-detail.mjs` 三视角目检（默认；拖拽 dy≈−111px + 滚轮 −6 步 ≈ pitch16°/fov50 近景；fov40 台风特写），Read PNG 目检后再全量复跑 `oh-qa.mjs`（先 pkill 清理）。
**当前状态：诊断完成、清单就绪、earth.js/main.js 仍为第一轮交付态，未做任何本轮编辑。** 本轮修改未开工即应用户要求随包移交（§10），由接手者实施。

## 6. 环境与操作手册（续作者必读）

- 服务：8731 = 工作区根 `python3 -m http.server 8731`（QA 用）；8732 = 用户页（`启动轨道终端.command` 探测并自启）。接手先 `curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:8732/orbit-home/index.html` 确认。
- 无头 Chrome：`/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell`，参数 `--no-sandbox --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars --remote-debugging-port=<port> --user-data-dir=/tmp/<uniq> --window-size=1600,1000`。
- QA 流程：`pkill -9 -f 'chrome-headless-shel[l]'` → `node test-shots/oh-qa.mjs`（**run_in_background**，等完成通知，不 sleep 轮询）→ 读输出尾部确认 `CONSOLE ERRORS: none` → 再 pkill 清理 → 代开用户页。
- boot 轮询 100×1s + 1.5s settle；过境结束轮询 60×1s + 1.5s。SwiftShader 下 2–3 fps 属正常，DPR 自适应会降档。
- **捕获加载期间不得改源码**；**不得并发两个 SwiftShader chrome**。
- 参考图（用户对标目标）：`/Users/Admin/.qoder/tmp/-Users-Admin-Documents-Qoder-2026-11-10-7416ea54/images/7416ea54-d775-4617-81f4-160d3953c88a/6b057ae1-cd0b-4660-952a-85fa04985532.png`（与早期 `0fe64bc9-a0d6-49e9-b30a-327ecbc79cc6.png` 同图）。参考特征：密实连续台风云盾+细旋臂纤维+小风眼、爆米花积云亮顶暗侧带投影、左海面金色耀斑池、右夜面 crisp 金色城市灯、左上太阳眩光、斜向银河+洋红星云+尘带+密星、青色 rim、地平线≈33% 画高。
- 任务台账：#1–#22 completed；**#23 in_progress（诊断完成、未改码）**。

## 7. 建议下一步顺序

1. 按 §5 清单实施 shader/主循环编辑（一次聚焦精修，不扩scope）。
2. `oh-detail.mjs` 三视角截图 + Read 目检；不达标只迭代最弱一项。
3. pkill → 全量 `oh-qa.mjs` 复跑 → 核对尾部零错误 → pkill。
4. 代开 `http://127.0.0.1:8732/orbit-home/index.html`，中文简短交付（附截图与启动器链接）。
5. 更新本文档 §5 状态与任务 #23。

## 8. 关键链接

- 项目入口：`orbit-home/index.html` ・ 启动器：`orbit-home/启动轨道终端.command`、`orbit-home/start-windows.bat`
- 核心源码：`orbit-home/earth.js`、`orbit-home/main.js`、`orbit-home/hud.js`、`orbit-home/station.js`、`orbit-home/profile.js`、`orbit-home/styles.css`
- 资产与版权：`orbit-home/ASSETS.md`、`orbit-home/textures/`
- QA：`test-shots/oh-qa.mjs`、`test-shots/oh-sun.mjs`、默认视角 `test-shots/oh-sun-default.png`
- 外部只读参考：Codex `orbit-earth/`（NASA 贴图与大气 shader 概念来源）
- 文生图产物与用户参考图：`orbit-home/design-refs/`（清单见 §9）
- 交接包：工作区根 `orbit-terminal-handover-2026-11-13.zip`（清单见 §10）

## 9. 文生图（ImageGen）产物清单

全部已拷入 `orbit-home/design-refs/` 随包交付；保留原始文件名以便追溯。

| 包内路径 | 原始文件 | 内容与用途 | 用户裁决 / 现状 |
|---|---|---|---|
| `design-refs/mockup-01-helmet-idle.png` | `vibe_images/helmet-home-idle_1794466915411_38579b66.png` | 第一版效果图：宇航员头盔面窗 POV + 左右弧形导航 + 地球 limb 与天宫掠过（16:9） | 否：头盔硬件不得出现（"不需要出现头盔本身 仅导航即可"） |
| `design-refs/mockup-02-helmet-panel.png` | `vibe_images/helmet-home-panel_1794466997605_5eabf57c.png` | 头盔版 + 中央内容面板展开态 | 随头盔版一并否掉 |
| `design-refs/mockup-03-nav-only.png` | `vibe_images/orbit-home-nav-only_1794467087484_f1bccccc.png` | 去头盔版：太空满幅出血 + 左右弧形导航 | 构图认可；配色被否（"UI不好看"） |
| `design-refs/mockup-04-ueg-white.png` | `vibe_images/orbit-home-ueg-white_1794467393853_48848146.png` | 流浪地球 UEG 白灰终端版效果图 | **认可的视觉方向**，第一轮实现依据 |
| `textures/storm-sat.png` | `vibe_images/storm-sat_1794533988964_baf6893f.png` | 卫星视角台风亮度贴花 1024² | **在用**：`earth.js` stormField 采样并重光照 |
| `design-refs/ref-target-earth.png` | 用户附件 `6b057ae1-cd0b-4660-952a-85fa04985532.png` | 用户要求严格对标的地球/光照构图目标图 | 目标图（非生成产物） |
| `design-refs/user-complaint-closeup.png` | 用户附件 `0ec643c6-d855-41d8-a7a9-c098609b04c4.png` | 2026-11-13 用户近景不满截图 | 任务 #23 诊断依据（§5） |

Prompt 要点（供复现/重生成）：
- 效果图系列："Astronaut EVA helmet visor POV personal homepage UI mockup, curved holographic AR nav rails left and right, Earth limb and Tiangong station passing, 16:9"；后续迭代按用户裁决追加约束：无头盔硬件仅导航；流浪地球 UEG/MOSS 白灰细线终端 UI、红仅告警；**天宫必须 T 字三舱**（生图模型惯性画成 ISS 桁架，需显式指定）。
- storm-sat：卫星俯视台风、密实旋臂雨带纤维 + 清晰风眼、灰度亮度图、无文字无水印。

## 10. 交接包

- 包文件：工作区根 `orbit-terminal-handover-2026-11-13.zip`（与 `orbit-home/` 同级）。
- Git 仓库：https://github.com/Finalbingo/Earth-profile （main 分支；入库内容与 zip 同构：`orbit-home/`、`vendor/three/`、`tiangong/`、`test-shots/` QA 脚本与截图；不含 zip 本体与 oh-* 之外的历史诊断截图）。
- 内容与布局（解压后保持同级关系，双击启动器即可运行；importmap 依赖同级 `vendor/`）：
  - `orbit-home/`：全部源码、textures、design-refs、ASSETS.md、本文档、三平台启动器
  - `vendor/three/`：`build/three.module.js` + `examples/jsm`（importmap 依赖）
  - `tiangong/`：前序天宫模型项目（station.js 的来源，含其自有模型 zip 与启动器）
  - `test-shots/`：`oh-qa.mjs` / `oh-sun.mjs` / `oh-diag.mjs` / `oh-narrow.mjs` 与 `oh-*` 截图（QA 证据）、`15-final-hero.png` / `16-debris-fix.png`（天宫终版截图）
- 接手者最小路径：解压 → 双击 `orbit-home/启动轨道终端.command`（mac）或 `start-windows.bat`（Win）→ 自动开 `http://127.0.0.1:8732/orbit-home/index.html`；QA 与环境纪律见 §6。
- 未入包：Codex `orbit-earth/`（外部只读参考，所需贴图已在 `orbit-home/textures/`）、node_modules、oh-* 与天宫终版之外的历史诊断截图。