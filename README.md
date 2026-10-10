# PAI Word

PAI Word 是一个移动优先的场景化英语词汇学习 Web App。

在线版本：

https://tjpai.github.io/pai-word/

## 当前产品逻辑

- 10 个学习场景：日常生活、职场商务、学术学习、旅行出行、社交关系、科技互联网、健康医疗、金融消费、公共社会、文化娱乐
- 当前词库约 93 个 headwords，按“单词 × 场景义项”独立学习和记录
- 每个义项包含释义、词源、高频搭配、3 个例句、使用提醒和近义区分
- 近义区分采用“近义词：中文简述区别 + 英文例句”的逐词结构
- 新词与到期复习分离；到期复习不受每日新词数量限制
- 支持知道 / 不知道二元评分、左右滑词、自由复习
- 支持听音模式、美音 / 英音切换、自动发音和例句发音
- 学习进度目前保存在浏览器 localStorage 中

> 20,000 词是后续扩展目标，不是当前词库规模。

## 正式运行架构

当前正式加载链：

```text
mobile.js
  ↓
lexicon-core-*.js
  ↓
lexicon-compare-*.js + lexicon-compare-fix-*.js
  ↓
lexicon-qa.js
  ↓
daily.js
  ↓
ipa-accent.js
  ↓
app-runtime.js
```

主要文件职责：

- `index.html` — 唯一页面入口
- `mobile.js` — 场景、基础词库、状态、本地存储和公共数据函数
- `lexicon-core-001/002/003.js` — 扩展核心词库
- `lexicon-compare-*.js` — 近义辨析数据
- `lexicon-compare-fix-*.js` — 已审核辨析内容覆盖层
- `lexicon-qa.js` — 词库结构和近义辨析完整性检查
- `daily.js` — 每日新词分配和当前场景追加学习
- `ipa-accent.js` — 美 / 英 IPA 数据层
- `app-runtime.js` — 唯一正式 UI / 学习 / 复习 / 发音 / 滑动运行层
- `mobile.css` + `ux-fix.css` — 当前正式样式
- `manifest.webmanifest` — PWA 元数据

## 架构原则

- `render()` 只由 `app-runtime.js` 拥有
- IPA 层不再修改 DOM
- 每日分配层不参与页面渲染
- 不再保留旧版多层 monkey patch 运行链
- 扩词前优先保证数据结构、复习记录和近义辨析质量稳定

## 当前已知后续工作

- 完成全部现有义项的近义区分，使 QA 达到 0 incomplete
- 将同形异音 / 不同词性的 IPA 从 headword 级升级到义项级
- 增加近期增频词的真实元数据与筛选逻辑
- 增加学习数据导出 / 恢复能力
- 词库先扩到 300–500 高频词，再逐级扩展
