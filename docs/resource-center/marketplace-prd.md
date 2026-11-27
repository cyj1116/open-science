# PRD：资源中心市场样式与交互完善

| 项 | 内容 |
| --- | --- |
| Story | 【OS】【探索】资源中心样式和交互完善 |
| 子任务 | Skill market · Specialist market · Connectors market |
| 状态 | 草案（待评审） |
| 基线 | `main` @ `c8c162d21` |
| 依据 | [差异清单](./marketplace-gap-analysis.md) |

## 1. 背景

资源中心已经把 Skill、Specialist、Connector 三类资源统一到一个页面，但它们的“市场”处在三种状态：

- **Skill 市场**：浏览体验最完整（分类、排序、分页、批量），但只有单一官方源，没有信任标识，缓存在重启后丢失。
- **Specialist 市场**：来源与信任模型最完整（多源、签名、持久缓存、两阶段安装），但浏览能力弱（无排序、无分页、无批量），卡片信息少于设计文档的描述。
- **Connector 市场**：不存在（`marketplaceHidden`），用户只能用内置 Connector 或手写自定义 MCP 配置。

用户在三个 Tab 之间切换时，同名控件含义不同（例如两处 “Category”），状态、筛选、重置、错误提示的行为各不相同，形成割裂感。

## 2. 目标与非目标

### 目标

1. **一致**：三类市场共用一套列表、卡片、筛选、状态、详情、安装反馈的组件和交互规则。
2. **可信**：用户在安装前能看到资源来自哪里、是否官方、是否经过校验、安装后会获得什么能力。
3. **补齐**：上线 Connector 市场，用户可以从可信来源浏览、审查、安装 Connector。
4. **修复**：清掉差异清单第 3 节列出的已知缺陷。

### 非目标

- 不做评分、评论、下载量等社区功能（目录数据里没有这些字段）。
- 不做用户可见的版本锁定（PRD.md 已列为未来方向）。
- 不改变现有签名校验与 digest 锁定的安全模型，只做展示。
- 不做市场内容的发布 / 上传端。

## 3. 用户与场景

| 角色 | 场景 |
| --- | --- |
| 科研用户 | 在市场里按领域找一个 Skill，看懂它是谁做的、做什么，一键装好 |
| 进阶用户 | 安装社区仓库里的 Specialist，确认它会带进来哪些 Skill 和 Connector |
| 团队管理员 | 一次性把一批 Skill 更新到最新版，失败的项重试 |
| 所有用户 | 安装一个 Connector（例如数据库或文献检索 MCP），在安装前清楚看到它要执行的命令和需要的凭证 |

## 4. 需求

优先级：**P0** 本 Story 必须交付；**P1** 本 Story 尽量交付；**P2** 可以延后。

### 4.1 公共市场框架（三类共用）

| # | 需求 | 优先级 |
| --- | --- | --- |
| C-1 | 抽出公共 `ResourceMarketplaceCard`。卡片固定区域：身份图标、名称、**信任标识**、署名行（统一为 “Publisher · Author”）、摘要、元信息行（版本 + 来源）、状态 pill、View details、主操作 | P0 |
| C-2 | 状态统一用 pill 展示，状态集合固定：`Installed` / `Update available` / `Needs attention`（冲突、未完成设置）/ `Unavailable`。颜色使用 `status-*` token | P0 |
| C-3 | 信任标识统一：`Official`（带 BadgeCheck）/ `Community`（用户添加的来源）。卡片和详情页都显示 | P0 |
| C-4 | 筛选统一为两个维度：**来源**（All / Official / Community）、**状态**（All / Not installed / Installed / Update available），都带计数。资源特有的维度追加在后面（Skill 的 Category）。控件名称不得重名 | P0 |
| C-5 | 排序统一：Name A–Z（默认）/ Recently updated（目录有日期字段时）/ Catalog order | P1 |
| C-6 | 重置规则统一：工具栏 “Reset filters” 重置筛选 + 排序，保留搜索；空状态 “Clear all” 清空搜索 + 筛选 + 排序 | P0 |
| C-7 | 加载用骨架屏（Skill 现有样式），超过 36 项时分页 “Load more” | P0 |
| C-8 | 结果计数和刷新时间同时显示：“n of total · Updated X” | P1 |
| C-9 | 空状态区分三种：目录为空、筛选无结果、所有来源不可达，每种给对应操作 | P0 |
| C-10 | 错误统一走 `ErrorNotice`，每个可恢复的错误都有 Retry；不向用户显示原始错误码和原始 id | P0 |
| C-11 | 资源特有的数据（Skill 评分、Specialist 包含项、Connector 命令）放在详情页的固定插槽，而不是新增卡片字段 | P0 |

### 4.2 Skill 市场

