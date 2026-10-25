# 原测试网址部署交接（2026-10-26）

唯一验收入口：https://tjpai.github.io/pai-word-preview/perf-preview/rebuild-preview/index.html

当前开发分支：`answer-enrichment-main-dev-20261026`
包含原答案页教学字段增强及Safari后台恢复后的设置/首页状态重试。**未经浏览器QA，不得宣称已部署或修复完成。**

## 既有部署机制（已核验）
预览仓库 `TJPAI/pai-word-preview` 的现有定时工作流会从源仓库 `home-perf-safe-load-20261022` 检出源码，生成同一 `/perf-preview/` 页面和 `preview-source-sha.txt`。首页移除教学候选入口的提交 `5b36b936107a427a6533cadb8e2ea453334bf72f` 已通过此路径在原网址生效，无须更改预览仓库权限或工作流。

## 上线门槛和顺序
1. 先核验真实可发布的教学包：manifest 必须 `PRODUCTION_READY` 且 release gate、crosswalk、runtime/pack 哈希一致；当前尚未确认有符合条件的教学包。
2. 对开发分支执行隔离回归：启动、首页、进入场景、答案页、发音、左右滑、自动浏览、评分、SRS持久化；模拟Safari后台/前台恢复及失败重试。**未经浏览器QA不得宣称已通过。**
3. 回归通过后，按最小差异把增强改动合入源仓库 `home-perf-safe-load-20261022`，不要修改预览仓库，不要强制移动分支。
4. 等待现有定时部署，核对 `/perf-preview/preview-source-sha.txt`、首页SHA、实际加载JS版本，确认答案页有真实已认证内容；如果无已认证数据，不得宣称教学内容增强已交付。
5. 不重置、不清理用户学习数据，不覆盖其他preview目录。

## 已有代码核验
- 原答案页仍由 `rebuild-preview/learning-runtime.js` 的 `window.answerHtml` 渲染，未创建第二套UI。
- `rebuild-preview/preview-state.js` 增加前台恢复时的连接恢复及失败设置/首页状态重试。
- 这些是源码检查，不等于Safari真实设备回归。
