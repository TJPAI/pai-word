# PAI Word

移动优先的英语词汇学习应用。`core13000-integration` 集成 Core-13000 V25.5；`main` 的正式版本未变更。

## 当前连续试用版本

本分支现在只使用 **完整 Core-13000 V25.5** 作为学习词库，不再维护 Core-5000 子范围，也不提供 5,000 / 13,000 范围切换。13,000 个词均可进入学习队列；SRS 主键始终为 canonical `ku_id`。

固定分支预览地址：

https://raw.githack.com/TJPAI/pai-word/core13000-integration/index.html

这是第三方静态 **临时预览**，不是正式生产部署；地址固定并随 `core13000-integration` 更新，但可能存在短时缓存。它与正式 GitHub Pages 不是同一 origin，因此 localStorage 学习进度互相隔离。未经批准不修改 `main`、不合并。

当前产品行为：

- 唯一学习词库为全部 13,000 词；SRS 主键为 canonical `ku_id`。
- 首页提供“词库”入口，可搜索英文或中文释义、打开任意收录词并选择具体 canonical 义项；浏览不会写学习记录。
- 每日新词额度为**全应用合计**（默认 20），不按每个场景分别分配；到期复习不受新词额度限制。
- 未可靠定稿的 domain 继续留在“通用词汇 · 待分类”，不随机分配场景。
- 完整 Core-13000 采用 offline-first 本地缓存：首次联网加载并完成 SHA-256 校验后，将 manifest、实际使用的 4 个压缩 pack 和辨析数据写入独立 IndexedDB；后续启动优先读本地并再次校验。
- 新增 `sw.js` 缓存 HTML/CSS/JS App shell；数据 pack 不重复放进 Cache Storage，而由 IndexedDB 单独管理。首次成功缓存后，目标行为是断网也能启动和学习。
- 词库缓存与 `records[ku_id]` 学习进度分离；更新/重下词库不应删除 SRS 记录。
- 当前会话没有 Browser/手机设备控制能力，因此手机 Safari 的真实离线启动、搜索/评分/复习/刷新持久化仍需浏览器验收；不得把代码测试等同于 Safari 已通过。

## 集成分支

- 13,000 个词，源排序 1–13,000；不是重新计算的现代词频排名。
- 16,202 个唯一 canonical `ku_id`，学习、到期复习、自由复习均使用该标识。
- 4 个原始 Brotli pack，SHA-256 与原 manifest 一致；4 个 gzip 兼容包解压后与原始数据逐字节相同。
- 启动时校验包大小、SHA-256、解压大小、版本、列结构、词序及 KU 唯一性。任何失败显示错误和重试入口，不静默退回旧词库。
- 浏览器支持 native Brotli `DecompressionStream` 时加载 `.br`；否则加载 `.gz`。需要支持 gzip `DecompressionStream` 的现代浏览器、HTTPS 或 localhost。
- 10 个原有场景通过明确的源 domain 对应；未知、空 domain 和 `time_space_abstract` 保留为“通用词汇 · 待分类”，共 13,406 个知识单元。此对应不代表完整场景标注已定稿。
- bilingual 例句、搭配、使用提醒来自 pack。例句按词条导出，尚未单独绑定每个义项；语音只朗读英文例句。
- 30 个义项缺少 `ku_id`：保留在词条元数据和“其他释义”中，不生成虚假 KU。所有词均至少有一个可学习 KU。
- 593 个词双口音音标均缺失，更多词缺少英音音标。当前口音音标缺失时明确显示待补充，不将美音标为英音。未导出的词源及未覆盖的辨析不伪造。
- 外部词典、语料搭配及例句核验仍按源库继承/PENDING；集成与结构校验不是教学质量核验。

## 加载链

`mobile.js → core-loader.js → core-bootstrap.js → daily.js → ipa-accent.js → app-runtime.js → product-v2.js`

`core-bootstrap.js` 等待全部 pack 通过校验并完成迁移后才初始化每日队列和页面。旧扩词和辨析脚本退出正式加载链；有旧版 SRS 记录时，仅在首次迁移前按需加载 3 个旧扩词脚本以识别旧义项。

## 本地词库 / 离线优先

词库缓存使用独立数据库 `pai-word-lexicon-v1`，不与 SRS 状态共用存储空间。

