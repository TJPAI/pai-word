# Scene1341 ↔ Scene500 UI 与交互代码对照审核｜2026-11-11

## 1. 审核基准
- **唯一产品基准**：`rebuild-preview/learning-runtime.js` 中当前生效的 `learning()`、`PAI_TAP_FLOW`、`PAI_NAVIGATE_LEARNING`、`PAI_CHANGE_BATCH`、`browseAnswer`、`PAI_AUTOBROWSE` 和原生手写子系统。不可用过时的根目录 `tap-flow.js` 代替现行控制器。
- **被审核对象**：`rebuild-preview/scene1341-readonly/index.html`、`scene500-readonly-phase.js`、`scene500-native-scratch.js`。
- **数据边界**：1,182 条作者草稿／30 Packs；正式已认证 KU = 0；此预览严禁写正式 SRS 或启动生产发布。
- **验收原则**：共用 Scene500 的布局、按钮位置、页面状态和交互政策；Scene1341 只替换场景/教学数据。代码 QA 不代表 Safari 像素级验收。

## 2. 对照结果

| 核对点 | Scene500 基准 | Scene1341 检查及修复 | 目前判定 |
| --- | --- | --- | --- |
| CSS 加载 | mobile / ux-fix / product-v2 / learning / home-dashboard 五份，顺序固定 | 同五份字节相同的 CSS，已加代码验证 | 代码 PASS |
| 学习卡 DOM | 固定 `.word-hero` 与滚动 `.study-body` 并列 | 已恢复相同 DOM 层级 | 结构 PASS |
| 顶部及三键 | `study-top`／三档 `recall-correction` | 采用同原生 class 与内联布局块；评级仅内存 | 结构 PASS，像素待测 |
| 題目/答案模式 | `preferredPageState`，仅显式点空白更改 | `preferredFace` 分离于评分显答案；切词／换批／自动切仍保留 | 动态测试 PASS |
| 点击答案正文 | 原生答案容器禁止向上冒泡引发翻面 | 单个委托事件处理器排除 `.answer` | 代码 PASS |
| 空白点击/键盘 | 全屏空白、Space；避开控件/文字选择/误触 | 已统一为单个委托处理器及焦点保护 | 代码 PASS |
| 左右滑动 | 65px，方向比1.3；两端循环 | 改为同阈值、对单词总数循环 | 静态/算式测试 PASS |
| 上下滑动 | 75px，方向比1.3；批次循环 | 改为同阈值、对批次总数循环 | 静态/算式测试 PASS |
| 默认每批 | 10 个 KU，正式设置可选 10/25/50 | 演示默认 10；其他档尚未开放 | 默认 PASS，设置欠缺 |
| 自动切词 | 常规 0.9/1.5/3/6秒，朗读结束后 0.2/0.6/2/5秒 | 改为同一双计时政策和四档 UI 标签 | 动态测试 PASS |
| 自动切词 + 手写 | 自动导航可继续，覆盖层通过 `PAI_SCRATCH_AUTO_TRANSITION` 恢复 | 同原生过渡标识 | 代码 PASS |
| 切后台/回前台 | 暂停定时，不关闭已选自动模式；前台继续 | 改为 `pause/resume`，不重置选择 | 动态测试 PASS |
| 手写 | 600ms 长按、再次长按擦除、平滑绘制、Safari 防选择 | 迁移现行原生手写代码并加只读恢复 adapter | 代码 PASS，触控待测 |
| 评分触发 | 题目页也能选择评分并显示答案 | 同一规则 | 动态测试 PASS |
| 评分时长/重读 | 知道2秒/1遍；模糊4秒/2遍；不知道6秒/3遍；语音及最短时长均完成才切词 | 补入重读次数、1秒间隔、异步语音完结门禁、超时保护 | 动态测试 PASS，实际语音待测 |
| 进入/切词发音 | 按口音/语速设置读词 | 已补默认 en-US 朗读；未重建全部个性化选项 | 默认已补，配置未齐 |
| 继续上次学习 | 正式版可恢复学习游标/页面 | 草稿只在当次页面会话用 Map 保存当前位置与所选题目/答案模式 | 会话内 PASS，重载后的持久恢复禁用 |
| SRS | 正式已认证 KU 可提交记录 | 草稿 0 已批准，不可持久提交 | 故意隔离，PASS |

## 3. 尚未闭环，不能宣称“一模一样”
1. **iPhone Safari 双页像素对照未做**：必须测长词、较长例句、空选项、软键盘、安全区、字号、横竖屏。
2. **仍是独立轻量渲染器**：Scene1341 的 `renderCard` 未直接调用 Scene500 的完整 `learning()`；原生 HTML/CSS 多处一致，但不能仅以结构测试保证全屏像素相同。
3. **设置页面与首页工作流仍有差异**：Scene500 支持批次 10/25/50、口音 en-US/en-GB、朗读速度 80/100/120/150%、自动读音开关、听音隐藏单词及其他设置；Scene1341 只读演示没有全部配置 UI。不得把缺失视为测试通过。
4. **原生发音引擎的语音选择/播放回调仍不同**：Scene500 有 `PAI_AUDIO` 播放、语音空闲与 Safari 保护；Scene1341 是受控 `speechSynthesis`，已对齐默认政策和重读数量，但须实际验证声音/取消/重试。
5. **原生 SRS/持久书签不可用于未认证 KU**：Scene1341 刻意不写任何持久学习记录，因而跨刷新继续学习与正式 App 不等价；这是发布门禁，不是允许放宽的缺陷。
6. **内容不同导致答案面板高度不同**：Scenario 答案含中英例句、搭配与必要用法；必须避免为追求像素相同而截断真实教学内容。布局骨架应一致，实际内容自然伸缩。

## 4. 自动化测试
运行 `node tools/integration/test-scene1341-readonly-mobile-demo.mjs`，对照原生源码并 V8 实跑：
- 题/答案保持与三类导航；
- 评分 2/4/6 秒 + 1/2/3 遍语音，取消陈旧回调；
- 自动浏览两套间隔、语音结束门禁、手写过渡、后台暂停/恢复；
- 点击正文防翻页、循环切词与换批、10 词默认；
- 手写控制器源兼容性；
- 未认证内容无 SRS、localStorage、IndexedDB 持久化。
另需通过 Four-line integration contract QA。

## 5. 发布验收与部署边界
- 仅部署 `v22-integration` 独立预览；核对在线 `preview-source-sha.txt`、HTML、phase.js、scratch.js；旧稳定版与正式 Runtime 不修改。
- 在 iPhone Safari 上与真实 Scene500 并排核对题目、答案、两方向滑动、自动浏览、手写、评分朗读、返回继续、触控错位和底栏。
- 只有源码、CI、线上资源校验和真机 E2E 全部通过后，才可使用“UI/交互完全一致”的结论。
