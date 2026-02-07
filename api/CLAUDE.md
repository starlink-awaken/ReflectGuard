# API 模块文档

[根目录](../CLAUDE.md) > **api**

---

## 变更记录 (Changelog)

### 2026-02-06
- **新增安全和基础设施模块文档**（v2.2.0）
  - KeyManagementService - AES-256-GCM加密服务
  - ErrorHandler - 统一错误处理中间件
  - LoggerSanitizer - 日志脱敏工具
  - timingSafeEqual - 恒定时间比较工具
- 更新README.md，添加新模块API文档

### 2026-02-04
- 初始化模块文档
- 完成 API 文档扫描和分类

---

## 模块职责

API 模块提供 PRISM-Gateway 系统的**完整 API 文档**，包括核心类、接口定义、使用示例和类型说明。

**主要职责：**
- 记录所有公共 API 的接口定义
- 提供代码示例和使用场景
- 说明类型定义和数据结构
- 指导开发者正确使用 API

---

## 目录结构

```
api/
├── 核心 API
│   ├── README.md                   # API 文档总览（13KB）⭐
│   ├── GatewayGuard.md             # Gateway 检查器（5.5KB）
│   ├── MemoryStore.md              # 三层 MEMORY 架构（9.4KB）
│   ├── DataExtractor.md            # 7 维度数据提取（9.9KB）
│   ├── RetrospectiveCore.md        # 复盘核心引擎（8.7KB）
│   └── QuickReview.md              # 快速复盘工具（7.0KB）
│
├── 模式匹配器
│   ├── PatternMatcher.md           # 模式匹配器（6.7KB）
│   ├── PrincipleChecker.md         # 原则检查器（7.8KB）
│   └── TrapDetector.md             # 陷阱检测器（7.8KB）
│
└── 辅助文件
    └── _sidebar.md                 # 文档侧边栏配置
```

---

## 核心 API 说明

### README.md ⭐
- **大小：** 13KB
- **内容：** API 文档总览和快速开始指南
- **核心内容：**
  - 系统概述
  - 安装和快速开始
  - 核心模块介绍
  - CLI 使用示例
  - 性能目标
  - 存储路径说明

**快速开始：**
```typescript
import { prismGateway } from 'prism-gateway';

// 快速复盘
const retroResult = await prismGateway.quickRetro('my-project', {
  phase: 'Development',
  history: []
});

// 检查任务意图
const checkResult = await prismGateway.checkIntent('实现用户登录');
console.log(checkResult.status); // PASS | WARNING | BLOCKED
```

### GatewayGuard.md
- **大小：** 5.5KB
- **内容：** Gateway 检查器 API
- **三层检查机制：**
  1. Layer 1: Principle checking (MANDATORY) - 基于 5 条行为准则
  2. Layer 2: Pattern matching (WARNING) - 识别成功/失败模式
  3. Layer 3: Trap detection (ADVISORY) - 检测常见陷阱

**API 方法：**
```typescript
// 完整检查（三层）
gatewayGuard.check(intent: string, context?: CheckContext): Promise<CheckResult>

// 快速检查（仅原则）
gatewayGuard.quickCheck(intent: string): Promise<boolean>

// 格式化结果
gatewayGuard.formatResult(result: CheckResult): string
```

**使用示例：**
```typescript
const result = await gatewayGuard.check('实现用户登录功能', {
  phase: 'Development'
});

if (result.status === 'BLOCKED') {
  console.log('任务被阻止:', result.violations);
} else if (result.status === 'WARNING') {
  console.log('警告:', result.risks);
} else {
  console.log('检查通过');
}
```

### MemoryStore.md
- **大小：** 9.4KB
- **内容：** 三层 MEMORY 架构 API
- **三层架构：**
  - Level-1 Hot: 热数据（原则、模式），响应 <100ms
  - Level-2 Warm: 温数据（复盘记录、违规），可读写
  - Level-3 Cold: 冷数据（SOP、清单、模板），只读

**API 分类：**

##### Hot Data Access (<100ms)
```typescript
memoryStore.getPrinciples(): Promise<Principle[]>
memoryStore.getPrincipleById(id: string): Promise<Principle | undefined>
memoryStore.getSuccessPatterns(): Promise<SuccessPattern[]>
memoryStore.getFailurePatterns(): Promise<FailurePattern[]>
memoryStore.searchPatterns(keyword: string): Promise<{success, failure}>
```

