#!/bin/bash
# 阶段 5: Import 路径更新
# 分析并更新 import 路径（如果需要）

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 5: Import 路径更新 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 1. 分析现有 import 路径
echo "1. 分析现有 import 路径..."
echo "   检查深层相对路径..."

# 查找可能需要更新的导入路径
DEEP_IMPORTS=$(grep -r "from ['\"]\.\./\.\./\.\./" src/ --include="*.ts" 2>/dev/null || true)
MEDIUM_IMPORTS=$(grep -r "from ['\"]\.\./\.\./" src/ --include="*.ts" 2>/dev/null || true)

if [ -n "$DEEP_IMPORTS" ]; then
    echo "   ⚠️  发现深层相对路径:"
    echo "$DEEP_IMPORTS" | head -5
    DEEP_FOUND=1
else
    echo "   ✅ 未发现深层相对路径 (../../*/)"
    DEEP_FOUND=0
fi

if [ -n "$MEDIUM_IMPORTS" ]; then
    MEDIUM_COUNT=$(echo "$MEDIUM_IMPORTS" | wc -l)
    echo "   ℹ️  中层相对路径: $MEDIUM_COUNT 个"
else
    echo "   ✅ 未发现中层相对路径"
fi
echo ""

# 2. 分析当前目录结构
echo "2. 确认目录结构..."
if [ -d "src/core" ] && [ -d "src/types" ] && [ -d "src/utils" ]; then
    echo "   ✅ src/ 目录结构完整"
    echo "      - src/core/"
    echo "      - src/types/"
    echo "      - src/utils/"
    echo "      - src/infrastructure/"
    echo "      - src/integration/"
    echo "      - src/cli/"
else
    echo "   ⚠️  src/ 目录结构不完整"
fi
echo ""

# 3. 创建路径映射配置（预防性，供未来使用）
echo "3. 创建路径映射配置..."
cat > config/tsconfig.paths.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": "..",
    "paths": {
      "@core/*": ["src/core/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@integration/*": ["src/integration/*"],
      "@cli/*": ["src/cli/*"],
      "@tests/*": ["src/tests/*"]
    }
  }
}
EOF
echo "   ✅ config/tsconfig.paths.json 已创建"
echo ""

# 4. 更新主 tsconfig 添加 paths 引用
echo "4. 更新 tsconfig 引用..."
if [ -f "config/tsconfig.json" ]; then
    # 检查是否已包含 paths
    if ! grep -q "\"paths\"" config/tsconfig.json; then
        # 如果 jq 可用，使用 jq 合并
        if command -v jq &> /dev/null; then
            jq '.compilerOptions += {"baseUrl": ".", "paths": {"@core/*": ["src/core/*"], "@types/*": ["src/types/*"], "@utils/*": ["src/utils/*"], "@infrastructure/*": ["src/infrastructure/*"], "@integration/*": ["src/integration/*"], "@cli/*": ["src/cli/*"]}}' \
                config/tsconfig.json > /tmp/tsconfig-new.json
            mv /tmp/tsconfig-new.json config/tsconfig.json
            echo "   ✅ config/tsconfig.json 已添加路径映射"
        else
            echo "   ⚠️  jq 未安装，跳过自动更新"
            echo "      手动将 config/tsconfig.paths.json 内容合并到 tsconfig.json"
        fi
    else
        echo "   ℹ️  tsconfig.json 已包含 paths 配置"
    fi
fi
echo ""

# 5. 验证 import 路径
echo "5. 验证 import 路径..."
if command -v tsc &> /dev/null; then
    echo "   运行 TypeScript 编译检查..."
    if tsc --project config/tsconfig.json --noEmit 2>&1 | tee /tmp/tsc-output.log; then
        echo "   ✅ TypeScript 编译检查通过"
    else
        ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.log || echo "0")
        echo "   ⚠️  发现 $ERROR_COUNT 个编译错误（可能需要修复）"
    fi
else
    echo "   ⚠️  tsc 未安装，跳过编译检查"
fi
echo ""

# 6. 创建 import 迁移指南
echo "6. 创建 import 迁移指南..."
cat > config/IMPORT_MIGRATION.md << 'EOF'
# Import 路径迁移指南

## 当前状态

由于重构没有移动 `src/` 目录下的文件，大部分 import 路径无需更新。

## 路径映射

项目配置了以下路径映射（可选使用）：

```typescript
// 旧方式（仍然有效）
import { GatewayGuard } from '../core/GatewayGuard.js';

// 新方式（使用路径映射，需要配置）
import { GatewayGuard } from '@core/GatewayGuard.js';
```

## 启用路径映射

1. 确保 `config/tsconfig.json` 包含 `paths` 配置
2. 配置构建工具支持路径映射（如需要）

## 迁移命令

如果需要批量更新 import 路径，可以使用以下命令：

```bash
# 查找所有需要更新的文件
grep -r "from ['\"]\.\./\.\./" src/ --include="*.ts"

# 使用 sed 替换（谨慎使用）
find src/ -name "*.ts" -exec sed -i '' "s|from '\.\./core/|from '@core/|g" {} \;
```

## 验证

```bash
# TypeScript 编译检查
tsc --project config/tsconfig.json --noEmit

# 运行测试
bun test
```
EOF
echo "   ✅ config/IMPORT_MIGRATION.md 已创建"
echo ""

echo "=========================================="
echo "✅ Import 路径分析完成"
echo "=========================================="
echo ""
echo "分析结果:"
if [ $DEEP_FOUND -eq 1 ]; then
    echo "  ⚠️  发现深层相对路径，建议手动检查"
else
    echo "  ✅ 未发现需要更新的 import 路径"
fi
echo ""
echo "下一步: 执行 scripts/06-verify.sh"
