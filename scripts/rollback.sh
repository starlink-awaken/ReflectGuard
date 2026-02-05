#!/bin/bash
# 回滚脚本
# 将项目恢复到重构前的状态

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"
BACKUP_BASE="/Volumes/Model/Workspace/Agent/prism-gateway-docs/backups"

echo "=========================================="
echo "=== PRISM-Gateway 重构回滚 ==="
echo "=========================================="
echo ""

# 1. 列出可用备份
echo "可用备份目录:"
echo ""

if [ ! -d "$BACKUP_BASE" ]; then
    echo "❌ 错误: 备份目录不存在: $BACKUP_BASE"
    echo "   无法执行回滚"
    exit 1
fi

BACKUPS=($(ls -t "$BACKUP_BASE" 2>/dev/null))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo "❌ 错误: 没有找到备份"
    exit 1
fi

for i in "${!BACKUPS[@]}"; do
    backup="${BACKUPS[$i]}"
    backup_path="$BACKUP_BASE/$backup"
    if [ -d "$backup_path" ]; then
        echo "  [$i] $backup"
        if [ -f "$backup_path/backup-summary.txt" ]; then
            echo "      $(head -1 $backup_path/backup-summary.txt)"
        fi
    fi
done
echo ""

# 2. 选择备份
read -p "输入要回滚到的备份编号 (默认 0): " backup_index
backup_index=${backup_index:-0}

if [ $backup_index -lt 0 ] || [ $backup_index -ge ${#BACKUPS[@]} ]; then
    echo "❌ 错误: 无效的备份编号"
    exit 1
fi

BACKUP_NAME="${BACKUPS[$backup_index]}"
BACKUP_DIR="$BACKUP_BASE/$BACKUP_NAME"

if [ ! -d "$BACKUP_DIR/prism-gateway-backup" ]; then
    echo "❌ 错误: 备份不完整: $BACKUP_DIR"
    exit 1
fi

echo ""
echo "将回滚到: $BACKUP_NAME"
echo "备份路径: $BACKUP_DIR"
echo ""

# 3. 显示变更预览
echo "回滚将执行以下操作:"
echo "  - 删除 config/ 目录"
echo "  - 删除 .prism/ 目录"
echo "  - 删除 reports/ 目录"
echo "  - 删除 docs/guides/ 目录"
echo "  - 删除 docs/reference/ 目录"
echo "  - 恢复所有原始文件"
echo ""

# 4. 二次确认
read -p "确认回滚? 此操作不可撤销 (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消回滚"
    exit 0
fi

# 5. 执行回滚
echo ""
echo "执行回滚..."
echo ""

cd "$PRISM_DIR"

# 保存当前状态（以防需要再次回滚）
ROLLBACK_BACKUP="$BACKUP_BASE/rollback_before_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ROLLBACK_BACKUP"
cp -r "$PRISM_DIR" "$ROLLBACK_BACKUP/prism-gateway-pre-rollback"
echo "   当前状态已保存到: $ROLLBACK_BACKUP"

# 删除新创建的目录
echo "   删除新目录..."
rm -rf config/ .prism/ reports/ docs/guides/ docs/reference/ REPORTS.md REFACTOR_VERIFICATION.md 2>/dev/null || true

# 恢复备份文件
echo "   恢复备份文件..."
cp -r "$BACKUP_DIR/prism-gateway-backup/"* "$PRISM_DIR/"

echo ""
echo "=========================================="
echo "✅ 回滚完成"
echo "=========================================="
echo ""
echo "已恢复到: $BACKUP_NAME"
echo "回滚前状态保存在: $ROLLBACK_BACKUP"
echo ""
echo "建议后续步骤:"
echo "  1. 运行测试确认功能正常: bun test"
echo "  2. 检查配置文件是否正确"
echo "  3. 分析失败原因并调整重构方案"
