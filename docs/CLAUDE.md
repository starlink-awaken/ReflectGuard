# Docs 模块文档

[根目录](../CLAUDE.md) > **docs**

---

## 变更记录 (Changelog)

### 2026-02-04
- 初始化模块文档
- 完成文档文件扫描和分类

---

## 模块职责

Docs 模块提供 PRISM-Gateway 项目的**使用指南**、**操作手册**和**技术文档**，帮助用户和开发者理解和使用系统。

**主要职责：**
- 提供系统使用指南
- 记录数据迁移方案
- 说明关键技术的使用方法
- 跟踪项目进度

---

## 目录结构

```
docs/
├── 数据迁移
│   ├── DATA_MIGRATION_PLAN.md         # 数据迁移方案设计（46KB）
│   ├── DATA_MIGRATION_SUMMARY.md      # 数据迁移总结（9.2KB）
│   ├── MIGRATION_GUIDE.md             # 迁移指南（11KB）⭐
│   ├── MIGRATION_ROLLBACK_PLAN.md     # 回滚方案（26KB）
│   └── MIGRATION_VALIDATION_PLAN.md   # 验证方案（28KB）
│
├── 系统使用
│   ├── mcp-server.md                  # MCP Server 使用文档（6.6KB）
│   ├── FILE_LOCK_USAGE.md             # 文件锁使用文档（7.6KB）
│   └── PROJECT_PROGRESS.md            # 项目进度跟踪（4.2KB）
│
└── 任务报告
    └── TASK144_COMPLETION_REPORT.md   # FileLock 实现报告
```

---

## 核心文档说明

### 数据迁移文档

#### MIGRATION_GUIDE.md ⭐
- **大小：** 11KB
- **内容：** 完整的数据迁移操作指南
- **适用场景：** Phase 1 → Phase 2 迁移
- **核心内容：**
  - 迁移特点（零停机、Shadow Migration Pattern）
  - 前置条件和系统要求
  - 详细迁移步骤（5 步）
  - 迁移过程详解（8 个步骤）
  - 四层验证机制
  - 回滚流程
  - 故障排查
  - 迁移清单

**快速开始：**
```bash
# 1. 预检查
prism migrate --dry-run

# 2. 执行迁移
prism migrate

# 3. 验证迁移
prism migrate --status
```

#### DATA_MIGRATION_PLAN.md
- **大小：** 46KB
- **内容：** 数据迁移方案设计
- **目标读者：** 架构师、技术负责人
- **核心内容：**
  - Shadow Migration Pattern 设计
  - 迁移步骤定义（8 步）
  - 数据兼容性保证
  - 性能目标

#### MIGRATION_ROLLBACK_PLAN.md
- **大小：** 26KB
- **内容：** 回滚方案详细设计
- **重要性：** 保证迁移安全性
- **核心内容：**
  - 回滚触发条件
  - 回滚步骤（4 步）
  - 回滚验证
  - 紧急回滚流程

#### MIGRATION_VALIDATION_PLAN.md
- **大小：** 28KB
- **内容：** 迁移验证方案
- **核心内容：**
  - 四层验证机制
  - 验证检查清单
  - 自动化验证脚本

#### DATA_MIGRATION_SUMMARY.md
- **大小：** 9.2KB
- **内容：** 数据迁移总结
- **快速了解：** 迁移整体情况

### 系统使用文档

#### mcp-server.md
- **大小：** 6.6KB
- **内容：** MCP Server 使用文档
- **适用场景：** Claude Desktop 集成
- **核心内容：**
  - MCP Server 功能介绍
  - 配置方法
  - 工具列表和使用示例
  - 故障排查

**配置示例：**
```json
{
  "mcpServers": {
    "prism-gateway": {
      "command": "bun",
      "args": ["run", "/path/to/prism-gateway/src/mcp/server.ts"]
    }
  }
}
```

#### FILE_LOCK_USAGE.md
- **大小：** 7.6KB
- **内容：** 文件锁使用文档
- **技术实现：** 跨平台文件锁（基于 mkdir 原子操作）
- **核心内容：**
  - 文件锁原理
  - API 使用方法
  - 最佳实践
  - 注意事项