1. 启动先读取本地 manifest；若本地没有，再联网下载并缓存。
2. 每个压缩 pack 以 `filename@sha256` 作为缓存键。本地命中后仍重新检查字节数和 SHA-256；损坏缓存会删除并重新联网获取。
3. 当前浏览器实际使用 Brotli 或 gzip 中的一种；下载成功后把该压缩文件保存到 IndexedDB，不保存 89 MB 编辑 master，也不把 13,000 词展开后永久重复存储。
4. `comparisons-001.json` 同样进入本地缓存并继续做 SHA-256 与义项绑定校验。
5. `navigator.storage.persist()` 可用时会申请持久存储；结果记录在 `PAI_LOCAL_LEXICON.persistent`，但代码不把申请失败等同于加载失败。
6. App shell 由 `sw.js` 缓存；词库 data 路径被明确排除，避免 Service Worker 与 IndexedDB 双份保存同一 pack。
7. 本次启动成功后后台检查在线 manifest；若发现 SHA/版本签名变化，只标记更新，不在正在学习时强制替换当前内存数据。
8. UI 会区分“首次使用将保存到本机”“词库已保存本机”“可离线启动”等状态；只有 manifest、当前实际使用的 4 个 pack 和辨析数据都成功写入本地时才把词库数据标记为 offline-ready。

以上是代码级实现；当前聊天环境没有真实 iPhone Safari 控制能力，因此 **尚未宣称手机 Safari 断网重启已验收通过**。

## 进度迁移

本地存储主键继续使用 `pai-word-mobile-v1`，新数据带 `srsSchema: ku_id-v1`。

1. 在任何存储变更前，将原状态完整保留到 `pai-word-mobile-v1::before-ku-id-v1`，且永不覆盖该备份。
2. 已知 canonical KU 的原 due、interval、reps、last 等字段原样保留。
3. 旧 `word::scene` 仅在词形、明确场景和规范化后的释义唯一且完全匹配时转为 KU；冲突、歧义或未匹配记录进入 `legacySrsPending`，不丢弃、不合并复习间隔。
4. 每日分配和自由复习缓存重新生成，偏好及答题统计保留。迁移标识使重启幂等。
5. 备份或迁移写入失败则中止加载，原存储不变。统计页显示待确认记录数量；尚未实现人工确认映射界面。

旧词库 193 个义项的模拟全量迁移测试中，精确映射为 0、待确认 193。这是严格匹配的实测结果，不代表用户设备上实际保存了 193 条记录；也不能据此宣称历史记录已全部转成 KU。

## 验证

运行 `node --test tests/core13000.test.cjs`（Node 24，无额外依赖）。历史 Core-13000 集成测试共 11 项通过：真实 HTTP 取包及校验、全部词/知识单元与答案字符串、末尾词学习/到期复习/自由复习、刷新持久化、gzip 兼容路径、唯一映射与冲突保护、旧进度保留及幂等、损坏/404/存储失败保护。

`tests/product-v2.test.cjs` 在隔离 Node VM 中验证：

- 每日新词是全应用单一额度，不是每场景各一份；
- daily 元数据固定使用完整 13,000 词范围；
- 旧状态即使曾保存 `lexiconLimit=5000`，启动产品层后也统一迁移到 13,000，而不删除已有 `records[ku_id]`；
- 打开词库词条及选择义项不改变既有 SRS 记录。

`tests/offline-cache.test.cjs` 增加离线缓存契约检查：

- loader 必须先查 IndexedDB，再访问网络；
- 本地命中仍必须执行 SHA-256；
- offline-ready 必须依赖本地 manifest 和所需资产均成功落盘；
- Service Worker 必须缓存 App shell，但明确排除 `data/core13000-v25.5/`，避免 pack 双份缓存。

上一轮真实 Chrome 验证（旧产品层）使用已提交分支的第三方静态预览：

- 验证提交：`dd7bcc43cd7cb4f620388801e4bbe5868efd175f`。
- 临时预览：https://raw.githack.com/TJPAI/pai-word/dd7bcc43cd7cb4f620388801e4bbe5868efd175f/index.html
- 视口 1363×936；页面标题 PAI Word、非空、无框架错误界面，无横向溢出。
- 全部 pack 通过运行时完整性校验后，场景页显示 Core-13000 V25.5。
- “通用词汇 · 待分类” → the → 展开释义及双语例句 → 点击“知道” → be，剩余新词 20→19。
- 刷新重新加载后，剩余新词仍为 19，进度持久化通过。
- 控制台无应用错误；出现的 browser metadata 消息错误来自浏览器扩展，非应用脚本。

Safari、手机视口、实际音频输出尚未验收。当前产品层的词库浏览/搜索、全局新词额度以及 offline-first 本地缓存也尚未完成真实浏览器点击/断网验收；不能沿用旧 Chrome 结果冒充本轮验收。第三方预览不是生产部署，其 localStorage/IndexedDB 与正式站点隔离，未访问或修改用户生产学习进度。`main` 未修改。

