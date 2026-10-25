# 原测试网址部署交接（2026-10-26）

唯一验收入口：https://tjpai.github.io/pai-word-preview/perf-preview/rebuild-preview/index.html

当前开发分支：`answer-enrichment-main-dev-20261026`
包含原答案页教学字段增强及Safari后台恢复后的设置/首页状态重试。**未经浏览器QA，不得宣称已部署或修复完成。**

## 部署阻碍
`TJPAI/pai-word-preview` 的 `.github/workflows/deploy-preview.yml` 中 `Checkout complete performance source` 固定 `ref: home-perf-safe-load-20261022`。当前GitHub连接对预览仓库写入返回403。

## 授权后操作
1. 在Work云端浏览器打开预览仓库工作流，核验真实文件；仅把 `Checkout complete performance source` 的 `ref` 改成待验收的**固定完整commit SHA**（不要改其他preview环境）。
2. 首先运行隔离浏览器回归：启动、首页、进入场景、答案页、发音、左右滑、自动浏览、评分及SRS持久化；模拟Safari后台/前台恢复，检查设置、场景状态写入失败后的重试与刷新保持。
3. 若未通过，保留现有perf-preview，不执行部署；在源开发分支修复后重新验收。
4. 通过后部署到**同一** `/perf-preview/rebuild-preview/index.html`，读取 `/perf-preview/preview-source-sha.txt` 并核对首页显示的SHA与源提交一致，核验JS实际加载版本。
5. 不重置、不清理用户学习数据，不覆盖其他preview目录。

## 已有代码核验
- 原答案页仍由 `rebuild-preview/learning-runtime.js` 的 `window.answerHtml` 渲染，未创建第二套UI。
- `rebuild-preview/preview-state.js` 增加前台恢复时的连接恢复及失败设置/首页状态重试。
- 这些是源码检查，不等于Safari真实设备回归。