**使用示例：**
```typescript
import { FileLock } from 'prism-gateway';

const lock = new FileLock('/tmp/my.lock');
await lock.acquire();
try {
  // 临界区代码
} finally {
  await lock.release();
}
```

#### PROJECT_PROGRESS.md
- **大小：** 4.2KB
- **内容：** 项目进度跟踪
- **更新频率：** 每 30 分钟或 Task 状态变化时
- **核心内容：**
  - 总体进度（Phase 1: 30% 完成）
  - Task 执行状态
  - 质量指标
  - Council 触发条件
  - 项目健康度

### 任务报告

#### TASK144_COMPLETION_REPORT.md
- **内容：** FileLock 实现报告
- **技术亮点：**
  - 跨平台支持（macOS/Linux/Windows）
  - 进程崩溃安全
  - 性能：acquire <50ms
  - 45 个测试通过

---

## 数据迁移详解

### Shadow Migration Pattern

PRISM-Gateway 采用 Shadow Migration Pattern 实现零停机迁移：

```
┌─────────────────────────────────────────────────────────────┐
│                   Shadow Migration Pattern                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1 数据        Phase 2 数据                           │
│  (永不修改)         (并行创建)                              │
│     │                   │                                   │
│     ├── level-1-hot/   │                                   │
│     ├── level-2-warm/  │                                   │
│     └── level-3-cold/  │                                   │
│                         │                                   │
│  备份 ─────────────────►│                                   │
│  (自动创建)             │                                   │
│                         │                                   │
│  验证 ─────────────────►│                                   │
│  (数据完整性)           │                                   │
│                         │                                   │
│  回滚 ◄─────────────────│                                   │
│  (随时可用)             │                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 迁移步骤

| 步骤 | 名称 | 描述 | 可回滚 |
|------|------|------|--------|
| 1 | pre_validation | 系统预验证 | 否 |
| 2 | backup | 备份 Phase 1 数据 | 否 |
| 3 | init_directories | 创建 Phase 2 目录结构 | 是 |
| 4 | init_config | 初始化 Phase 2 配置 | 是 |
| 5 | init_analytics | 初始化分析存储 | 是 |
| 6 | validate_compatibility | 验证 Phase 1 兼容性 | 否 |
| 7 | data_integrity_check | 数据完整性检查 | 否 |
| 8 | write_migration_state | 写入迁移状态 | 是 |

### 目录变化

迁移后将创建以下新目录：

```
~/.prism-gateway/
├── analytics/                    # [新增] 分析数据
├── cache/                        # [新增] 缓存数据
├── config/                       # [新增] 配置文件
├── logs/                         # [新增] 活动日志
├── .migration/                   # [新增] 迁移状态
├── level-1-hot/                  # [保持] Phase 1 热数据
├── level-2-warm/                 # [保持] Phase 1 温数据
└── level-3-cold/                 # [保持] Phase 1 冷数据
```

### 四层验证机制

#### Layer 1: 系统兼容性验证
- Phase 1 数据目录存在
- 文件读写权限正常
- 必需文件完整

#### Layer 2: 数据完整性验证
- principles.json 可解析且结构正确
- success_patterns.json 可解析且结构正确
- failure_patterns.json 可解析且结构正确
- retros/index.jsonl 格式正确
- violations.jsonl 格式正确

#### Layer 3: 业务逻辑验证
- Gateway 检查功能正常
- 复盘功能正常
- 数据读取功能正常
- 统计功能正常

#### Layer 4: 性能验证
- 100 条记录迁移 < 1 秒
- 1000 条记录迁移 < 5 分钟
- 数据读取性能无明显下降

---

## 文件锁技术详解

### 设计原理

基于文件系统的原子操作（mkdir）实现跨平台文件锁：

```typescript
// macOS/Linux: mkdir 是原子操作
// Windows: 使用专属文件锁 API

class FileLock {
  async acquire(): Promise<void> {
    // 1. 尝试创建锁目录
    // 2. 如果失败，等待并重试
    // 3. 成功后写入当前进程信息
  }

