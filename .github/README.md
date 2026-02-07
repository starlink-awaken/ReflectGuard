# .github 目录

PRISM-Gateway 项目的 GitHub 配置文件目录。

## 目录结构

```
.github/
├── workflows/
│   └── quality-gate.yml          # CI/CD 质量门禁工作流
├── quality-gate.config.json      # 质量门禁配置
├── quality-gate.schema.json      # 配置文件 JSON Schema
├── QUALITY_GATE_README.md        # 使用文档
└── CICD_BEST_PRACTICES.md        # 最佳实践指南
```

## 文件说明

### workflows/quality-gate.yml

GitHub Actions 工作流定义文件，包含以下质量检查任务：

| 任务 | 用途 | 超时 |
|------|------|------|
| type-check | TypeScript 类型检查 | 5 分钟 |
| lint-check | ESLint 代码规范检查 | 5 分钟 |
| unit-tests | 单元测试 | 10 分钟 |
| coverage-check | 覆盖率检查 (>85%) | 10 分钟 |
| security-scan | 安全漏洞扫描 | 5 分钟 |
| quality-gate | 质量门禁汇总 | - |

### quality-gate.config.json

质量门禁配置文件，定义质量标准：

- 覆盖率阈值：85%
- 最大复杂度：10
- 安全级别：Critical/High 阻断
- 测试通过率：100%

### QUALITY_GATE_README.md

详细的使用文档，包括：

- 工作流程说明
- 质量标准定义
- 使用指南
- 故障排查

### CICD_BEST_PRACTICES.md

CI/CD 最佳实践指南，包括：

- 核心原则
- 工作流设计
- 性能优化
- 团队协作

## 本地预检查

在推送代码前，可以先运行本地预检查：

```bash
# 方式一：使用 npm script
bun run ci

# 方式二：直接执行脚本
bash ./scripts/pre-commit-check.sh
```

## 触发条件

工作流在以下情况下触发：

1. **Pull Request** 到 main 分支
2. **Push** 到 main 分支
3. **手动触发**（通过 Actions 页面）

## 质量门禁

所有检查任务必须通过才能合并到主分支。如果任何任务失败：

1. PR 会收到详细的失败报告评论
2. 合并按钮将被禁用
3. 需要修复问题后重新推送

## 相关链接

- [GitHub Actions 文档](https://docs.github.com/actions)
- [使用文档](./QUALITY_GATE_README.md)
- [最佳实践](./CICD_BEST_PRACTICES.md)