| # | 需求 | 优先级 |
| --- | --- | --- |
| SK-1 | 迁移到公共卡片和筛选（C-1 ~ C-6） | P0 |
| SK-2 | 卡片显示版本和 Official 标识（当前全部是官方源） | P0 |
| SK-3 | 冲突项在卡片上显示 `Needs attention`，并有可点击入口进入处理 | P0 |
| SK-4 | 详情页增加 SKILL.md 预览（只读渲染） | P1 |
| SK-5 | 目录缓存持久化为 last-known-good，与 Specialist 一致，重启后离线也可浏览 | P1 |
| SK-6 | 修复：详情缺失时的错误文案、批量计数与筛选不一致、批量列表显示 displayName、删除死 CSS | P0 |
| SK-7 | Installed 页头补上 “Browse Marketplace” 入口，或者从 design.md 删除这一描述 | P1 |

### 4.3 Specialist 市场

| # | 需求 | 优先级 |
| --- | --- | --- |
| SP-1 | 迁移到公共卡片和筛选。原来的 “Category” 下拉拆成 来源 + 状态 两个维度 | P0 |
| SP-2 | 卡片补上版本、来源、Author、信任标识，与 design.md:1093 对齐 | P0 |
| SP-3 | 加排序和分页 | P1 |
| SP-4 | 详情页 Connector 显示名称和说明，不再显示原始 id；面板标题用 displayName | P0 |
| SP-5 | 下载 / 校验阶段可以取消 | P1 |
| SP-6 | 单个来源刷新失败时给出原因和 Retry | P1 |
| SP-7 | 安装成功后留在市场，原地更新卡片状态（与 Skill 一致），并给一个 “View installed” 链接 | P1 |
| SP-8 | 市场和已安装两边使用同一身份图标 | P2 |
| SP-9 | 修复：Community 计数与筛选条件统一、“Update” 动词 context 统一、托管详情去掉硬编码版本 `0.1.0`、Installed 空状态的 Browse 文本做成按钮 | P0 |
| SP-10 | 批量安装 / 更新（复用 Skill 的批量队列交互） | P2 |

### 4.4 Connector 市场（新建）

| # | 需求 | 优先级 |
| --- | --- | --- |
| CN-1 | 去掉 `marketplaceHidden`，Connectors 出现 Marketplace Tab，使用公共框架 | P0 |
| CN-2 | **数据源**：沿用 Specialist 的签名静态目录协议（官方源 + 用户批准的 GitHub 仓库、ed25519 签名、digest 锁定、last-known-good 缓存） | P0 |
| CN-3 | 卡片额外显示传输方式（`stdio` / `Streamable HTTP`）和是否需要凭证 | P0 |
| CN-4 | 详情页 **“安装后会发生什么”** 区块：将要执行的命令与参数（stdio）、远程 URL（HTTP）、需要的环境变量和凭证、依赖的运行时（Node / Python / uv 等），以及它提供的工具列表（目录中有声明时） | P0 |
| CN-5 | 安装流程：审查（CN-4 的内容）→ 填写凭证（复用 `credential-request-broker`）→ 写入自定义 MCP 配置 → 连接测试 → 完成。凭证不写入目录或日志 | P0 |
| CN-6 | 新装的 Connector 默认 **不** 给 Main Agent 启用，与 Skill 的规则一致；完成页提供 “启用给 Main Agent / 分配给 Specialist” 入口 | P0 |
| CN-7 | 已安装的市场 Connector 显示来源和版本，支持更新与卸载；更新时如果命令或权限有变化，必须展示变化并要求重新确认 | P0 |
| CN-8 | 连接测试失败时给出可读原因（复用 `connector-error-message.ts`），可以重试，也可以保留配置稍后再试 | P1 |
| CN-9 | 来源管理复用 Specialist 的 “Manage Marketplace sources” 抽屉 | P1 |
| CN-10 | 支持接入官方 MCP Registry 作为额外来源（标记为 Community，需用户启用） | P2 |

## 5. 交互要点

### 5.1 卡片

```
┌──────────────────────────────────────────┐
│ [图标] 名称                   [Official]  │
│        Publisher · Author                │
│ 摘要第一行……                              │
│ 摘要第二行……                              │
│ v1.2.0 · 来源名          [Update available]│
│                   [View details] [Update] │
└──────────────────────────────────────────┘
```

- 点击卡片空白处等同于 View details；主操作和卸载保持现有的 “hover 变为 Uninstall” 交互。
- 批量模式下卡片左上角显示复选框，卡片正文设为 inert（沿用 Skill 现有实现）。

### 5.2 详情抽屉

固定结构：Header（身份、名称、信任、元信息）→ 资源特有区块（插槽）→ 来源与校验（可折叠）→ 吸底操作区。

| 资源 | 特有区块 |
| --- | --- |
| Skill | SKILL.md 预览、评估报告 |
| Specialist | 包含的 Skills / Connectors（可勾选） |
| Connector | 安装后会发生什么（命令、URL、凭证、运行时、工具） |

### 5.3 安装反馈

- 单项安装：按钮内 spinner → 成功后原地变为 Installed，并弹 toast 提示后续操作（启用 / 分配）。
- 需要审查的安装（Specialist 有冲突、所有 Connector、需要预览的 Skill 更新）：抽屉内进入审查步骤，有明确的取消按钮。
- 批量：沿用 Skill 的队列面板。

## 6. 技术方案概要

