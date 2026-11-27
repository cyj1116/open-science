# Skill 市场 vs Specialist 市场 差异清单

> 基线：`main` @ `c8c162d21`（2026-11-23）。仅描述现状，不含方案。方案见 [PRD](./marketplace-prd.md)。
>
> 缩写：**SK** = `src/renderer/src/pages/settings/SkillMarketplace.tsx`，**SKB** = `SkillMarketplaceBatch.tsx`，
> **SP** = `SpecialistMarketplace.tsx`，**RMI** = `pages/marketplace/ResourceMarketplaceIdentity.tsx`，
> **RCT** = `pages/marketplace/ResourceCenterModeTabs.tsx`。

## 1. 已经一致的部分（可直接作为公共基线）

| 项 | 实现 |
| --- | --- |
| 入口 | 资源中心 `SharingMarketplacePage`，Installed / Marketplace 双 Tab（RCT:391-433，manual activation） |
| 页头 | 吸顶 `ResourceCatalogHeader`，标题 + Tab + Add 菜单；容器查询 26rem / 48rem 断点 |
| 工具栏 | `ResourceCatalogToolbar`：搜索 + Select 下拉筛选，宽度 < 1080px 折叠为 “Filters” 弹层 |
| 列表 | 卡片网格 `repeat(auto-fill,minmax(min(100%,19rem),1fr)) gap-3`，卡片 `rounded-xl border p-4` |
| 卡片骨架 | `ResourceMarketplaceCardContent`（RMI:183-228）：40px 首字母色块 + 名称（2 行截断）+ 署名 + 摘要（2 行）+ 状态文字 + View details + 主操作 |
| 详情 | 右侧抽屉（46rem），`ResourceDetailHeader` + 吸底 `ResourceDetailActions`（Close/Back） |
| 卸载交互 | “Installed” 按钮 hover / focus-visible 时变为红色 “Uninstall”，点击后二次确认，Esc 取消 |
| 信任根 | 官方源 ed25519 签名校验；无签名的内容不展示 |

## 2. 差异清单

### 2.1 列表与卡片

| 维度 | Skill 市场 | Specialist 市场 | 影响 |
| --- | --- | --- | --- |
| 卡片署名行 | authors，缺省为 GitHub owner | 仅 publisher | 同一位置语义不同 |
| 卡片上的版本 / 来源 / 信任标识 | 无 | 无（design.md:1093 写了有，代码没有） | 文档与实现不符 |
| 分类 | 有 `category`（5 个固定值），仅作筛选 | 无分类字段 | — |
| 状态文字 | Update available / Installed / Local conflict / Unavailable | Update available / Setup incomplete | 状态集不统一，且都只是灰色小字，不是 pill |
| 分页 | 每页 36 张 + “Load more” | 一次全量 | Specialist 量大后会有问题 |
| 骨架屏 | 1 条 + 6 张卡片的脉冲骨架 | 只有居中 spinner | 加载体验不一致 |
| 冲突卡片 | 无主操作，卡片上走不到冲突处理（SK:1412） | — | Skill 的死路径 |

### 2.2 工具栏 / 筛选 / 排序

| 维度 | Skill 市场 | Specialist 市场 |
| --- | --- | --- |
| 搜索范围 | id、名称、摘要、分类、源 owner、作者 | 名称、摘要、publisher、源名称 |
| 筛选 1 | Category（带计数） | “Category” = All / Official / Community / Updates（带计数），用字段 `sourceTrust` 实现 |
| 筛选 2 | 安装状态 All / Installed / Update available（无计数） | 无（Updates 混在筛选 1 里） |
| 排序 | Name A–Z / Catalog order | 无 UI（后端按名称排序） |
| 结果计数 | “Results: n / total” | 无，显示刷新时间 “Updated X” |
| Reset filters | 重置筛选和排序，**不**清空搜索 | 重置筛选，**不**清空搜索 |
| 空状态 Clear | 清空搜索 + 筛选，**不**重置排序 | 按上下文给 Clear search / Show all / Manage sources |
| 更多菜单 | Batch manage / Exit selection | Manage Marketplace sources |

> 同名控件 “Category” 在两边含义完全不同；两处 “Reset” 的清除范围也不一致。

### 2.3 信任、来源与缓存

| 维度 | Skill 市场 | Specialist 市场 |
| --- | --- | --- |
| 数据源 | 单一硬编码官方源（CDN + GitHub raw 回退） | 官方镜像 ×2 + 用户添加的 GitHub 仓库 |
| 来源管理 UI | 无 | 右侧抽屉：列表、添加（检查 → 指纹 → 信任）、移除（列出受影响的已安装项） |
| 信任标识 | 无 | 仅详情页显示 “Official”，Community 没有任何标识 |
| 签名信息展示 | 详情页折叠块 “Sources and verification”（作者、上游仓库、commit、License 证据） | 仅在添加来源时显示指纹 |
| 缓存 | 内存缓存，TTL 5 分钟，重启后丢失；不显示刷新时间 | 持久化 last-known-good 缓存，TTL 60 秒，显示刷新时间 |
| 部分源失败 | — | 显示 “Could not refresh {source}”，无重试 |

