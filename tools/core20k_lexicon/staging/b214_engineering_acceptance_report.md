# B214 工程验收报告 — Core20K 教学注册系统 B209–B214

> 状态：单元与契约验收完成；真实数据库联调 **NOT_RUN（待凭证）**。
> 本报告不把模拟测试 PASS 冒充真实数据库测试 PASS；模拟审批不等于真实内容认证；
> 未认证内容不得标记为 PRODUCTION_READY；本次不生成任何正式 KU 身份。

## 1. 基线

- 仓库：TJPAI/pai-word
- 分支：`core20k-teaching-qa-b162-20261024`（隔离 QA 分支，未动 main）
- 验收基线提交：`a73c9cd275c12fa94895692e4da602d9884179bc`
  （2026-10-25 05:22，test(core20k-qa): align B209 authority fixture and cover identity hash rollback guards）
- 正式 Runtime、SRS、用户学习数据：**未触碰**。

## 2. 实际执行的测试命令（本地，Node v24.22.1）

```sh
node --test tools/core20k_lexicon/staging/b188_registration_preflight.test.mjs \
  tools/core20k_lexicon/staging/b201_authority_preflight.test.mjs \
  tools/core20k_lexicon/staging/b204_verified_authority_boundary.test.mjs \
  tools/core20k_lexicon/staging/b206_reservation_plan.test.mjs \
  tools/core20k_lexicon/staging/b209_reservation_transaction.test.mjs \
  tools/core20k_lexicon/staging/b214_real_postgres_integration.test.mjs \
  scripts/core20k-ku-registration-gate.test.mjs
```

## 3. 本地测试结果（Node v24.22.1；注意：CI 用 Node 22，见第 4 节）

| 文件 | 结果 |
|---|---|
| b188_registration_preflight | 4/4 PASS |
| b201_authority_preflight | 6/6 PASS |
| b204_verified_authority_boundary | 4/4 PASS |
| b206_reservation_plan | 4/4 PASS |
| b209_reservation_transaction（扩展后） | 14/14 PASS |
| b214_real_postgres_integration（无凭证时） | 1 skipped（不是 PASS） |
| scripts gate | 4/4 PASS |
| **合计** | **36 pass / 0 fail / 1 skipped** |

说明：b201/b204 在一次不完整的本地抽取中曾报模块缺失，那是抽取遗漏
（未抽取同名实现文件），补全抽取后全部通过，不是仓库缺陷。

## 4. GitHub CI（B210 工作流，Node 22）

- 工作流：`.github/workflows/core20k-b210-transaction.yml`，push 到 QA 分支且命中
  b209 实现/测试/工作流文件时触发；`workflow_dispatch` 存在但因工作流文件不在
  默认分支 main 上，网页无手动按钮（与 B189/B192 情形相同，属正常规则）。
- 基线（`a73c9cd`）：Run 40133897590，Node v22.23.3，B209 测试 7/7 PASS。
  此前 `aa37ebd` 的一次 Failure 已查实为 fixture 与执行器不匹配（旧 fixture
  缺 headword_id/sense_id），`a73c9cd` 仅改测试文件后恢复，执行器未动。
- 本次提交：Run 40134720899 @`364365ee`（执行器防护提交），Success；
  Run 40134842605 @`3558bd1a`（扩展测试提交），Node v22.23.3，
  B209 测试 14/14 PASS（作业 5 秒；警告仅为 Node 20 弃用与 ubuntu-latest
  迁移提示，与测试无关）。
- 本报告的 CI 数字以以上运行记录为准；本地 Node 24 结果（36/36 + 1 skipped）
  不冒充 CI。

## 5. 本次修复（均在隔离 QA 分支内）

### 5.1 事务连接池串线防护（真实缺陷，已修复）

- 问题：`reserveWithTransaction` 接受任何带 `query` 的对象。pg Pool 也有
  `query`，但每条语句可能落到不同池连接，BEGIN/INSERT/COMMIT 会被拆散，
  事务静默失效。原实现只在注释里要求专用客户端，未做任何强制。