| 层 | 工作 |
| --- | --- |
| 渲染层公共组件 | 在 `pages/marketplace/` 新增 `ResourceMarketplaceCard`、`MarketplaceFilters`、`MarketplaceStatusPill`、`MarketplaceTrustBadge`、`MarketplaceEmptyState`、`MarketplaceSkeleton`；扩展 `ResourceDetailLayout` 支持插槽 |
| 共享类型 | 新增 `src/shared/connector-marketplace.ts`；为三类市场定义公共的 `MarketplaceListingBase`（id、displayName、summary、version、publisher、author?、sourceId、sourceTrust、status） |
| 主进程 | 新增 `src/main/connectors/marketplace/`（protocol / source / service / repository），协议与 Specialist 市场相同；Skill 市场增加持久化缓存 |
| IPC / 契约 | 新增 Connector 市场命令，接入 `renderer-contract-catalog`，Remote Web 同步支持 |
| 文档 | 更新 `docs/design.md`，新增 “Resource Marketplace” 公共规范一节，并修正现有不符之处 |
| i18n | 所有新文案在 8 个 locale 的 `renderer` 命名空间补齐，遵守术语表（Marketplace、Connector、Official 等） |

## 7. 里程碑与拆分

| 阶段 | 内容 | 对应子任务 | 建议 PR |
| --- | --- | --- | --- |
| M0 | 设计稿与交互规范评审，确定 Connector 数据源 | 全部 | — |
| M1 | 公共组件 + Skill 迁移 + Skill 缺陷修复 | Skill market | 1–2 个 |
| M2 | Specialist 迁移 + 缺陷修复 + 排序分页 | Specialist market | 1–2 个 |
| M3 | Connector 市场：协议与主进程 | Connectors market | 1 个 |
| M4 | Connector 市场：UI、安装流程、凭证、连接测试 | Connectors market | 1–2 个 |
| M5 | P1 / P2 收尾 | 全部 | 按需 |

M1 和 M3 可以并行。

## 8. 验收标准

- 三个 Tab 的市场卡片、筛选、状态 pill、空状态、错误提示视觉一致，同名控件含义一致。
- 差异清单第 3 节的缺陷全部关闭，或者在本文档里注明为什么不修。
- Connector 市场：用户无需手写 JSON 即可安装一个 stdio Connector 和一个 HTTP Connector；安装前能看到完整命令 / URL；未签名或 digest 不匹配的包不能安装；新装的 Connector 默认不给 Main Agent 启用。
- `npx vitest run src/renderer/src/i18n/resources.test.ts` 通过；新增组件有 render 测试；Connector 安装流程有 Playwright 端到端测试。
- 键盘可以完成浏览、筛选、打开详情、安装、取消的全流程，`prefers-reduced-motion` 生效。

## 9. 风险与待决问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | Connector 市场的数据源：自建签名目录还是接 MCP Registry？ | 先自建签名目录（P0），Registry 作为可选来源（P2） |
| Q2 | 官方 Connector 目录由谁维护、托管在哪里？ | 与 Specialist 官方源同仓库、同密钥体系，需要确认运维负责人 |
| Q3 | stdio Connector 依赖的运行时（npx、uvx）不存在时怎么办？ | 安装审查时检测，复用 `mcp-host-dependencies.ts`，缺失时提示而不是静默失败 |
| Q4 | 三类目录字段不一致（Skill 有 category，Specialist 没有），公共筛选怎么处理？ | 公共维度只用三方都有的字段，特有维度作为可选追加 |
| Q5 | Skill 缓存持久化是否会和 snapshotId 机制冲突？ | 需要主进程负责人评估 |
| Q6 | design.md 与实现不一致的地方，以哪个为准？ | 以本 PRD 评审结果为准，同步更新 design.md |

## 本地 Connector 目录联调

正式目录尚未发布。开发模式使用 `Open-Science Demo` 签名目录。可显式设置 `OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE=1` 在隔离的测试实例中启用同一目录。目录只包含公钥、签名和凭证字段名称。

- **Demo Greeting** 使用本机 `python3`，通过 stdio 提供 `hello` 工具。
- **Demo HTTP** 连接 `http://127.0.0.1:7876/mcp`。运行 `node scripts/connector-marketplace-demo.mjs` 启动本地服务。
- **Demo HTTP with credentials** 用于测试 `Authorization` 请求头的本机凭证绑定。联调服务不检查请求头，使用测试凭证即可。

打开资源中心的 **Connectors → Marketplace**，选择条目、审查配置并确认信任。安装后会通过 MCP 工具发现测试连接，并显示测试结果。新配置默认关闭主智能体访问权限。

### 当前交付范围

- CN-2 的签名与摘要校验已在本地目录中使用。正式源的仓库、入口文件和公钥待确定。生产环境默认显示空目录。
- 本轮使用内置签名样本联调。Connector 的 GitHub 来源审批、远程刷新和最近一次验签成功的目录缓存，将在实现远程目录时接入。Skill 已支持磁盘缓存。
- Specialist 批量操作与可选 MCP Registry 来源按 P2 延后。
