import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "fs";
import { dirname, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

// 解决 ES 模块 __dirname 问题，统一路径解析
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(pathResolve(__dirname, "package.json"), "utf8"));

// 基础 TS 配置（仅生成类型文件的核心配置）
const baseTsOptions = {
  tsconfig: pathResolve(__dirname, "tsconfig.json"),
  rootDir: pathResolve(__dirname, "src"), // 源码根目录
  // 核心：只在 CJS 产物中生成类型文件，ESM 产物不重复生成
  declaration: true,
  declarationDir: pathResolve(__dirname, "dist"),
  emitDeclarationOnly: false, // 编译 TS 同时生成 JS + 类型文件
};

export default [
  // 1. CommonJS 版本（生成类型文件 + JS 产物）
  {
    input: pathResolve(__dirname, "src/index.ts"), // 绝对路径避免解析问题
    output: {
      file: pathResolve(__dirname, "dist/index.cjs.js"),
      format: "cjs",
      sourcemap: false,
      banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
    },
    plugins: [
      resolve({
        // 修复 node-resolve 路径解析警告
        exportConditions: ["node"],
        extensions: [".ts", ".js"],
      }),
      commonjs(),
      typescript(baseTsOptions), // 完整 TS 配置（生成类型 + JS）
      terser({
        compress: { drop_console: false, pure_funcs: ["console.log"] },
        mangle: true,
        format: {
          comments: (node, comment) => /^!/i.test(comment.value), // 仅保留版权注释
        },
      }),
    ],
    external: ["unist-util-visit", "tslib"], // 排除外部依赖
  },
  // 2. ES 模块版本（仅生成 JS 产物，复用 CJS 生成的类型文件）
  {
    input: pathResolve(__dirname, "src/index.ts"),
    output: {
      file: pathResolve(__dirname, "dist/index.esm.js"),
      format: "es",
      sourcemap: false,
      banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
    },
    plugins: [
      resolve({
        exportConditions: ["module"],
        extensions: [".ts", ".js"],
      }),
      commonjs(),
      // 修复 TS5069 错误：ESM 产物关闭 declarationDir（只关闭不需要的配置）
      typescript({
        ...baseTsOptions,
        declaration: false, // 关闭类型生成（避免重复）
        declarationDir: undefined, // 清除 declarationDir 配置（核心修复 TS5069）
      }),
      terser({
        compress: { drop_console: false },
        mangle: true,
        format: { comments: (node, comment) => /^!/i.test(comment.value) },
      }),
    ],
    external: ["unist-util-visit", "tslib"],
  },
];
