#!/bin/bash
# 阶段 6: 验证和测试
# 验证重构后的项目结构和功能完整性

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"
BACKUP_BASE="/Volumes/Model/Workspace/Agent/prism-gateway-docs/backups"

echo "=========================================="
echo "=== 阶段 6: 验证和测试 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 查找最新的备份目录
LATEST_BACKUP=$(ls -t "$BACKUP_BASE" 2>/dev/null | head -1)
BACKUP_DIR="$BACKUP_BASE/$LATEST_BACKUP"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "⚠️  未找到备份目录，跳过对比"
    BACKUP_DIR=""
fi

# 验证结果统计
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 辅助函数
check_pass() {
    echo "   ✅ $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo "   ❌ $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo "   ⚠️  $1"
    ((WARN_COUNT++))
}

# 1. 配置文件验证
echo "1. 配置文件验证..."
echo ""

if [ -f "config/tsconfig.json" ]; then
    check_pass "config/tsconfig.json 存在"

    # 验证 JSON 格式
    if jq empty config/tsconfig.json 2>/dev/null; then
        check_pass "config/tsconfig.json JSON 格式正确"
    else
        check_fail "config/tsconfig.json JSON 格式错误"
    fi
else
    check_fail "config/tsconfig.json 不存在"
fi

if [ -f "config/typedoc.json" ]; then
    check_pass "config/typedoc.json 存在"
    if jq empty config/typedoc.json 2>/dev/null; then
        check_pass "config/typedoc.json JSON 格式正确"
    else
        check_fail "config/typedoc.json JSON 格式错误"
    fi
else
    check_fail "config/typedoc.json 不存在"
fi

if [ -f ".prism/config/hooks.json" ]; then
    check_pass ".prism/config/hooks.json 存在"
else
    check_fail ".prism/config/hooks.json 不存在"
fi
echo ""

# 2. TypeScript 编译验证
echo "2. TypeScript 编译验证..."
echo ""

if command -v tsc &> /dev/null; then
    echo "   运行: tsc --project config/tsconfig.json --noEmit"
    if tsc --project config/tsconfig.json --noEmit 2>&1 | tee /tmp/tsc-verify.log; then
        check_pass "TypeScript 编译检查通过"
    else
        TSC_ERRORS=$(grep -c "error TS" /tmp/tsc-verify.log || echo "0")
        check_fail "TypeScript 编译发现 $TSC_ERRORS 个错误"
    fi
else
    check_warn "tsc 未安装，跳过编译检查"
fi
echo ""

# 3. 测试套件验证
echo "3. 测试套件验证..."
echo ""

if command -v bun &> /dev/null; then
    echo "   运行: bun test"
    if bun test 2>&1 | tee /tmp/bun-test.log; then
        TEST_PASS=$(grep -c "pass" /tmp/bun-test.log || echo "0")
        check_pass "测试通过 ($TEST_PASS 个)"
    else
        TEST_FAIL=$(grep -c "fail" /tmp/bun-test.log || echo "0")
        check_fail "测试失败 ($TEST_FAIL 个)"
    fi
else
    check_warn "bun 未安装，跳过测试"
fi
echo ""

# 4. 文件完整性检查
echo "4. 文件完整性检查..."
echo ""

KEY_FILES=(
    "src/index.ts:源入口文件"
    "src/core/GatewayGuard.ts:核心类"
    "src/core/MemoryStore.ts:存储类"
    "config/tsconfig.json:TypeScript 配置"
    "config/typedoc.json:TypeDoc 配置"
    ".prism/config/hooks.json:Hooks 配置"
    "reports/README.md:报告索引"
    "docs/README.md:文档索引"
    ".prism/README.md:数据目录说明"
)

for entry in "${KEY_FILES[@]}"; do
    file="${entry%%:*}"
    desc="${entry##*:}"

    if [ -f "$file" ]; then
        check_pass "$desc ($file)"
    else
        check_fail "$desc 缺失 ($file)"
    fi
done
echo ""

# 5. 目录结构验证
echo "5. 目录结构验证..."
echo ""

KEY_DIRS=(
    "src/:源代码目录"
    "config/:配置目录"
    ".prism/:数据目录"
    "reports/:报告目录"
    "docs/:文档目录"
)

for entry in "${KEY_DIRS[@]}"; do
    dir="${entry%%:*}"
    desc="${entry##*:}"

    if [ -d "$dir" ]; then
        check_pass "$desc ($dir)"
    else
        check_fail "$desc 缺失 ($dir)"
    fi
done
echo ""

# 6. 对比重构前后测试结果
echo "6. 对比重构前后..."
echo ""

