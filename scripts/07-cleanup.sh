#!/bin/bash
# 阶段 7: 清理原始文件
# 删除已迁移的原始文件（可选步骤）

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 7: 清理原始文件 ==="
echo "=========================================="
echo ""
echo "⚠️  警告: 此操作将删除原始文件"
echo "   请确保已完成验证脚本 (scripts/06-verify.sh)"
echo ""

# 请求确认
read -p "是否继续清理? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消清理"
    exit 0
fi

cd "$PRISM_DIR"

DELETED_COUNT=0
SKIPPED_COUNT=0

# 1. 删除根目录报告文件（已复制到 reports/）
echo "1. 清理根目录报告文件..."
echo ""

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

for file in "${REPORT_FILES[@]}"; do
    if [ -f "$file" ]; then
        # 确认 reports/ 中有对应文件
        if [ -f "reports/$file" ]; then
            rm "$file"
            echo "   ✅ 删除: $file"
            ((DELETED_COUNT++))
        else
            echo "   ⚠️  跳过: $file (reports/ 中不存在)"
            ((SKIPPED_COUNT++))
        fi
    fi
done
echo ""

# 2. 删除冗余 API 文档目录
echo "2. 清理冗余 API 文档目录..."
echo ""

if [ -d "docs/api_html" ]; then
    rm -rf "docs/api_html"
    echo "   ✅ 删除: docs/api_html/"
    ((DELETED_COUNT++))
else
    echo "   ℹ️  docs/api_html/ 不存在"
    ((SKIPPED_COUNT++))
fi

if [ -d "docs/api_new" ]; then
    rm -rf "docs/api_new"
    echo "   ✅ 删除: docs/api_new/"
    ((DELETED_COUNT++))
else
    echo "   ℹ️  docs/api_new/ 不存在"
    ((SKIPPED_COUNT++))
fi
echo ""

# 3. 删除旧的配置文件
echo "3. 清理旧配置文件..."
echo ""

if [ -f "typedoc.json" ]; then
    # 确认 config/typedoc.json 存在
    if [ -f "config/typedoc.json" ]; then
        rm "typedoc.json"
        echo "   ✅ 删除: typedoc.json"
        ((DELETED_COUNT++))
    else
        echo "   ⚠️  跳过: typedoc.json (config/ 中不存在)"
        ((SKIPPED_COUNT++))
    fi
fi

if [ -f "typedoc-html.json" ]; then
    if [ -f "config/typedoc.json" ]; then
        rm "typedoc-html.json"
        echo "   ✅ 删除: typedoc-html.json"
        ((DELETED_COUNT++))
    else
        echo "   ⚠️  跳过: typedoc-html.json (config/ 中不存在)"
        ((SKIPPED_COUNT++))
    fi
fi
echo ""

# 4. 处理原始 level-* 目录
echo "4. 处理原始 level-* 目录..."
echo ""

for level in level-1-hot level-2-warm level-3-cold; do
    if [ -d "$level" ]; then
        if [ -d ".prism/$level" ]; then
            # 检查目录是否为空
            if [ -z "$(ls -A $level 2>/dev/null)" ]; then
                rmdir "$level"
                echo "   ✅ 删除空目录: $level/"
                ((DELETED_COUNT++))
            else
                echo "   ⚠️  保留: $level/ (不为空，请手动检查)"
                ((SKIPPED_COUNT++))
            fi
        else
            echo "   ⚠️  跳过: $level/ (.prism/$level 不存在)"
            ((SKIPPED_COUNT++))
        fi
    fi
done
echo ""

# 5. 清理临时文件
echo "5. 清理临时文件..."
echo ""

TEMP_FILES=(
    "/tmp/tsc-output.log"
    "/tmp/tsc-verify.log"
    "/tmp/bun-test.log"
)

for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "   ✅ 删除临时文件: $(basename $file)"
    fi
done
echo ""

# 6. 创建清理记录
echo "6. 创建清理记录..."
cat > .prism/cleanup-record.txt << EOF
清理时间: $(date)
清理文件数: $DELETED_COUNT
跳过项目数: $SKIPPED_COUNT

已删除文件:
- 根目录报告文件 (${#REPORT_FILES[@]} 个)
- docs/api_html/ 目录
- docs/api_new/ 目录
- typedoc.json
- typedoc-html.json

保留目录:
- config/ (新)
- .prism/ (新)
- reports/ (新)
- docs/api/ (保留)
- docs/guides/ (新)
- docs/reference/ (新)
EOF
echo "   ✅ 清理记录已创建: .prism/cleanup-record.txt"
echo ""

echo "=========================================="
echo "✅ 清理完成"
echo "=========================================="
echo ""
echo "清理统计:"
echo "  删除项目: $DELETED_COUNT"
echo "  跳过项目: $SKIPPED_COUNT"
echo ""
echo "当前目录结构:"
ls -la | grep "^d" | awk '{print "  " $NF}' | grep -v "^\.$" | head -15
echo ""
echo "重构完成！新的目录结构已生效。"
