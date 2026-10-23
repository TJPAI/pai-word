# 中文 Core20K V0.10.4 内部结构风险队列

证据基线：完整 20,000 词 `zh-core20k.json` (SHA-256 `0f23193f94accd24a4705966e0f96aa27c9330260d4ce3eceb8ef6524b92f327`).

持久化：Library `/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/`，含 `v0104-audit.py`、`v0104-internal-structural-triage.json`、`v0104-review-queue.json`。

规则审查 404 条，**全部是需要人工/语料复核的低置信度提示，非错误词，更非应删除词**。例如“我们”“可以”“通过”均可能被规则标记；这些反例是采用严谨审核的必要原因。所有 member 和 term_id 保留，未调整词频、未改推荐引擎。

BCC 2.0 官方页面明确提供跨域频次下载：<https://bcc.blcu.edu.cn/help.html>。目前未取得可程序化核验的原始表，不声称BCC对404项已完成交叉验证。

重现：`python v0104-audit.py zh-core20k.json ./out`。