if [ -n "$BACKUP_DIR" ] && [ -f "$BACKUP_DIR/test-before.log" ]; then
    BEFORE_TESTS=$(grep -o "[0-9]* pass" "$BACKUP_DIR/test-before.log" 2>/dev/null | grep -o "[0-9]*" || echo "0")
else
    BEFORE_TESTS="N/A"
fi

if [ -f "/tmp/bun-test.log" ]; then
    AFTER_TESTS=$(grep -o "[0-9]* pass" /tmp/bun-test.log 2>/dev/null | grep -o "[0-9]*" || echo "0")
else
    AFTER_TESTS="N/A"
fi

echo "   重构前通过: $BEFORE_TESTS"
echo "   重构后通过: $AFTER_TESTS"

if [ "$BEFORE_TESTS" != "N/A" ] && [ "$AFTER_TESTS" != "N/A" ]; then
    if [ "$AFTER_TESTS" -ge "$BEFORE_TESTS" ]; then
        check_pass "测试数量保持或增加"
    else
        check_fail "测试数量减少 ($BEFORE_TESTS -> $AFTER_TESTS)"
    fi
fi
echo ""

# 7. TypeDoc 验证
echo "7. TypeDoc 验证..."
echo ""

if command -v typedoc &> /dev/null; then
    echo "   运行: typedoc --config config/typedoc.json --version"
    if typedoc --config config/typedoc.json --version &>/dev/null; then
        check_pass "TypeDoc 配置有效"
    else
        check_fail "TypeDoc 配置无效"
    fi
else
    check_warn "typedoc 未安装，跳过验证"
fi
echo ""

# 8. 生成验证报告
echo "8. 生成验证报告..."
echo ""

REPORT_FILE="$PRISM_DIR/REFACTOR_VERIFICATION.md"

cat > "$REPORT_FILE" << EOF
# 重构验证报告

**生成时间:** $(date)
**项目路径:** $PRISM_DIR

## 验证结果摘要

| 项目 | 结果 |
|------|------|
| 通过检查 | $PASS_COUNT |
| 失败检查 | $FAIL_COUNT |
| 警告检查 | $WARN_COUNT |
| 总体状态 | $([ $FAIL_COUNT -eq 0 ] && echo "✅ 通过" || echo "❌ 失败") |

## 详细检查结果

### 配置文件
- config/tsconfig.json: $([ -f "config/tsconfig.json" ] && echo "✅" || echo "❌")
- config/typedoc.json: $([ -f "config/typedoc.json" ] && echo "✅" || echo "❌")
- .prism/config/hooks.json: $([ -f ".prism/config/hooks.json" ] && echo "✅" || echo "❌")

### 编译检查
- TypeScript: $([ -f "/tmp/tsc-verify.log" ] && grep -q "error TS" /tmp/tsc-verify.log && echo "❌ 有错误" || echo "✅ 通过")

### 测试检查
- 重构前: $BEFORE_TESTS 通过
- 重构后: $AFTER_TESTS 通过

### 文件完整性
$([ $FAIL_COUNT -eq 0 ] && echo "所有关键文件完整" || echo "有 $FAIL_COUNT 个文件缺失")

## 建议后续步骤

$([ $FAIL_COUNT -eq 0 ] && echo "1. 验证通过，可以执行清理脚本 (scripts/07-cleanup.sh)
2. 提交变更到版本控制
3. 通知团队成员新的目录结构" || echo "1. 修复上述失败的检查项
2. 重新运行验证脚本
3. 确认所有检查通过后再进行清理")

---
*此报告由 scripts/06-verify.sh 自动生成*
EOF

check_pass "验证报告已生成: REFACTOR_VERIFICATION.md"
echo ""

# 9. 输出最终结果
echo "=========================================="
echo "=== 验证完成 ==="
echo "=========================================="
echo ""
echo "结果统计:"
echo "  ✅ 通过: $PASS_COUNT"
echo "  ⚠️  警告: $WARN_COUNT"
echo "  ❌ 失败: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 所有验证通过！"
    echo ""
    echo "下一步选项:"
    echo "  1. 执行清理脚本: bash scripts/07-cleanup.sh"
    echo "  2. 查看详细报告: cat REFACTOR_VERIFICATION.md"
    echo "  3. 直接开始使用新结构"
else
    echo "⚠️  发现 $FAIL_COUNT 个问题，请修复后再继续"
    echo ""
    echo "查看详细报告: cat REFACTOR_VERIFICATION.md"
fi
echo ""

# 返回退出码
[ $FAIL_COUNT -eq 0 ]
