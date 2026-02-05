#!/bin/bash
# 阶段 4: 文档目录整合
# 整合 docs/ 下的重复 API 文档目录

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 4: 文档目录整合 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 1. 分析现有 API 文档目录
echo "1. 分析现有 API 文档目录..."
API_DIRS_COUNT=0
API_DOCS_COUNT=0

if [ -d "docs/api" ]; then
    COUNT=$(find docs/api -name "*.md" 2>/dev/null | wc -l)
    echo "   📁 docs/api/       - $COUNT 个文件 (权威源)"
    ((API_DIRS_COUNT++))
    ((API_DOCS_COUNT+=COUNT))
fi

if [ -d "docs/api_html" ]; then
    COUNT=$(find docs/api_html -name "*.html" -o -name "*.md" 2>/dev/null | wc -l)
    echo "   📁 docs/api_html/  - $COUNT 个文件 (冗余)"
    ((API_DIRS_COUNT++))
fi

if [ -d "docs/api_new" ]; then
    COUNT=$(find docs/api_new -name "*.md" 2>/dev/null | wc -l)
    echo "   📁 docs/api_new/   - $COUNT 个文件 (冗余)"
    ((API_DIRS_COUNT++))
fi

echo "   共 $API_DIRS_COUNT 个 API 文档目录，$API_DOCS_COUNT 个文档文件"
echo ""

# 2. 创建清晰的文档结构
echo "2. 创建文档结构..."
mkdir -p docs/{guides,reference}
echo "   ✅ docs/{guides,reference} 已创建"
echo ""

# 3. 分类和移动文档
echo "3. 分类移动文档..."

# 用户指南文档
GUIDE_FILES=(
    "mcp-server.md"
    "FILE_LOCK_USAGE.md"
    "MIGRATION_GUIDE.md"
)

for file in "${GUIDE_FILES[@]}"; do
    if [ -f "docs/$file" ]; then
        cp "docs/$file" "docs/guides/$file"
        echo "   ✅ [指南] docs/$file -> docs/guides/$file"
    else
        echo "   ⚠️  [指南] docs/$file 不存在"
    fi
done

# 参考文档
REFERENCE_FILES=(
    "DATA_MIGRATION_PLAN.md"
    "DATA_MIGRATION_SUMMARY.md"
    "MIGRATION_ROLLBACK_PLAN.md"
    "MIGRATION_VALIDATION_PLAN.md"
)

for file in "${REFERENCE_FILES[@]}"; do
    if [ -f "docs/$file" ]; then
        cp "docs/$file" "docs/reference/$file"
        echo "   ✅ [参考] docs/$file -> docs/reference/$file"
    else
        echo "   ⚠️  [参考] docs/$file 不存在"
    fi
done
echo ""

# 4. 更新 docs/api/README.md（如果存在）
echo "4. 更新 docs/api/README.md..."
if [ -f "docs/api/README.md" ]; then
    # 备份原文件
    cp docs/api/README.md docs/api/README.md.bak

    cat > docs/api/README.md << 'EOF'
# PRISM-Gateway API 文档

这是 PRISM-Gateway 的权威 API 参考文档，由 TypeDoc 自动生成。

## 文档结构

本目录包含以下模块的 API 文档：

- **GatewayGuard** - 核心网关守卫
- **MemoryStore** - 三层存储系统
- **DataExtractor** - 数据提取器
- **RetrospectiveCore** - 复盘核心
- **QuickReview** - 快速复盘
- **PatternMatcher** - 模式匹配器
- **PrincipleChecker** - 原则检查器
- **TrapDetector** - 陷阱检测器

## 生成文档

```bash
bun run docs
# 或
typedoc --config config/typedoc.json
```

## 查看文档

```bash
bun run docs:serve
# 访问 http://localhost:8080
```

---
*最后更新: $(date +%Y-%m-%d)*
EOF
    echo "   ✅ docs/api/README.md 已更新"
else
    echo "   ⚠️  docs/api/README.md 不存在"
fi
echo ""

# 5. 创建 docs/README.md
echo "5. 创建 docs/README.md..."
cat > docs/README.md << 'EOF'
# PRISM-Gateway 文档

欢迎使用 PRISM-Gateway 文档。

## 文档导航

### API 文档
- [API 参考](./api/) - TypeDoc 生成的 API 文档（权威源）

### 用户指南
- [MCP Server 使用指南](./guides/mcp-server.md) - MCP 集成指南
- [文件锁使用文档](./guides/FILE_LOCK_USAGE.md) - 并发控制说明
- [数据迁移指南](./guides/MIGRATION_GUIDE.md) - 迁移操作指南

### 参考文档
- [数据迁移计划](./reference/DATA_MIGRATION_PLAN.md) - 迁移详细计划
- [数据迁移总结](./reference/DATA_MIGRATION_SUMMARY.md) - 迁移结果总结
- [迁移回滚计划](./reference/MIGRATION_ROLLBACK_PLAN.md) - 回滚操作说明
- [迁移验证计划](./reference/MIGRATION_VALIDATION_PLAN.md) - 验证步骤

## 目录结构

```
docs/
├── api/         # TypeDoc 生成的 API 文档
├── guides/      # 用户使用指南
├── reference/   # 技术参考文档
└── README.md    # 本文件
```

## 贡献

文档更新请遵循以下规则：

1. API 文档由 TypeDoc 自动生成，不要手动编辑
2. 用户指南放在 `guides/` 目录
3. 技术参考放在 `reference/` 目录

---
*PRISM-Gateway Documentation v1.0.0*
EOF
echo "   ✅ docs/README.md 已创建"
echo ""

# 6. 创建冗余目录标记（不删除）
echo "6. 处理冗余目录..."
if [ -d "docs/api_html" ]; then
    cat > docs/api_html/DEPRECATED.md << 'EOF'
# 此目录已弃用

API 文档已迁移到 `../api/` 目录。

请使用 `docs/api/` 作为权威 API 文档源。

此目录将在下一版本中删除。
EOF
    echo "   ⚠️  docs/api_html/ 标记为弃用"
fi

if [ -d "docs/api_new" ]; then
    cat > docs/api_new/DEPRECATED.md << 'EOF'
# 此目录已弃用

API 文档已迁移到 `../api/` 目录。

请使用 `docs/api/` 作为权威 API 文档源。

此目录将在下一版本中删除。
EOF
    echo "   ⚠️  docs/api_new/ 标记为弃用"
fi
echo ""

echo "=========================================="
echo "✅ 文档目录整合完成"
echo "=========================================="
echo ""
echo "整合摘要:"
echo "  保留权威源: docs/api/"
echo "  新增目录: docs/{guides,reference}"
echo "  弃用目录: docs/{api_html,api_new}"
echo ""
echo "下一步: 执行 scripts/05-update-imports.sh"
