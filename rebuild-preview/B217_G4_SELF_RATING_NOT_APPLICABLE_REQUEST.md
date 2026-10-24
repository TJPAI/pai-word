# B217 G4 自评式评分适用性确认申请（待QA与发布负责人确认）

状态：REQUESTED_NOT_APPROVED。不得将本申请视为G4已关闭。

## 运行时证据
- 正式前端 `rebuild-preview/learning-runtime.js` 的 `studyShell` / `ratingHtml` 使用用户揭晓后自行选择“不知道/知道”，另有三按钮 tap flow 的 `visualGrade` 与 `rate...` 回调。
- `window.answerHtml(u)` 渲染释义、例句、搭配，不读取中文打字输入，也不执行机器等价答案判断。
- Batch93 STAGING_ONLY 页面只读，不进入正式SRS。
- 未来若出现文本答题输入或自动判分，G4立即恢复为 REQUIRED，必须采用 B216 22+24 项评分契约并验证。

## 申请
当前自评式学习流的自动中文等价答案判分标记为 **NOT_APPLICABLE_PENDING_APPROVAL**；不得将此视为测试通过或豁免全部评分/SRS QA。

## 需确认
1. QA确认运行时确实无自动打字评分路径。
2. 发布负责人确认G4适用性豁免。
3. 保留B216参考测试，不修改自评按钮与SRS规则。

## 其他门禁
G5展示接线已提交，但完整浏览器E2E尚未通过。G6加载器与测试已提交，待执行。G7隔离回归与G9真实学习E2E仍需实际验证。正式认证KU为0。
