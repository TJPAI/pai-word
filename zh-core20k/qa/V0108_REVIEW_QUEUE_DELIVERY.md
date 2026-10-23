# V0.10.8 审核队列可复现交付与高风险初审

- 基线 SHA-256：`0f23193f94accd24a4705966e0f96aa27c9330260d4ce3eceb8ef6524b92f327`
- 完整 20,000 `term_id` 校验通过，规则筛查 829 项（高6、中8、低815），每批最多200条，生成5个JSONL文件。所有记录仍为 `UNDECIDED`。
- 已重新运行 V0.10.7 脚本，输出经JSON解析、文件哈希校验并持久化。
- 高优先级6项：`人来`、`我要`、`这会`、`人有`、`中有`、`他会`。仅提出可能存在词间边界的语言学假设，不构成删除建议。
- 本次已审高优先级的证据结论统一为 `INSUFFICIENT`，须进一步获得真实语境及标注分词。
- 未修改中文Runtime、词项成员、词频、term_id或Scene500。

## Library持久化资产
目录：`/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/`

文件：
- `v0107-qa.json`
- `v0107-review-shard-001.jsonl` 至 `v0107-review-shard-005.jsonl`
- `v0108-high-review.json`

对应 SHA-256：
- qa: `155f2f97aaa71ee69de12698d8a7cd4a7cbae1e0a9a570ac75da9c5ce7a8b84d`
- shard001: `fd2863fff835e948f324e788f02c5af09658dd29f18d35ce06b095d4eed22dea`
- shard002: `d25dcc87e1553449a342757b892115df55a9b07e55c11e9365b1301a6d9ffbf4`
- shard003: `1bb5d337974c9ae7fda72ec1b5a01c2bba00b5c895e5c8b4646a42f32934d4c8`
- shard004: `c280041217684cd7e8a047d479e4fab383b38a01de90ac533741a091fcfc39a9`
- shard005: `155f2f97aaa71ee69de12698d8a7cd4a7cbae1e0a9a570ac75da9c5ce7a8b84d`
- v0108 high review: `847d60dc68cc794ec011e8030a297370b51e8d73277565d8443ce9d4ea7d028f`

**发布性质**：审核增量 V0.10.8，非新版 Runtime。integration_ready 仍以前次 V0.10.1 数据包为准；production_ready=false。
