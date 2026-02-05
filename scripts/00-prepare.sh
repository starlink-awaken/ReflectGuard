#!/bin/bash
# 阶段 0: 准备和备份
# 执行此脚本前请确保有足够的磁盘空间

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"
BACKUP_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/backups/$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "=== 阶段 0: 准备和备份 ==="
echo "=========================================="
echo ""

# 1. 创建备份目录
echo "1. 创建备份目录..."
mkdir -p "$BACKUP_DIR"
echo "   备份目录: $BACKUP_DIR"
echo ""

# 2. 备份关键目录
echo "2. 备份 prism-gateway 目录..."
cp -r "$PRISM_DIR" "$BACKUP_DIR/prism-gateway-backup"
echo "   备份完成"
echo ""

# 3. 验证测试当前状态
echo "3. 记录当前测试状态..."
cd "$PRISM_DIR"
if command -v bun &> /dev/null; then
    bun test 2>&1 | tee "$BACKUP_DIR/test-before.log" | tail -20
else
    echo "   ⚠️  bun 未安装，跳过测试"
    touch "$BACKUP_DIR/test-before.log"
fi
echo ""

# 4. 记录当前文件结构
echo "4. 记录当前文件结构..."
find . -type f \( -name "*.ts" -o -name "*.md" -o -name "*.json" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    | sort > "$BACKUP_DIR/files-before.txt"
echo "   文件清单已保存"
echo ""

# 5. 记录配置文件内容
echo "5. 备份配置文件内容..."
mkdir -p "$BACKUP_DIR/configs"
cp "$PRISM_DIR/tsconfig.json" "$BACKUP_DIR/configs/" 2>/dev/null || true
cp "$PRISM_DIR/typedoc.json" "$BACKUP_DIR/configs/" 2>/dev/null || true
cp "$PRISM_DIR/typedoc-html.json" "$BACKUP_DIR/configs/" 2>/dev/null || true
cp "$PRISM_DIR/hooks.config.json" "$BACKUP_DIR/configs/" 2>/dev/null || true
echo "   配置文件已备份"
echo ""

# 6. 生成备份摘要
echo "6. 生成备份摘要..."
cat > "$BACKUP_DIR/backup-summary.txt" << EOF
备份时间: $(date)
备份目录: $BACKUP_DIR

文件统计:
- TypeScript 文件: $(find "$PRISM_DIR/src" -name "*.ts" 2>/dev/null | wc -l)
- Markdown 文件: $(find "$PRISM_DIR" -name "*.md" -not -path "*/node_modules/*" 2>/dev/null | wc -l)
- 配置文件: $(find "$PRISM_DIR" -maxdepth 1 -name "*.json" 2>/dev/null | wc -l)

目录结构:
$(ls -la "$PRISM_DIR" | grep "^d" | awk '{print "  " $NF}')
EOF

echo "=========================================="
echo "✅ 准备阶段完成"
echo "=========================================="
echo ""
echo "备份位置: $BACKUP_DIR"
echo "下一步: 执行 scripts/01-integrate-configs.sh"
