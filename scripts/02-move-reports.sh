#!/bin/bash
# 阶段 2: 报告文件迁移
# 将根目录的报告文件迁移到 reports/ 目录

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 2: 报告文件迁移 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 1. 创建 reports/ 目录
echo "1. 创建 reports/ 目录..."
mkdir -p reports
echo "   ✅ reports/ 已创建"
echo ""

# 2. 定义要迁移的报告文件
echo "2. 迁移报告文件..."
REPORT_FILES=(
    "TASK68_COMPLETION_REPORT.md"
    "TASK143_MCP_SERVER_COMPLETION_REPORT.md"
    "VERIFICATION_REPORT_Task63-65.md"
    "VERIFICATION_REPORT_Task66.md"
    "VERIFICATION_REPORT_Task67.md"
    "PROJECT_PROGRESS.md"
    "WEEK2-3_COMPLETION_REPORT.md"
    "DELIVERY_REPORT_Phase1_Retrospective_Phase2_Planning.md"
    "PHASE1_MVP_COMPLETION_REPORT.md"
    "PHASE1_MVP_DEEP_RETROSPECTIVE_REPORT.md"
    "PHASE2_PREPARATION_WEEK_COMPLETION_REPORT.md"
    "PHASE2_ARCHITECTURE.md"
)

COPIED_COUNT=0
for file in "${REPORT_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "reports/$file"
        echo "   ✅ $file -> reports/$file"
        ((COPIED_COUNT++))
    else
        echo "   ⚠️  $file (不存在)"
    fi
done
echo ""

# 3. 创建 reports/README.md
echo "3. 创建 reports/README.md..."
cat > reports/README.md << 'EOF'
# PRISM-Gateway 项目报告

本目录包含所有项目进度、复盘和验证报告。

## 报告索引

### 阶段报告
- [Phase 1 MVP 完成报告](./PHASE1_MVP_COMPLETION_REPORT.md) - MVP 阶段完成总结
- [Phase 1 深度复盘](./PHASE1_MVP_DEEP_RETROSPECTIVE_REPORT.md) - 详细复盘分析
- [Phase 2 准备周完成报告](./PHASE2_PREPARATION_WEEK_COMPLETION_REPORT.md) - Phase 2 准备工作
- [Phase 2 架构设计](./PHASE2_ARCHITECTURE.md) - 系统架构文档

### 交付报告
- [Phase 1 复盘与 Phase 2 规划交付](./DELIVERY_REPORT_Phase1_Retrospective_Phase2_Planning.md)
- [Week 2-3 完成报告](./WEEK2-3_COMPLETION_REPORT.md)

### 任务报告
- [Task 68 完成报告](./TASK68_COMPLETION_REPORT.md)
- [Task 143 MCP Server 完成报告](./TASK143_MCP_SERVER_COMPLETION_REPORT.md)
- [Task 63-65 验证报告](./VERIFICATION_REPORT_Task63-65.md)
- [Task 66 验证报告](./VERIFICATION_REPORT_Task66.md)
- [Task 67 验证报告](./VERIFICATION_REPORT_Task67.md)

### 进度跟踪
- [项目进度](./PROJECT_PROGRESS.md) - 当前项目状态和待办事项

## 报告生成时间

- 最早: 2025-01 (Phase 1)
- 最新: 2026-02 (Phase 2)

---
*此目录由重构脚本自动生成和维护*
EOF
echo "   ✅ reports/README.md 已创建"
echo ""

# 4. 创建根目录索引文件
echo "4. 创建根目录索引..."
cat > REPORTS.md << 'EOF'
# 报告文档索引

> **注意:** 项目报告已迁移到 [`reports/`](./reports/) 目录

所有项目进度、复盘和验证报告现在集中在 `reports/` 目录中。

## 快速链接

- [查看报告目录](./reports/)
- [Phase 2 架构设计](./reports/PHASE2_ARCHITECTURE.md)
- [项目进度](./reports/PROJECT_PROGRESS.md)

---
*重构日期: 2026-02-04*
EOF
echo "   ✅ REPORTS.md 已创建"
echo ""

echo "=========================================="
echo "✅ 报告文件迁移完成"
echo "=========================================="
echo ""
echo "迁移摘要:"
echo "  复制文件数: $COPIED_COUNT / ${#REPORT_FILES[@]}"
echo "  目标目录:  reports/"
echo ""
echo "注意: 原文件仍保留在根目录"
echo "      执行 scripts/07-cleanup.sh 可删除原文件"
echo ""
echo "下一步: 执行 scripts/03-organize-data.sh"
