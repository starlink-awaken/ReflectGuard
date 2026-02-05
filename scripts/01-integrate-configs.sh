#!/bin/bash
# 阶段 1: 配置文件整合
# 此脚本整合 tsconfig.json 和 typedoc 配置文件

set -euo pipefail

PRISM_DIR="/Volumes/Model/Workspace/Agent/prism-gateway-docs/prism-gateway"

echo "=========================================="
echo "=== 阶段 1: 配置文件整合 ==="
echo "=========================================="
echo ""

cd "$PRISM_DIR"

# 1. 创建 config/ 目录
echo "1. 创建 config/ 目录..."
mkdir -p config
echo "   ✅ config/ 已创建"
echo ""

# 2. 移动并整合 tsconfig.json
echo "2. 整合 tsconfig.json..."
if [ -f "tsconfig.json" ]; then
    mv tsconfig.json config/tsconfig.json
    echo "   ✅ tsconfig.json -> config/tsconfig.json"
else
    echo "   ⚠️  tsconfig.json 不存在，创建默认配置"
    cat > config/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
fi
echo ""

# 3. 创建整合的 typedoc.json
echo "3. 整合 typedoc 配置..."
cat > config/typedoc.json << 'EOF'
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": [
    "src/index.ts",
    "src/core/GatewayGuard.ts",
    "src/core/MemoryStore.ts",
    "src/core/DataExtractor.ts",
    "src/core/RetrospectiveCore.ts",
    "src/core/QuickReview.ts",
    "src/core/PatternMatcher.ts",
    "src/core/PrincipleChecker.ts",
    "src/core/TrapDetector.ts",
    "src/types/index.ts",
    "src/types/checks.ts"
  ],
  "out": "docs/api",
  "name": "PRISM-Gateway API Documentation",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "markdown",
  "readme": "docs/api/README.md",
  "exclude": [
    "**/tests/**",
    "**/test/**",
    "**/*.test.ts",
    "node_modules/**",
    "dist/**"
  ],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "categorizeByGroup": true,
  "sort": ["source-order"],
  "kindSortOrder": [
    "Module", "Namespace", "Enum", "EnumMember",
    "Class", "Interface", "TypeAlias",
    "Constructor", "Property", "Method", "Function", "Variable"
  ],
  "hideGenerator": true,
  "gitRevision": "main",
  "includeVersion": true,
  "version": "1.0.0",
  "hideBreadcrumbs": true,
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "commentStyle": "jsdoc",
  "logLevel": "Info"
}
EOF
echo "   ✅ config/typedoc.json 已创建（整合后）"
echo ""

# 4. 创建根级 tsconfig.json 引用
echo "4. 创建根级 tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "extends": "./config/tsconfig.json",
  "references": []
}
EOF
echo "   ✅ tsconfig.json -> extends ./config/tsconfig.json"
echo ""

# 5. 迁移 hooks 配置
echo "5. 迁移 hooks 配置..."
mkdir -p .prism/config
if [ -f "hooks.config.json" ]; then
    mv hooks.config.json .prism/config/hooks.json
    echo "   ✅ hooks.config.json -> .prism/config/hooks.json"
else
    echo "   ⚠️  hooks.config.json 不存在，创建默认配置"
    cat > .prism/config/hooks.json << 'EOF'
{
  "enabled": true,
  "hooks": {
    "session_start": {
      "enabled": true,
      "loadProjectState": true,
      "checkHistoricalViolations": true,
      "maxHistoricalLookback": 7
    },
    "format_reminder": {
      "enabled": true,
      "performIntentCheck": true,
      "checkTimeout": 500,
      "blockOnHardViolation": false,
      "maxSuggestions": 5
    },
    "stop": {
      "enabled": true,
      "autoRetrospective": true,
      "retroType": "quick",
      "minDuration": 60000,
      "saveLearnings": true
    }
  },
  "performance": {
    "maxExecutionTime": 1000,
    "asyncExecution": false,
    "retryOnFailure": false,
    "maxRetries": 1
  },
  "version": "1.0.0"
}
EOF
fi
echo ""

# 6. 更新 package.json 脚本
echo "6. 更新 package.json 脚本..."
if [ -f "package.json" ]; then
    # 使用 jq 或直接替换
    if command -v jq &> /dev/null; then
        jq '.scripts.build = "bun build src/index.ts --outdir dist --config config/tsconfig.json"' \
            package.json > package.json.tmp
        jq '.scripts.docs = "typedoc --config config/typedoc.json"' \
            package.json.tmp > package.json
        rm -f package.json.tmp
        echo "   ✅ package.json 脚本已更新"
    else
        echo "   ⚠️  jq 未安装，手动更新 package.json 中的 build 和 docs 脚本"
    fi
else
    echo "   ⚠️  package.json 不存在"
fi
echo ""

# 7. 创建配置说明文档
echo "7. 创建配置说明文档..."
cat > config/README.md << 'EOF'
# PRISM-Gateway 配置目录

本目录存储项目的构建和编译配置。

## 配置文件

### tsconfig.json
TypeScript 编译配置。项目主配置文件。

### typedoc.json
TypeDoc API 文档生成配置。

## 使用

```bash
# TypeScript 编译检查
tsc --project config/tsconfig.json --noEmit

# 生成 API 文档
typedoc --config config/typedoc.json
```

## 配置优先级

1. `config/tsconfig.json` - 主配置
2. `config/typedoc.json` - TypeDoc 配置（整合了 typedoc.json 和 typedoc-html.json）
3. `.prism/config/hooks.json` - Hook 系统配置
EOF
echo "   ✅ config/README.md 已创建"
echo ""

echo "=========================================="
echo "✅ 配置文件整合完成"
echo "=========================================="
echo ""
echo "迁移摘要:"
echo "  tsconfig.json       -> config/tsconfig.json"
echo "  typedoc*.json       -> config/typedoc.json (整合)"
echo "  hooks.config.json   -> .prism/config/hooks.json"
echo ""
echo "下一步: 执行 scripts/02-move-reports.sh"