  async release(): Promise<void> {
    // 1. 验证锁是否属于当前进程
    // 2. 删除锁目录
  }
}
```

### 性能指标

| 指标 | 目标 | 实际 | 测试数 |
|------|------|------|--------|
| acquire 时间 | <100ms | <50ms | 45 个测试 |
| release 时间 | <50ms | <10ms | - |
| 崩溃恢复 | 支持 | 支持 | - |

### 使用场景

1. **多 Agent 并发安全**：防止多个 Agent 同时写文件
2. **数据迁移保护**：迁移过程中防止数据被修改
3. **资源互斥**：确保独占访问某些资源

---

## MCP Server 集成

### 功能概述

MCP Server 暴露 PRISM-Gateway 的核心能力为 MCP 工具：

| 工具 | 功能 | 输入 | 输出 |
|------|------|------|------|
| gateway_check | 检查任务意图 | intent, context | CheckResult |
| extract_data | 提取 7 维度数据 | conversation, dimensions | ExtractionResult |
| trigger_retro | 触发复盘 | mode, project, timeframe | Retrospective |
| query_patterns | 查询模式 | keyword, category | Pattern[] |
| query_principles | 查询原则 | category | Principle[] |
| get_stats | 获取统计 | period | Statistics |

### 配置方法

在 Claude Desktop 配置文件中添加：

```json
{
  "mcpServers": {
    "prism-gateway": {
      "command": "bun",
      "args": ["run", "/path/to/prism-gateway/src/mcp/server.ts"],
      "env": {
        "PRISM_GATEWAY_PATH": "~/.prism-gateway"
      }
    }
  }
}
```

### 使用示例

在 Claude Desktop 中：

```
User: 请检查我的任务意图是否符合 Gateway 原则
Claude: [调用 gateway_check 工具]
      检查结果：PASS
      建议继续执行任务
```

---

## 项目进度跟踪

### 进度概览

```
Phase 1 MVP: 100% ✅
Phase 2.0 准备周: 100% ✅
Week 2-3: 100% ✅
Week 4-5: 0% ⏳
Week 6-7: 0% ⏳
Week 8-9: 0% ⏳
Week 10-11: 0% ⏳
```

### 质量指标

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 单元测试覆盖率 | >80% | 100% (28/28) | ✅ |
| 测试通过率 | 100% | 100% | ✅ |
| 性能指标达标 | 100% | 100% | ✅ |
| 代码质量 | 高 | 高 | ✅ |

---

## 常见问题 (FAQ)

### Q1: 迁移失败怎么办？

**A:** 按以下步骤排查：

1. 检查迁移状态：`prism migrate --status`
2. 查看错误日志
3. 根据错误类型参考故障排查章节
4. 必要时执行回滚：`prism migrate --rollback`

### Q2: 文件锁会死锁吗？

**A:** 不会。文件锁具有以下保护机制：

- 自动过期：默认 5 分钟
- 进程崩溃自动释放
- 提供强制解锁接口

### Q3: MCP Server 响应慢怎么办？

**A:** 可能原因和解决方法：

- 原因 1：数据量大，缓存未预热 → 多查询几次
- 原因 2：磁盘 IO 慢 → 检查磁盘健康
- 原因 3：网络问题（stdio 模式无影响）→ 检查网络

---

## 相关文件清单

### 数据迁移文档（5 个）
- `DATA_MIGRATION_PLAN.md` (46KB)
- `DATA_MIGRATION_SUMMARY.md` (9.2KB)
- `MIGRATION_GUIDE.md` (11KB) ⭐
- `MIGRATION_ROLLBACK_PLAN.md` (26KB)
- `MIGRATION_VALIDATION_PLAN.md` (28KB)

### 系统使用文档（3 个）
- `mcp-server.md` (6.6KB)
- `FILE_LOCK_USAGE.md` (7.6KB)
- `PROJECT_PROGRESS.md` (4.2KB)

### 任务报告（1 个）
- `TASK144_COMPLETION_REPORT.md`

---

**模块维护者：** PRISM-Gateway Team
**最后更新：** 2026-02-04