本地运行：`python3 -m http.server 8765 --bind 127.0.0.1`，访问 `http://127.0.0.1:8765/`。

## 近义 / 易混词辨析：首批 45 个义项

新增 `comparisons-001.json`，以 canonical `ku_id` + `sense_id` + 释义绑定，启动时校验文件 SHA-256 和每项对应关系。共覆盖 39 个词、45 个义项，每项含 3 个近义或易混词的区别和 3 对中英文例句。栏目使用“近义 / 易混词辨析”，不会把 account / balance / statement 等相关词误称为同义词。

- 20 项来自旧版数据，已按具体新版义项重新对应和校订。例如 plot 的“情节”和“绘制”分别绑定；绘制义项统一使用动词例句，避免原来的动词与名词混用。
- 25 项为新编核心高频词内容：make、do、say、tell、speak、see、look、watch、get、give、take、go、come、want、need、know、think、good、big、small、important、new、use、work、time。
- 内容状态为编辑稿 `EDITORIAL_DRAFT_EXTERNAL_CHECK_PENDING`，没有宣称经过外部词典/语料核验。
- 其他义项继续显示“待补充”，不按同词形复制辨析，不将一项内容扩散到其他词义。
- 旧版完整审查队列在 `comparison-migration-review.json` 中：193 项中 20 项迁入校订，77 项待义项审核，96 项待补全内容。该队列不进入 runtime。
- `?word=make` 等链接打开首个义项的只读词条预览，展示完整教学内容，打开时不写入进度。新的“词库”入口提供完整搜索和具体义项选择。
- 增加辨析完整性、串义防护、损坏和错误绑定拒绝测试，共 11 项测试通过。

上一批浏览器验证（Chrome，1363×936）：提交 `efa565d9af601c00f5deb96bc34cab6f105b2eec` 的 `index.html?word=make` 实际显示 make / do / create 三项中文区别与英文例句、中文译文；返回场景页通过；关闭辨析选项并刷新后内容隐藏，重新开启后恢复。页面非空、无框架错误界面，控制台无应用错误（浏览器扩展 metadata 消息错误不属于应用）。截图确认三组内容无重叠。Safari 和手机视口尚未验收。


## Learning flow revision (2026-10-14)

Production entry now uses `lazy-loader.js` and the generated `learning-runtime.js`.
`flow-v2.js`, `scene-study.js`, `swipe-v2.js`, and `product-v2.js` remain as historical sources but are no longer loaded.

- Today selects new words from the selected category (default: daily); function words are separated. Unclassified vocabulary is presented in frequency bands, not claimed as curated scenes.
- One persisted session queue owns study, due review, and free review. New words get a second retrieval; Again/Hard returns after up to four intervening cards, or sooner at the end. Unresolved items are immediately due and survive reload. Progress counts completed unique KUs against a fixed total.
- Scheduling is a transparent heuristic, **not** a fitted forgetting model or FSRS. Response time is recorded but is not interpreted as a calibrated memory score.
- First load downloads a checked catalog. Full cards are loaded in 250-word chunks and adjacent cards are prefetched. IndexedDB caches content by digest. Download-all is optional in settings.
- Canonical 13,000 words / 16,616 KU IDs remain intact. Content screening suppresses obvious templates; it does **not** turn dictionary/corpus validation into PASS. See `data/learning-v3/content-audit.json`.
- Speech uses device TTS in US English. Empty examples/collocations/comparisons are hidden. App icons include an Apple touch icon.

Rebuild:

```sh
node scripts/build-learning-packs.cjs
node scripts/build-runtime.cjs
node --test tests/learning-v3.test.cjs
```

The pack builder reads the original checked V25.5 Brotli packs and V26.7I overlays; `core-loader.js` supplies the source adapter at build time only. No canonical source word pack is edited. Tests for retired v2 runtime behavior are retained as historical tests; the active learning flow is covered by `learning-v3.test.cjs`.

### Experimental tap timing (2026-10-15)

`tap-flow.js` replaces reveal/rating buttons on learning screens. The first blank-space tap measures time since the hydrated card rendered: <=1s Good, >1s–3s Hard, >3s Again; answers remain visible for 1/3/5s respectively before committing once and advancing. A second blank-space tap cancels that deadline, persists an unknown marker, and reads the word five times with a one-second gap after each completed utterance, then advances. Thresholds, display durations, repeat count and gap are temporarily editable in settings. Leaving the view or backgrounding cancels timers/speech; foregrounding restarts the recall clock. Scrolls, text selection and controls do not grade. These thresholds are an experimental user-selected policy, not validated memory estimates.

```sh
node scripts/build-runtime.cjs
node --test tests/tap-flow.test.cjs tests/learning-v3.test.cjs
```