##### Warm Data Access (可读写)
```typescript
memoryStore.saveRetroRecord(record: RetroRecord): Promise<void>
memoryStore.getRetroRecord(id: string): Promise<RetroRecord | null>
memoryStore.recordViolation(violation: ViolationRecord): Promise<void>
memoryStore.getRecentViolations(limit?: number): Promise<ViolationRecord[]>
memoryStore.getRecentRetros(projectId: string, limit?: number): Promise<RetroRecord[]>
```

##### Cold Data Access (只读)
```typescript
memoryStore.readSOP(name: string): Promise<string>
memoryStore.readChecklist(name: string): Promise<string>
memoryStore.readTemplate(name: string): Promise<string>
memoryStore.listTemplates(): Promise<string[]>
```

### DataExtractor.md
- **大小：** 9.9KB
- **内容：** 7 维度数据提取 API
- **7 个维度：**
  1. Principles Dimension - 违反的原则
  2. Patterns Dimension - 匹配的模式
  3. Benchmarks Dimension - 能力评估
  4. Traps Dimension - 识别的陷阱
  5. Success Dimension - 成功因素
  6. Tools Dimension - 使用的工具
  7. Data Dimension - 关键数据点

**API 方法：**
```typescript
dataExtractor.extractDimensions(
  sessionId: string,
  messages: Message[],
  context?: Record<string, any>
): Promise<ExtractionResult>
```

**配置选项：**
```typescript
{
  min_confidence_threshold: 0.6,    // 最小置信度
  max_processing_time: 300,          // 最大处理时间（ms）
  enable_dimension_weighting: true,  // 启用维度加权
  context_window_size: 10,           // 上下文窗口大小
  keyword_boost_factor: 1.2          // 关键词提升因子
}
```

### RetrospectiveCore.md
- **大小：** 8.7KB
- **内容：** 复盘核心引擎 API
- **三种复盘模式：**
  - Quick Mode: 5 分钟，4 阶段（触发、分析、提取、存储）
  - Standard Mode: 25 分钟，5 阶段（+ 反思）
  - Deep Mode: 60 分钟，6 阶段（+ 规划）

**API 方法：**
```typescript
// 执行复盘
retro.executeRetro(taskInput: RetroTaskInput): Promise<RetroExecution>

// 切换模式
retro.switchMode(mode: RetroMode): void

// 获取当前模式
retro.getCurrentMode(): RetroMode

// 检查是否需要自动触发
retro.shouldAutoTrigger(projectId: string): Promise<boolean>

// 获取复盘统计
retro.getRetroStats(): Promise<RetroStats>
```

**使用示例：**
```typescript
const retro = new RetrospectiveCore({ type: RetroMode.QUICK });

const execution = await retro.executeRetro({
  id: 'retro_123',
  projectId: 'my-project',
  triggerType: RetroTriggerType.MANUAL,
  context: {
    phase: 'Development',
    history: [],
    user_preferences: {}
  }
});

console.log(`状态: ${execution.status}`);
console.log(`时长: ${execution.totalDuration}ms`);
```

### QuickReview.md
- **大小：** 7.0KB
- **内容：** 快速复盘工具 API
- **用途：** 简化的 5 分钟复盘接口

**API 方法：**
```typescript
qr.review(input: QuickReviewInput): Promise<QuickReviewResult>
qr.cliReview(projectId: string, context: string): Promise<QuickReviewResult>
qr.toCliOutput(result: QuickReviewResult): string
qr.toJsonOutput(result: QuickReviewResult): string
qr.cleanup(): void
```

**使用示例：**
```typescript
const qr = new QuickReview();

const result = await qr.review({
  projectId: 'my-project',
  context: '完成 API 接口开发',
  tags: ['api', 'backend'],
  metadata: { phase: 'Development' }
});

console.log(qr.toCliOutput(result));
```

---

## 模式匹配器 API

### PatternMatcher.md
- **大小：** 6.7KB
- **内容：** 模式匹配器 API
- **功能：** 基于 32 个成功/失败模式进行匹配

**API 方法：**
```typescript
matcher.match(intent: string): Promise<Risk[]>
matcher.getTopRisks(risks: Risk[], n?: number): Risk[]
matcher.getFailureRisks(risks: Risk[]): Risk[]
matcher.getSuccessRisks(risks: Risk[]): Risk[]
```

### PrincipleChecker.md
- **大小：** 7.8KB
- **内容：** 原则检查器 API
- **功能：** 基于 5 条 MANDATORY 行为准则进行检查

