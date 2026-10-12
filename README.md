# PAI Word

移动优先的英语词汇学习应用。`core13000-integration` 集成 Core-13000 V25.5；`main` 的正式版本未变更。

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

`mobile.js → core-loader.js → core-bootstrap.js → daily.js → ipa-accent.js → app-runtime.js`

`core-bootstrap.js` 等待全部 pack 通过校验并完成迁移后才初始化每日队列和页面。旧扩词和辨析脚本退出正式加载链；有旧版 SRS 记录时，仅在首次迁移前按需加载 3 个旧扩词脚本以识别旧义项。

## 进度迁移

本地存储主键继续使用 `pai-word-mobile-v1`，新数据带 `srsSchema: ku_id-v1`。

1. 在任何存储变更前，将原状态完整保留到 `pai-word-mobile-v1::before-ku-id-v1`，且永不覆盖该备份。
2. 已知 canonical KU 的原 due、interval、reps、last 等字段原样保留。
3. 旧 `word::scene` 仅在词形、明确场景和规范化后的释义唯一且完全匹配时转为 KU；冲突、歧义或未匹配记录进入 `legacySrsPending`，不丢弃、不合并复习间隔。
4. 每日分配和自由复习缓存重新生成，偏好及答题统计保留。迁移标识使重启幂等。
5. 备份或迁移写入失败则中止加载，原存储不变。统计页显示待确认记录数量；尚未实现人工确认映射界面。

旧词库 193 个义项的模拟全量迁移测试中，精确映射为 0、待确认 193。这是严格匹配的实测结果，不代表用户设备上实际保存了 193 条记录；也不能据此宣称历史记录已全部转成 KU。

## 验证

运行 `node --test tests/core13000.test.cjs`（Node 24，无额外依赖）。

11 项测试通过：真实 HTTP 取包及校验、全部词/知识单元与答案字符串、末尾词学习/到期复习/自由复习、刷新持久化、gzip 兼容路径、唯一映射与冲突保护、旧进度保留及幂等、损坏/404/存储失败保护。

本地浏览器下载失败、云浏览器无法连接 localhost 后，使用已提交分支的第三方静态预览完成真实 Chrome 验证：

- 验证提交：`dd7bcc43cd7cb4f620388801e4bbe5868efd175f`。
- 临时预览：https://raw.githack.com/TJPAI/pai-word/dd7bcc43cd7cb4f620388801e4bbe5868efd175f/index.html
- 视口 1363×936；页面标题 PAI Word、非空、无框架错误界面，无横向溢出。
- 全部 pack 通过运行时完整性校验后，场景页显示 Core-13000 V25.5。
- “通用词汇 · 待分类” → the → 展开释义及双语例句 → 点击“知道” → be，剩余新词 20→19。
- 刷新重新加载后，剩余新词仍为 19，进度持久化通过。
- 控制台无应用错误；出现的 browser metadata 消息错误来自浏览器扩展，非应用脚本。

Safari、手机视口、实际音频输出尚未验收。JavaScript 的末尾词、到期复习、自由复习、gzip 回退和迁移故障路径由上述运行测试验证；没有宣称这些都已通过浏览器点击验收。第三方预览不是生产部署，其 localStorage 与正式站点隔离，未访问或修改用户生产学习进度。`main` 未修改。

本地运行：`python3 -m http.server 8765 --bind 127.0.0.1`，访问 `http://127.0.0.1:8765/`。


## 近义 / 易混词辨析：首批 45 个义项

新增 `comparisons-001.json`，以 canonical `ku_id` + `sense_id` + 释义绑定，启动时校验文件 SHA-256 和每项对应关系。共覆盖 39 个词、45 个义项，每项含 3 个近义或易混词的区别和 3 对中英文例句。栏目使用“近义 / 易混词辨析”，不会把 account / balance / statement 等相关词误称为同义词。

- 20 项来自旧版数据，已按具体新版义项重新对应和校订。例如 plot 的“情节”和“绘制”分别绑定；绘制义项统一使用动词例句，避免原来的动词与名词混用。
- 25 项为新编核心高频词内容：make、do、say、tell、speak、see、look、watch、get、give、take、go、come、want、need、know、think、good、big、small、important、new、use、work、time。
- 内容状态为编辑稿 `EDITORIAL_DRAFT_EXTERNAL_CHECK_PENDING`，没有宣称经过外部词典/语料核验。
- 其他义项继续显示“待补充”，不按同词形复制辨析，不将一项内容扩散到其他词义。
- 旧版完整审查队列在 `comparison-migration-review.json` 中：193 项中 20 项迁入校订，77 项待义项审核，96 项待补全内容。该队列不进入 runtime。
- `?word=make` 等链接打开首个义项的只读词条预览，展示完整教学内容，打开时不写入进度。预览不是词典搜索或全部义项浏览功能。
- 增加辨析完整性、串义防护、损坏和错误绑定拒绝测试，共 11 项测试通过。

本批浏览器验证（Chrome，1363×936）：提交 `efa565d9af601c00f5deb96bc34cab6f105b2eec` 的 `index.html?word=make` 实际显示 make / do / create 三项中文区别与英文例句、中文译文；返回场景页通过；关闭辨析选项并刷新后内容隐藏，重新开启后恢复。页面非空、无框架错误界面，控制台无应用错误（浏览器扩展 metadata 消息错误不属于应用）。截图确认三组内容无重叠。Safari 和手机视口尚未验收。
