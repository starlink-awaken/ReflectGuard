# PRISM-Gateway 项目文档

**统一的7维度复盘和Gateway系统**

> "从7个维度全面复盘，内化为Gateway实时检查，形成持续进化的智能系统"

---

## 📖 项目简介

PRISM-Gateway是一套个人AI基础设施系统，融合了Gateway（行为准则门禁）和Retrospective（复盘系统）两大核心能力，形成统一的轻量级系统。

### 核心特性

- **7维度复盘框架** - 原则、模式、基准、陷阱、成功、工具、数据
- **三层检查架构** - 原则检查（MANDATORY）→ 模式匹配（WARNING）→ 陷阱识别（ADVISORY）
- **三层MEMORY架构** - Hot（实时查询）、Warm（复盘历史）、Cold（知识库）
- **MCP Server集成** - 暴露Gateway能力为MCP工具
- **Shadow Migration Pattern** - 零停机数据迁移
- **跨平台文件锁** - 多Agent并发安全

---

## 🚀 快速开始

### 安装

```bash
# 克隆项目
cd ~/.prism-gateway

# 安装依赖
bun install

# 验证安装
bun test
```

### CLI使用

```bash
# 检查任务意图
prism check "实现用户登录功能"

# 执行快速复盘
prism retro quick

# 执行标准复盘
prism retro standard

# 数据迁移
prism migrate --dry-run
```

---

## 📚 文档导航

### 📊 [完整文档索引](INDEX.md)

查看完整的文档索引，包含所有报告、设计、使用文档和API文档。

### 核心文档

| 文档 | 描述 |
|------|------|
| [PHASE1_MVP_DEEP_RETROSPECTIVE_REPORT.md](reports/PHASE1_MVP_DEEP_RETROSPECTIVE_REPORT.md) | Phase 1深度复盘（23KB，7维度分析） |
| [PHASE2_ARCHITECTURE.md](reports/PHASE2_ARCHITECTURE.md) | Phase 2系统架构设计（37KB，5层架构） |
| [WEEK2-3_COMPLETION_REPORT.md](reports/WEEK2-3_COMPLETION_REPORT.md) | Week 2-3完成报告（357个测试通过） |

### 使用指南

| 文档 | 描述 |
|------|------|
| [mcp-server.md](docs/mcp-server.md) | MCP Server使用文档 |
| [FILE_LOCK_USAGE.md](docs/FILE_LOCK_USAGE.md) | 文件锁使用文档 |
| [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) | 数据迁移指南 |

### API文档

| 文档 | 描述 |
|------|------|
| [API文档总览](api/README.md) | API文档索引 |
| [GatewayGuard](api/GatewayGuard.md) | Gateway检查器 |
| [MemoryStore](api/MemoryStore.md) | 三层MEMORY架构 |
| [DataExtractor](api/DataExtractor.md) | 7维度数据提取 |

---

## 📊 项目状态

### 当前版本

**版本：** 1.1.0
**状态：** Phase 2.0 基础设施完成
**测试覆盖率：** >90%
**测试数量：** 357个（100%通过）

### Phase 2 进度

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| Phase 2.0 准备周 | ✅ 完成 | 100% |
| Week 2-3: 基础设施 | ✅ 完成 | 100% |
| Week 4-5: Analytics+API | 🔜 待开始 | 0% |
| Week 6-7: Web UI | ⏳ 规划中 | 0% |
| Week 8-9: 调度+备份 | ⏳ 规划中 | 0% |
| Week 10-11: 生产就绪 | ⏳ 规划中 | 0% |

**整体进度：** ~20% 完成（2/10周）

---

## 🏆 核心成就

### Phase 1 MVP

- **开发时间：** 6小时（40%效率提升）
- **测试覆盖：** 85%（203个测试）
- **性能超标：** 10-30000倍
- **综合评分：** 9.5/10

### Week 2-3

- **MCP Server：** 49个测试通过，响应<20ms
- **FileLock：** 45个测试通过，acquire<50ms
- **MigrationRunner：** 43个测试通过，性能超标29999倍
- **集成测试：** 220个测试通过
- **总测试数：** 357个（100%通过）

### 技术亮点

- **Shadow Migration Pattern** - Phase 1数据永不修改，任何时刻可回滚
- **跨平台文件锁** - 基于mkdir原子操作，进程崩溃安全
- **MCP Server** - 暴露Gateway能力，支持Claude Desktop集成
- **四层验证机制** - 系统兼容性、数据完整性、业务逻辑、性能

---

## 📂 项目结构

```
~/.prism-gateway/
├── src/                    # 源代码
│   ├── core/              # 核心类（Gateway、Memory等）
│   ├── integration/       # MCP Server集成
│   ├── infrastructure/    # 基础设施（文件锁）
│   ├── migration/         # 数据迁移
│   └── cli/              # 命令行工具
├── level-1-hot/          # Gateway实时查询
├── level-2-warm/         # 复盘历史
├── level-3-cold/         # 知识库
├── docs/                 # 使用文档
├── tests/                # 测试套件
└── reports/              # 项目报告
```

---

## 🛠️ 技术栈

- **语言：** TypeScript
- **运行时：** Bun
- **测试：** Bun Test
- **MCP：** @modelcontextprotocol/sdk
- **文档：** TypeDoc
- **版本控制：** Git

---

## 📈 性能指标

| 指标 | 目标 | 实际 | 达成率 |
|------|------|------|--------|
| Gateway检查 | <1000ms | <100ms | 1000% |
| 快速复盘 | <5min | <5min | 100% |
| MEMORY读写 | <100ms | <100ms | 100% |
| MCP响应 | <100ms | <20ms | 500% |
| FileLock acquire | <100ms | <50ms | 200% |
| 迁移(1000条) | <5min | <0.01s | 29999% |

---

## 🤝 贡献指南

1. 遵循TDD开发流程（RED-GREEN-REFACTOR）
2. 测试覆盖率必须>80%
3. 所有公共方法必须有TSDoc注释
4. 提交前运行 `bun test` 和 `bun run lint`

---

## 📝 许可证

MIT License

---

## 🔗 相关链接

- **项目仓库：** `~/.prism-gateway/`
- **文档仓库：** `~/workspace/agent/prism-gateway-docs/`
- **知识库：** `~/.claude/MEMORY/LEARNING/Gateway/`

---

**版本：** 1.1.0
**最后更新：** 2026-02-03

*PAI - Personal AI Infrastructure*
*Version: 2.5*
