#!/usr/bin/env tsx
/**
 * Import 路径迁移工具
 *
 * 用于分析和更新 TypeScript 文件中的 import 路径
 * 使用方法:
 *   npx tsx import-migrator.ts analyze     # 分析当前 import 路径
 *   npx tsx import-migrator.ts update       # 更新 import 路径
 *   npx tsx import-migrator.ts verify       # 验证更新结果
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

interface ImportInfo {
  file: string;
  imports: Array<{
    statement: string;
    module: string;
    line: number;
    type: 'relative' | 'absolute' | 'node';
  }>;
}

interface AnalyzeResult {
  totalFiles: number;
  filesWithImports: number;
  deepImports: number;  // 3层及以上相对路径
  mediumImports: number; // 2层相对路径
  shallowImports: number; // 1层相对路径
  details: ImportInfo[];
}

const SRC_DIR = join(process.cwd(), 'src');

/**
 * 递归获取所有 TypeScript 文件
 */
function getAllTsFiles(dir: string, base: string = dir): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和隐藏目录
      if (item !== 'node_modules' && !item.startsWith('.')) {
        files.push(...getAllTsFiles(fullPath, base));
      }
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 分析单个文件的 import 语句
 */
function analyzeFile(filePath: string): ImportInfo {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const imports: ImportInfo['imports'] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const importMatch = line.match(/^import\s+(?:.*?from\s+)?['"]([^'"]+)['"]/);

    if (importMatch) {
      const module = importMatch[1];
      let type: ImportInfo['imports'][0]['type'];

      if (module.startsWith('.')) {
        type = 'relative';
      } else if (module.startsWith('@') || !module.includes('/')) {
        type = 'node';
      } else {
        type = 'absolute';
      }

      imports.push({
        statement: line.trim(),
        module,
        line: i + 1,
        type
      });
    }
  }

  return { file: relative(process.cwd(), filePath), imports };
}

/**
 * 分析项目中的所有 import
 */
function analyzeImports(): AnalyzeResult {
  const files = getAllTsFiles(SRC_DIR);
  const details: ImportInfo[] = [];
  let deepImports = 0;
  let mediumImports = 0;
  let shallowImports = 0;

  for (const file of files) {
    const info = analyzeFile(file);

    if (info.imports.length > 0) {
      details.push(info);

      for (const imp of info.imports) {
        if (imp.type === 'relative') {
          const depth = imp.module.split('../').length - 1;
          if (depth >= 3) {
            deepImports++;
          } else if (depth === 2) {
            mediumImports++;
          } else {
            shallowImports++;
          }
        }
      }
    }
  }

  return {
    totalFiles: files.length,
    filesWithImports: details.length,
    deepImports,
    mediumImports,
    shallowImports,
    details
  };
}

/**
 * 打印分析结果
 */
function printAnalysis(result: AnalyzeResult) {
  console.log('\n=== Import 路径分析结果 ===\n');
  console.log(`总文件数: ${result.totalFiles}`);
  console.log(`包含 import 的文件: ${result.filesWithImports}`);
  console.log(`深层相对路径 (../../*/): ${result.deepImports}`);
  console.log(`中层相对路径 (../*/): ${result.mediumImports}`);
  console.log(`浅层相对路径 (./*): ${result.shallowImports}`);

  if (result.deepImports > 0) {
    console.log('\n深层相对路径详情:');
    for (const info of result.details) {
      const deep = info.imports.filter(i => i.type === 'relative' && i.module.split('../').length >= 4);
      if (deep.length > 0) {
        console.log(`\n  ${info.file}:`);
        for (const imp of deep) {
          console.log(`    L${imp.line}: ${imp.statement}`);
        }
      }
    }
  }
}

/**
 * 使用路径映射更新 import 语句
 */
function updateImports(dryRun: boolean = false) {
  const result = analyzeImports();
  let updatedCount = 0;

  console.log('\n=== 更新 Import 路径 ===\n');

  for (const info of result.details) {
    const filePath = join(process.cwd(), info.file);
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const imp of info.imports) {
      if (imp.type === 'relative') {
        const oldModule = imp.module;
        let newModule: string | null = null;

        // 转换相对路径到路径映射
        if (oldModule.includes('../core/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/core\//, '@core/');
        } else if (oldModule.includes('../types/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/types\//, '@types/');
        } else if (oldModule.includes('../utils/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/utils\//, '@utils/');
        } else if (oldModule.includes('../infrastructure/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/infrastructure\//, '@infrastructure/');
        } else if (oldModule.includes('../integration/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/integration\//, '@integration/');
        } else if (oldModule.includes('../cli/')) {
          newModule = oldModule.replace(/\.\.\/\.\.\/cli\//, '@cli/');
        }

        if (newModule) {
          content = content.replace(
            `from '${oldModule}'`,
            `from '${newModule}'`
          );
          content = content.replace(
            `from "${oldModule}"`,
            `from "${newModule}"`
          );
          modified = true;
          console.log(`  ${info.file}:${imp.line}`);
          console.log`    - ${oldModule}`;
          console.log`    + ${newModule}`;
        }
      }
    }

    if (modified && !dryRun) {
      writeFileSync(filePath, content);
      updatedCount++;
    }
  }

  if (dryRun) {
    console.log('\n[DRY RUN] 未修改任何文件');
  } else {
    console.log(`\n已更新 ${updatedCount} 个文件`);
  }
}

/**
 * 验证更新后的 import 路径
 */
function verifyUpdates() {
  console.log('\n=== 验证 Import 更新 ===\n');

  const result = analyzeImports();
  let hasIssues = false;

  // 检查是否还有深层相对路径
  if (result.deepImports > 0) {
    console.log('⚠️  仍有深层相对路径未更新');
    hasIssues = true;
  }

  // 检查路径映射使用情况
  let pathAliasCount = 0;
  for (const info of result.details) {
    for (const imp of info.imports) {
      if (imp.module.startsWith('@core/') || imp.module.startsWith('@types/')) {
        pathAliasCount++;
      }
    }
  }

  console.log(`路径映射使用: ${pathAliasCount} 个`);

  if (!hasIssues) {
    console.log('\n✅ Import 路径验证通过');
  } else {
    console.log('\n⚠️  发现问题，请检查');
  }
}

// CLI 入口
const command = process.argv[2] || 'analyze';

switch (command) {
  case 'analyze':
    printAnalysis(analyzeImports());
    break;

  case 'update':
    updateImports(process.argv.includes('--dry-run'));
    break;

  case 'verify':
    verifyUpdates();
    break;

  default:
    console.log(`
用法: npx tsx import-migrator.ts <command> [options]

命令:
  analyze     分析当前 import 路径（默认）
  update      更新 import 路径为路径映射
  verify      验证更新结果

选项:
  --dry-run   预览更改（不修改文件）

示例:
  npx tsx import-migrator.ts analyze
  npx tsx import-migrator.ts update --dry-run
  npx tsx import-migrator.ts update
  npx tsx import-migrator.ts verify
`);
    process.exit(1);
}
