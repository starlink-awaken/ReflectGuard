#!/bin/bash
# 阶段 3: 数据目录重组
# 将 level-* 数据目录迁移到 .prism/ 下

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 3: 数据目录重组 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 1. 创建 .prism 数据目录结构
echo "1. 创建 .prism/ 目录结构..."
mkdir -p .prism/{level-1-hot,level-2-warm,level-3-cold,config,state}
echo "   ✅ .prism/ 目录结构已创建"
echo ""

# 2. 迁移现有数据（如果存在）
echo "2. 检查并迁移现有数据..."
MIGRATED_COUNT=0

for level in level-1-hot level-2-warm level-3-cold; do
    if [ -d "$level" ]; then
        FILE_COUNT=$(find "$level" -type f 2>/dev/null | wc -l)
        if [ "$FILE_COUNT" -gt 0 ]; then
            # 复制文件到新位置
            cp -r "$level"/* ".prism/$level/" 2>/dev/null || true
            echo "   ✅ $level/ -> .prism/$level/ ($FILE_COUNT 个文件)"
            ((MIGRATED_COUNT++))
        else
            echo "   ⚠️  $level/ 存在但为空"
        fi
    else
        echo "   ℹ️  $level/ 不存在（跳过）"
    fi
done
echo ""

# 3. 初始化数据结构文件（如果目录为空）
echo "3. 初始化数据结构..."

# level-1-hot: 热数据
if [ -z "$(ls -A .prism/level-1-hot 2>/dev/null)" ]; then
    mkdir -p .prism/level-1-hot/patterns
    cat > .prism/level-1-hot/principles.json << 'EOF'
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-04",
  "principles": [
    {
      "id": "p1",
      "name": "单一职责",
      "description": "每个模块只负责一件事",
      "severity": "high"
    },
    {
      "id": "p2",
      "name": "测试驱动",
      "description": "先写测试，再写代码",
      "severity": "high"
    },
    {
      "id": "p3",
      "name": "渐进增强",
      "description": "从简单开始，逐步增强",
      "severity": "medium"
    },
    {
      "id": "p4",
      "name": "配置外部化",
      "description": "配置与代码分离",
      "severity": "medium"
    },
    {
      "id": "p5",
      "name": "文档同步",
      "description": "代码与文档保持同步",
      "severity": "low"
    }
  ]
}
EOF
    echo "   ✅ .prism/level-1-hot/principles.json 已创建"
fi

# level-2-warm: 温数据
if [ -z "$(ls -A .prism/level-2-warm 2>/dev/null)" ]; then
    mkdir -p .prism/level-2-warm/retros
    touch .prism/level-2-warm/violations.jsonl
    echo "   ✅ .prism/level-2-warm/ 结构已初始化"
fi

# level-3-cold: 冷数据
if [ -z "$(ls -A .prism/level-3-cold 2>/dev/null)" ]; then
    mkdir -p .prism/level-3-cold/{sops,checklists,templates}
    echo "   ✅ .prism/level-3-cold/ 结构已初始化"
fi

# state: 运行时状态
cat > .prism/state/current.json << 'EOF'
{
  "version": "1.0.0",
  "initialized": "2026-02-04",
  "lastMigration": "2026-02-04",
  "phase": "2.0"
}
EOF
echo "   ✅ .prism/state/current.json 已创建"
echo ""

# 4. 创建 .gitignore 规则（如果需要）
echo "4. 检查 .gitignore..."
if [ -f ".gitignore" ]; then
    if ! grep -q "^\.prism/" .gitignore; then
        echo "" >> .gitignore
        echo "# PRISM-Gateway data directory" >> .gitignore
        echo ".prism/state/" >> .gitignore
        echo ".prism/level-2-warm/*.jsonl" >> .gitignore
        echo "   ✅ .gitignore 已更新"
    else
        echo "   ℹ️  .gitignore 已包含 .prism/ 规则"
    fi
else
    echo "   ⚠️  .gitignore 不存在"
fi
echo ""

# 5. 创建 .prism/README.md
echo "5. 创建 .prism/README.md..."
cat > .prism/README.md << 'EOF'
# PRISM-Gateway 数据目录

本目录存储 PRISM-Gateway 的所有运行时数据。

## 目录结构

```
.prism/
├── config/          # 配置文件
│   └── hooks.json   # Hook 系统配置
├── level-1-hot/     # 热数据（实时访问，响应 <100ms）
│   ├── principles.json  # 行为准则
│   └── patterns/        # 成功/失败模式
├── level-2-warm/    # 温数据（复盘历史，可读写）
│   ├── retros/          # 复盘记录
│   └── violations.jsonl # 违规记录
├── level-3-cold/    # 冷数据（知识库，只读）
│   ├── sops/            # 标准操作流程
│   ├── checklists/      # 检查清单
│   └── templates/       # 模板库
└── state/           # 运行时状态
    └── current.json     # 当前状态
```

## 数据层级说明

| 层级 | 访问频率 | 响应时间 | 用途 |
|------|----------|----------|------|
| level-1-hot | 实时 | <100ms | Gateway 检查、模式匹配 |
| level-2-warm | 按需 | <1s | 复盘历史、违规记录 |
| level-3-cold | 罕见 | N/A | 知识库、参考文档 |

## 数据访问

- 热数据路径: `~/.prism-gateway/level-1-hot/`
- 温数据路径: `~/.prism-gateway/level-2-warm/`
- 冷数据路径: `~/.prism-gateway/level-3-cold/`

## 注意事项

- `state/` 目录包含运行时状态，不应手动编辑
- `violations.jsonl` 是追加日志，不应删除
- `principles.json` 是核心配置，修改需谨慎

---
*此目录由重构脚本自动生成*
EOF
echo "   ✅ .prism/README.md 已创建"
echo ""

echo "=========================================="
echo "✅ 数据目录重组完成"
echo "=========================================="
echo ""
echo "重组摘要:"
echo "  迁移目录数: $MIGRATED_COUNT / 3"
echo "  新目录: .prism/{level-1-hot,level-2-warm,level-3-cold,config,state}"
echo ""
echo "下一步: 执行 scripts/04-integrate-docs.sh"
