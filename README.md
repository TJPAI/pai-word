# PAI Word

场景化高效英语词汇学习 Web App。

核心模型不是“一个单词 = 一个中文释义”，而是：

- 约 20,000 个常见 headwords
- 一个词可属于多个场景
- 每个场景拥有独立义项、常用搭配、3 个代表例句和易错提醒
- 发音 + IPA + 词根/词源
- 熟练度按 `单词 × 场景义项` 独立记录
- 主动回忆、复习队列和易错词

## Online

正式 GitHub Pages 目标地址：

https://tjpai.github.io/pai-word/

仓库已包含 `.github/workflows/pages.yml`。首次启用时可在 GitHub `Actions` 中手动运行 **Deploy PAI Word to GitHub Pages**。

无需 Pages 构建的即时静态预览可使用：

https://raw.githack.com/TJPAI/pai-word/main/index.html

## Structure

- `index.html` — 应用入口
- `styles.css` — 响应式界面
- `app.js` — 多场景义项、学习与本地进度逻辑
- `manifest.webmanifest` — PWA 元数据

当前版本用于验证学习交互和数据模型；完整 20K 高质量词库将沿同一结构扩展。