### 2.4 详情页

| 维度 | Skill 市场 | Specialist 市场 |
| --- | --- | --- |
| 元信息行 | 分类、Publisher、Author / Upstream、版本、License、评分 | Publisher、Author、版本、License、大小、来源、Official |
| 正文 | 安装控件 + 两个 `<details>`：来源与校验、评估报告 | 两个可折叠勾选列表：包含的 Skills、Connectors |
| 内容预览 | 无 SKILL.md / README / 文件列表 | 无说明文档；Connector 只显示原始 id |
| 评分 | 有上游自评分数 + 免责提示 | 无 |
| 页面标题 | — | `marketplace-release` 的面板标题始终是原始 id（SharingMarketplacePage:561） |

### 2.5 安装 / 更新 / 批量

| 维度 | Skill 市场 | Specialist 市场 |
| --- | --- | --- |
| 首次安装 | 一键安装，无确认 | 两阶段：下载并校验 → 有冲突时审查 → 安装 |
| 进度 | 按钮 spinner “Installing…” | 字节 / 百分比进度条 |
| 取消 | 批量可以 “Stop after current item” | 无取消按钮（只能离开页面） |
| 更新 | 需要预览时弹 `SkillMarketplaceUpdateDialog`（按文件 diff、受影响的 Specialist） | 同安装流程，冲突时让用户逐项选择 |
| 批量 | 有：Not installed / Updates 分段、全选、审查、队列进度、重试失败项、后台继续执行 | 无 |
| 安装后的默认值 | 渲染层未设置 Main 开关 | 新装 Skill 默认关闭 Main（design.md:1093） |
| 安装成功后 | 原地更新，不跳转 | 跳回 Installed 列表 |

### 2.6 状态与错误

| 维度 | Skill 市场 | Specialist 市场 |
| --- | --- | --- |
| 首次加载失败 | `ErrorNotice`，区分 integrity（红）、snapshot（返回）、network（琥珀 + Retry） | `ErrorNotice`，区分首次失败、全部源不可达 |
| 显示的是旧数据 | 琥珀提示 “Showing the last available data” | `InlineNotice` + 每个源的缓存时间 |
| 详情加载失败 | 文案误用 “No skills match your search.”（SK:1385） | `ErrorNotice` 但无重试 |
| 原始错误码外露 | 批量结果会拼上 `(busy)`、`network`（SKB:184, 559） | — |
| 原始 id 外露 | 批量审查和进度列表（SKB:447, 554） | Connector 列表、托管详情里的 Capabilities |

## 3. 各自的已知缺陷（与差异无关，顺手修）

**Skill 市场**
- `skill-marketplace.css` 里 `.skill-marketplace-card*`、`.skill-marketplace-filters` 等规则没有对应的 class（卡片用的是 `data-slot`），属于死样式。
- 骨架屏用 `.skill-marketplace-grid`，真实网格用内联 Tailwind，两份重复定义。
- 筛选 “Update available” 包含 `requiresPreview` 的项，批量计数却排除它们（SK:779 vs 813）。
- design.md:1112 描述的 “Browse Marketplace” 按钮在代码里不存在。
- `onImportFromGitHub` 回退按钮永远被 `addAction` 覆盖（SkillsPanel.tsx:419-421）。

**Specialist 市场**
- Community 计数 = 所有非 official 的项，筛选却只匹配 `=== 'user-approved'`（SP:296 vs 306）。目前只有两个枚举值，所以结果一致，但如果以后新增信任级别，两者就会不一致。
- 安装和市场两边的头像不一致：市场用首字母色块，已安装用 `SpecialistAppearancePicker` 图标。
- 同一操作的 “Update” 文案一处带 `context:'verb'`，一处不带。
- `MarketplaceManagedSpecialistDetail` 硬编码兜底版本号 `'0.1.0'`（:89, :144）。
- Installed 空状态的 “Browse the Marketplace…” 只是文字，不能点击。

## 4. 对 Connector 市场的启示

- 目前 `ConnectorsPanel.tsx:569, 760` 设置了 `marketplaceHidden`，没有任何市场数据层。
- 来源 / 信任 / 缓存这一层，**Specialist 市场更完整**，可以作为 Connector 市场的模板。
- 浏览 / 筛选 / 批量 / 加载体验这一层，**Skill 市场更完整**，可以作为公共列表组件的模板。
- 两边都缺 “安装前看清它会做什么” 这一层（权限、命令、网络访问）。对 Connector 来说这是必需的，因为 stdio Connector 会在本机执行命令。
