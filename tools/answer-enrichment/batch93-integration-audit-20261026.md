# Batch93 六条：答案页接入核验（2026-10-26）

## 真实资产
- QA 分支：`core20k-teaching-qa-b162-20261024`
- 教学包：`tools/core20k_lexicon/runtime/v1/batch93_nonrelease_teaching_pack.json`，Git blob `2d7e17509adaec37c04cb5854549ca51a62d864a`，6 条；`content_certified=true` 为 **0/6**，`production_ready=true` 为 **0/6**。
- 绑定：`tools/core20k_lexicon/staging/B217_SIX_KU_REGISTERED_CROSSWALK.json`，Git blob `d2044b28b2763d74b0216ccaaa327cf67826dc23`，6/6 registered，0 conflicts，0 blocked；`registration_authority_signed=false`，`release_eligible_count=0`，`production_ready_count=0`。
- 稳定分支：`home-perf-safe-load-20261022` 的 `rebuild-preview/batch93-overlay-release-candidate-manifest.json` 为 `STAGING_ONLY`、`activation_allowed=false`、`authority.release_signed=false`、`reviewed_crosswalk=[]`。

## 认证解释
双AI认证线的 `sixline_dual_ai_certification_batch93.md` 记载六条语义层 6/6 PASS，允许交付主开发**隔离集成**；这不自动覆盖教学包内的旧Staging标志，也不等于发布签署。禁止把这份报告等同于生产准入。

## 接入动作
1. 从QA分支按原字节取得上述两个资产，验证全量 SHA-256；不以此文档中的 Git blob SHA 代替内容 SHA-256。
2. 逐条校验 Runtime `ku_id`、rank、lemma、POS、sense 锚定；保持正式KU/SRS身份不变。
3. 在隔离环境中展示六条认证候选教学内容并执行交互/持久化回归，不能把候选写入正式学习记录。
4. 发布负责人按当前六线协作约定核实授权、来源许可、发布决策，更新经过签署的 manifest 后才能打开正式 overlay；不能直接修改 `activation_allowed` 绕过门禁。
5. 在**原** `/perf-preview/rebuild-preview/index.html` 发布前，完成真实浏览器验收、核对首页SHA与部署SHA；不改预览仓库权限、不重置用户数据。

## 已完成与未完成
已完成：从GitHub真实读取教学包、注册绑定和稳定分支manifest，核对数量与状态；此前对答案页渲染函数做五项隔离运行测试，均通过。
未完成：生产级SHA全量校验、正式数据适配、浏览器E2E、签署、发布。**当前用户测试链接未更新。**
