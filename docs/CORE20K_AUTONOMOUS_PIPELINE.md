# Core20K 可恢复生产流水线（设计基线）

## 状态与信任边界
- Library Core20K_LongTerm_V2.0.6 / FINAL_FROZEN 是词表 membership 基线；不修改词条身份或 rank。
- 词表成员资格、词义/KU 内容质量、可运行打包、场景映射分别追踪，不允许把 20K membership 等同于 20K 内容已验证。
- GitHub main 目前只作为起始点；本分支禁止自动合并、自动部署或覆盖原有用户学习记录。
- 任何词典/corpus 校验必须带实际可复核证据；程序推断不标记为 dictionary_verified。

## 最小执行闭环
1. 从 Library 手动导入指定版本的 master CSV + audit JSON 至本地输入目录（不要将 52MB 的治理账本直接发布到浏览器）。
2. 运行 `python3 scripts/core20k_gate.py --master PATH --audit PATH --out DIR`，首先核查 membership 和审计状态。
3. 生成独立 checkpoint.json 和 QA 报告，记录源文件 sha256、行数、唯一词数、连续 rank、异常记录。
4. 检查通过以后才允许后续内容 overlay 合并、KU 映射及 runtime packs；这些构建阶段尚未实现，不宣称已自动部署。
5. 每个批次采用 input-hash + batch-id 实现可重入；验证失败则保留旧通过版本；只有显式人工批准才合并 main/更改发布来源。

## 发布门槛
- membership: 20,000 行、casefold 唯一、1–20,000 连续 rank、与版本审计一致；
- content: 必填字段、词性/词义/KU 关联、来源、版权/许可清单和抽检；
- runtime: schema、离线加载、SRS ku_id 稳定性、回滚；
- Scene500: 排序覆盖、映射解释、低质量匹配过滤；不把生成候选视为已人工核验。

## 下一步（未完成）
- 核验 GitHub 开发分支真实最新实现与加载器，再制定 pack 格式；
- 制作生成器、内容 overlay 的 checkpoint/审核队列；
- 在新分支做端到端测试，交付可体验 Preview。
