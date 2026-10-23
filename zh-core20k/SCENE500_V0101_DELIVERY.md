# 中文 Core20K → Scene500 V0.10.1 兼容交付

**已持久化数据**：ChatGPT Library `/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/`（8 个文件，含完整 20,000 词条的 Runtime JSON）。

- QA 版本：0.10.1（diagnostic-only）；Runtime 内容：0.9.4 RC2 成员及身份完全兼容，不冒充已升级的通用词频。
- Manifest：`manifest.json`；数据：`zh-core20k-v0101-scene500-runtime.json`；词典：`zh-core20k-tokenizer-dict.txt`。
- 对照 RC2 精确相等：20,000 个 term_id、term、normalized_term、stopword_hint；零增删、零身份迁移。
- Alias 映射保留 8 条，Exact-first。未核验 3,553 条关联数据行（旧关联数据资产在本次检查中不可得）。
- integration_ready=true（接口数据层）；production_ready=false（通用词频、跨领域验证未完成）。
- Runtime Schema 为展开字段的 `terms[]`，并非 RC2 compact 的 `id/t/n/s`；下游使用现有 contract adapter 或明确字段映射，不得视为二进制直接替换。
- 由于完整 Runtime 当前保存在 Library，本 GitHub 指针**不表示** Runtime 已被提交到 GitHub 或已经部署到线上。

阅读完整数据与 QA 后才能在推荐引擎分支进行接入、执行 3,553 条真实关联逐行验证及回归测试。
