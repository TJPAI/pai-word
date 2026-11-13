# CG-MAIN Scene1341 ↔ Scene500 全页面代码审计 V1
**审计范围：** 基线 `a0474da6ecd4f68a75493491535a98f5074ab37a`；原 Scene500 `rebuild-preview/index.html`，独立 Scene1341 `rebuild-preview/scene1341-readonly/index.html`。本文件是**代码/CI审计**，不是 iPhone Safari 像素级实测，也不表示已经达成代码完全一致。

## 统一标准
Scene500 正式体验入口的 UI、交互、设置和页面跳转是权威基准；Scene1341 应只替换 1,341 场景目录、CG-REC 排序、英文 Core20K 字典及 Scene1341 教学 KU。暂未认证 KU 可在独立体验页只读/临时操作，**不得写生产 Scene500 SRS**。原 Scene500 的代码、历史数据及 Pages 路径不动。部署只允许用户手动 GitHub Actions Run workflow。

## 页面审计表
| 模块 | Scene500 源实现 | Scene1341 现状 | 结论 |
|---|---|---|---|
| 欢迎页 | `welcome.js` + `welcome.css` | 独立 `scene1341-welcome.js` + 原 `welcome.css`，隔离欢迎状态 | **视觉复用，不是同一 JS 文件**；需 Safari 实测 |
| 首页 | `home-dashboard.js:renderHome` | 独立 HTML + `renderHome()`；相似 Section/CSS | **重复实现，非代码等价**；历史已发生默认设置展开、分页错位 |
| 场景查询 | 原 `PAI_SCENE_SEARCH`/Scene500 场景列表 | CG-REC `scene1341-rec-bridge.mjs`，1,341 场景目录 | **允许的数据/算法差异**；仅能声称检索联调测试通过 |
| 推荐结果 | 原 `scene-results` + 5 条/页 + 翻页 | 独立页面模拟 5 条/页 + 翻页 | **结构回归通过；DOM/像素未独立证实一致** |
| 最近学习 | `home-dashboard.js:recentHtml`，真实持久化历史 | 独立 `recent-section` + Scene1341 隔离位置 | **行为不同**；属于隔离机制，但 UI 仍需对齐 |
| 题目页 | `learning-runtime.js:learning()` 原生模板 | 独立 `renderCard()` + `scene500-learning.css` | **代码不相同（P0）**；此前缺音标、隐藏页泄漏暴露实际风险 |
| 音标 | `learning()` 读取 `u.w.ipaUS`，Core20K 源值 | QA 1,778 KU 无 `ipa`，另有 Core20K 音标索引，覆盖 1,073/1,778 | **内容覆盖缺口（P0/P1）**；705 条待建设 |
| 答案页 | 原 `window.answerHtml(u)` + 原答案 DOM | 独立静态 `answer` HTML + `renderCard` 填值 | **结构与表现未证明相同（P0）**；差异包括 pos/其他释义/例句区块 |
| 底部三按钮 | `PAI_TAP_FLOW.choose` + 正式评分/持久化状态机 | `scene500-readonly-phase.js:choose`，独立暂存评分 | **逻辑系独立改写（P0）**；生产 SRS 隔离是必要例外 |
| 左右/上下滑动 | 原生 `PAI_NAVIGATE_LEARNING`/`PAI_CHANGE_BATCH` | 独立 `move`/`moveBatch` + 手势 | **模拟回归已有，不是直接共用源** |
| 自动切词、题目/答案状态 | 原生自动浏览与卡面状态控制 | `scene500-readonly-phase.js:createReadOnlyAutoBrowse` | **独立状态机（P0）**；须强化跨切词/后台实际设备测试 |
| 发音 | 原 `window.PAI_AUDIO`，音色/速率、Safari watch dog | 独立 `playWord`/speech synthesis | **重复实现**；节点测试不证明真实 Safari 发音等价 |
| 手写 | 原生 `learning-runtime.js` 手写 IIFE | `scene500-native-scratch.js` 复制/适配 | **需要追踪源码同步**；JS 回归不等于触摸像素等价 |
| 设置 | 原 state/settings，长期持久化 | 独立 `scene500-readonly-settings.js`（10/25/50；0.9/1.5/3/6 等） | **选项数值已检查；独立代码/命名空间**；设置页视觉未验证 |
| 统计 | 原正式日新增、学习轮次、历史记录 | `stats-panel` 显示暂存评分与候选数 | **数据含义不同，界面不等价（P1）**；应复用原版排版并显式标注预览 |
| 继续学习 | 原生学习 session、scene cursor、SRS 历史 | 临时学习位置 + Scene1341 display bookmark | **只读隔离属刻意差异**；续学语义/计数仍需对齐 |
| 生命周期/离线 | 原 Scene500 原生启动、语音后台处理 | 独立启动/手写/音频控制 | **独立运行通路**；需 Safari WebKit 前后台、缓存、回退测试 |

## 审计判定
**不得宣布完全一致。** 当前至少：首页、题目页、答案页、评分状态机、自动切词状态机、发音、统计页是独立实现或存在功能差异，需以**复用原生 Scene500 组件和控制器 + Scene1341 只读数据适配层**替代复制粘贴；不能继续仅靠 CSS、HTML 标记相似来判定完成。

### 代码整改顺序
1. **P0：题目页、答案页**：直接从 Scene500 原生 DOM 模板/样式/控制器抽取共享模块；为 Scene1341 注入 adapter，禁止正式 SRS 写入；截图逐屏对比。
2. **P0：三按钮、滑动、自动切词、手写、发音**：复用相同状态机/事件处理器，临时评分仅由隔离存储适配器拦截；包括题目/答案脸状态、批次内循环、自动/手动一致性和 Safari 后台。
3. **P1：首页、设置、统计、最近学习**：改为 Scene500 同一 DOM 模板/组件；仅将“500”换成“1341”、替换数据；保留原 5 条/页、搜索提交与分页规则。
4. **P1：IPA 生产**：CG-ENLEX 维护 Core20K 单词美/英音标；CG-ENTEACH 为 Scene1341 词组/短语及 KU 增补实际朗读音标与来源，CG-QA 独立语言审核；CG-MASTER 管理 KU/Sense–Scene 关联及来源状态，CG-MAIN 只消费经标记来源的数据并渲染。未验证必须显示待补，不能把单词音标机械拼接冒充整短语已验证音标。
5. **P1：实机验收**：在固定 GitHub Pages Scene1341 路径上 iPhone Safari 逐屏与原 Scene500 对照；未通过时不宣称像素级/操作等价。

### 数据和安全边界
- Core20K 英文词库冻结 20,000 headwords / 27,471 Senses，不可为补音标擅自修改冻结 Sense/身份。IPA 应作为已审核的关联发音数据或明确的词卡扩展字段。
- QA V2 暂通过 1,778 Answer-only KU，可**隔离体验**但不是 1,778 条正式学习 KU；另有 260 阻塞记录不得自动放行。
- 本次 1,073/1,778 音标只是现有 Core20K 拼接/词头参考覆盖率；多词表达不能无审查地视为语音学正式验收。
- 禁止第三方托管，禁止自动发布，禁止修改原 Scene500 及生产 SRS。