**API 方法：**
```typescript
checker.check(intent: string, context?: { phase?: string }): Promise<Violation[]>
checker.checkPrinciple(intent: string, principleId: string): Promise<Violation | null>
checker.generateSuggestions(violations: Violation[]): string[]
```

### TrapDetector.md
- **大小：** 7.8KB
- **内容：** 陷阱检测器 API
- **功能：** 基于高频失败模式检测陷阱

**API 方法：**
```typescript
detector.detect(intent: string): Promise<Trap[]>
detector.getHighSeverityTraps(traps: Trap[]): Trap[]
```

---

## 类型定义

### CheckResult
```typescript
interface CheckResult {
  status: CheckStatus;        // PASS | WARNING | BLOCKED
  violations: Violation[];    // 原则违规
  risks: Risk[];              // 模式风险
  traps: Trap[];              // 检测到的陷阱
  suggestions: Suggestion[];  // 可操作建议
  check_time: number;         // 检查时长（ms）
  timestamp: string;          // ISO 时间戳
}
```

### Violation
```typescript
interface Violation {
  principle_id: string;
  principle_name: string;
  severity: 'MANDATORY' | 'HARD_BLOCK';
  message: string;
  detected_at: string;
}
```

### Risk
```typescript
interface Risk {
  pattern_id: string;
  pattern_name: string;
  type: 'success' | 'failure';
  confidence: number;         // 0-1
  message: string;
}
```

### Trap
```typescript
interface Trap {
  pattern_id: string;
  pattern_name: string;
  severity: '高' | '中' | '低';
  message: string;
}
```

### Principle
```typescript
interface Principle {
  id: string;                  // 例如 "P1", "P2"
  name: string;
  level: 'MANDATORY' | 'HARD_BLOCK';
  priority: number;
  check_phases: string[];
  keywords: string[];
  violation_message: string;
  verification_method: string;
  consequence: string;
  historical_evidence: string;
}
```

### RetroRecord
```typescript
interface RetroRecord {
  id: string;
  timestamp: string;
  type: 'quick' | 'standard' | 'deep';
  project: string;
  duration: number;
  summary: string;
  lessons: string[];
  improvements: string[];
  violations?: string[];
}
```

### ExtractionResult
```typescript
interface ExtractionResult {
  id: string;
  session_id: string;
  timestamp: string;
  processing_time: number;
  dimensions: {
    principles: PrinciplesDimension;
    patterns: PatternsDimension;
    benchmarks: BenchmarksDimension;
    traps: TrapsDimension;
    success: SuccessDimension;
    tools: ToolsDimension;
    data: DataDimension;
  };
  summary: string;
  confidence: number;         // 0-1
}
```

---

## CLI 使用

```bash
# 快速复盘
prism quick-review "my-project" "完成功能开发"

# 检查意图
prism check "实现用户登录"

# 显示统计
prism stats
```

---

## 性能目标

| 组件 | 目标 | 实际 |
|------|------|------|
| PrincipleChecker | <300ms | ~50ms |
| PatternMatcher | <500ms | ~100ms |
| TrapDetector | <200ms | ~30ms |
| GatewayGuard (完整) | <1000ms | ~200ms |
| MemoryStore (hot) | <100ms | ~20ms |

---

## 存储路径

数据存储在 `~/.prism-gateway/`：

```
~/.prism-gateway/
├── level-1-hot/          # Hot 数据
│   ├── principles.json
│   └── patterns/
│       ├── success_patterns.json
│       └── failure_patterns.json
├── level-2-warm/         # Warm 数据
│   ├── retros/
│   │   ├── index.jsonl
│   │   └── YYYY-MM/
│   │       └── {type}/{id}.json
│   └── violations.jsonl
└── level-3-cold/         # Cold 数据
    ├── sops/
    ├── checklists/
    └── templates/
```

---

## 相关文件清单

### 核心 API（6 个）
- `README.md` (13KB) ⭐
- `GatewayGuard.md` (5.5KB)
- `MemoryStore.md` (9.4KB)
- `DataExtractor.md` (9.9KB)
- `RetrospectiveCore.md` (8.7KB)
- `QuickReview.md` (7.0KB)

### 模式匹配器（3 个）
- `PatternMatcher.md` (6.7KB)
- `PrincipleChecker.md` (7.8KB)
- `TrapDetector.md` (7.8KB)

### 辅助文件（1 个）
- `_sidebar.md`

---

**模块维护者：** PRISM-Gateway Team
**最后更新：** 2026-02-04