- 修复（`b209_reservation_transaction.mjs`）：拒绝池形客户端——pg Pool 同时
  具备 `connect` 方法与池计数器（totalCount/idleCount/waitingCount），而专用
  连接（pg Client、pool.connect() 得到的 PoolClient）没有这些计数器。
  命中时抛 `TypeError('DEDICATED_CLIENT_REQUIRED')`，发生在任何 SQL 之前。
- 注意：该防护针对真实 pg Pool 的可观测形态；手写的不带计数器的池形对象
  无法仅凭形态识别，调用方仍须遵守“专用连接”契约（见第 7 节）。

### 5.2 模拟审批绕过覆盖不足（测试缺口，已补齐）

- 原测试只验证了 headword/sense 两个字段的 authority 绑定。本次扩展到
  **全部六个身份字段**（candidate_id、headword_id、sense_id、revision_sha256、
  runtime_sha256、authority_release_id），逐字段替换均须 BLOCKED 且零 SQL。
- 新增：布尔 approved 模型（`{approved:true}`、`status:'APPROVED'`、缺失绑定
  字段的 VERIFIED）一律 BLOCKED；请求体内夹带的 `approved:true` 被忽略；
  请求缺字段/空字段 → INVALID_REQUEST 且不调用 authority、不执行 SQL；
  缺失 client/verifier → TypeError；verifier 抛错直接传播，不降级为 BLOCKED。
- 执行中真实发现并修复了一个测试作者错误：一个 mock 用
  `{status:'APPROVED', ...verify(r)}` 展开，verify 的 VERIFIED 覆盖了 APPROVED，
  导致该用例返回 RESERVED。属测试写法错误（展开顺序），非执行器绕过；
  修正为 `{...verify(r), status:'APPROVED'}` 后通过。此事记入以防重犯：
  写“拒绝”用例时，拒绝字段必须放在展开之后。

### 5.3 真实数据库集成测试（新增文件，未执行）

- 新增 `tools/core20k_lexicon/staging/b214_real_postgres_integration.test.mjs`：
  无 `CORE20K_QA_DATABASE_URL` 时自动 skip；有凭证时覆盖：PG 18 版本核查、
  B208 schema 幂等应用与表存在性、专用连接 happy path（1 预留行 + 1 事件行、
  release 后池计数器恢复）、真实 pg Pool 作事务客户端被拒、三种 mock 审批
  在真实库上 BLOCKED 且零行变化、双连接同 key 竞争（恰一胜者、败者
  CONFLICT 或 RETRYABLE、恰一行一事件）、直接 ROLLBACK 后两表均无行、
  审计一致性（预留数 == 事件数、无孤儿事件、无缺事件预留）、按前缀清理。
- 该文件不打印、不记录、不存储连接串；数据库用户须仅限隔离 QA 项目。
- 驱动加载修正：ESM import() 不读 NODE_PATH，初版测试在已装 pg 时仍报驱动
  缺失；已改为经 createRequire 加载，使 NODE_PATH 指定的仓库外驱动可被找到
  （该问题在直连被拦之前暴露，与数据库本身无关）。
- 变量遮蔽修正：初版测试以 `const URL` 命名连接串常量，遮蔽了全局 URL 类，
  致使读取 schema 文件的 `new URL(...)` 在真实连接打通后抛错；已改名为
  CONNECTION_URL（skip 条件与 Pool 配置同步改名），测试逻辑未变。

## 6. 真实数据库联调状态：PASS（2026-10-25 权限放开后重跑通过）

- 目标：Neon 隔离 QA 项目 `PAI Word Core20K Isolated QA`
  （项目 ID old-hill-15850097，PostgreSQL 18，AWS 新加坡，schema core20k_qa）。
- 连接信息已通过 Neon 控制台安全取得：浏览器经已保存的 GitHub OAuth 会话
  登录控制台（未输入密码、未用验证码），项目名称与 ID 逐项核对一致，
  版本显示为 18，连接为池化端点。连接串仅一次性临时使用，未写入 GitHub、
  日志、报告或记忆，也未要求用户在聊天中粘贴。
- 阻断与解锁：2026-10-25 05:52 前本机直连 PG 线协议被运行时出口权限拦下
  （databases: Deny）；用户于 06:10 确认已把该权限改为 Ask，之后重跑直连
  成功建立（Ask 授权获批），阻断解除。本节此前“NOT_RUN 待权限”的说法
  现已由实测结果取代。
- 重跑过程（两次，均为同一测试文件、同一连接串、同一 Node 环境）：
  1. 第一次（43.4s）：连接已通、版本查询已过，但在读取 schema 文件时因
     `const URL` 遮蔽全局 URL 类而抛错，未执行任何写操作；该缺陷已修复
     （改名 CONNECTION_URL，见第 5.3 节），属测试自身错误，与数据库无关。
  2. 第二次（12.5s）：**PASS 1/1，0 败**。测试内断言全部通过：版本匹配
     PostgreSQL 18、schema 幂等应用且两表存在、专用连接 happy path（1 预留行
     +1 事件、释放后池计数器恢复）、真实 pg Pool 被执行器拒绝、3 种 mock
     审批在真实库上 BLOCKED 且零行、双连接同 key 竞争恰一胜者（败者 CONFLICT
     或 RETRYABLE、恰 1 行 1 事件）、直接 ROLLBACK 后零行、审计一致性
     （预留数==事件数、0 孤儿、0 缺事件）、按前缀清理。
- 独立只读复核（测试通过后另起连接查询，未写任何数据）：版本
  PostgreSQL 18.6；core20k_qa 内 2 张表；本任务前缀的残留预留行与事件
  均为 0；schema 内另有 3 条非本任务前缀的预留行，本任务未动、未删。
- 结论：真实库联调**已通过**，本任务未创建任何数据库/分支/项目，schema
  的既有状态除测试自带的建表（幂等）与自清理外未被改变。

## 7. 调用方契约（执行器不兜底的部分，须遵守）

- 事务客户端须是专用连接（`pool.connect()` 取得的 PoolClient 或直连 Client），
  用后须在 finally 中 release；执行器不负责连接生命周期。
- RETRYABLE（序列化失败）时，调用方须先重新核查 authority 再重试；
  执行器自身不重试。
- BLOCKED 的尝试在库里不留行：审计覆盖的是预留及其 RESERVED 事件，
  不是拒绝尝试；如需拒绝审计，须另行设计（不在本次范围）。
- authority 校验发生在 BEGIN 之前，校验与提交之间存在固有时间窗口；
  本设计按 B208 注释执行（先验后开事务），不声称消除该窗口。

## 8. 剩余阻碍与风险

1. 真实数据库联调 **已通过**（见第 6 节）——下一阶段可信审批集成的技术条件
   **已满足**（工程与事务层；内容认证与正式注册仍按原边界关闭，见第 9 节）。
2. 池形防护依赖 pg Pool 的可观测形态；非标准池对象仍需调用方自律。
3. B208 schema 的 `REJECTED` 事件类型目前无任何写入路径（执行器只写
   RESERVED）；拒绝审计如需落库，须另立设计。
4. 短语级美音、双 AI 认证、sense 归属等注册门禁仍为 BLOCKED（见 B189/B192
   报告），与本次工程验收无关，不得混为一谈。
5. 本地 Node 为 v24.22.1，CI 为 Node 22；本地 PASS 不等于 CI PASS，
   以 B210 新提交的运行记录为准。

## 9. 下一阶段可信审批集成的技术条件判定

- 单元与契约层：**已满足**（36/36 PASS，含池防护与全字段绑定；
  CI Node 22 下 B209 14/14 PASS）。
- 真实数据库层：**已满足**（真实库集成测试 1/1 PASS，PG 18.6，双连接竞争、
  冲突回滚、审计一致性、清理均实测通过；见第 6 节）。
- 因此：可信审批集成在工程与事务层面的技术条件**已满足**。以下边界不变，
  不得因本阶段通过而放宽：mock 审批不是真实内容认证；正式 KU 身份
  （ku_id/sense_id）仍须权威注册后才可生成；正式 Runtime、SRS 与用户
  学习数据仍禁止写入；任何内容不得仅凭本阶段结果标记 PRODUCTION_READY。
