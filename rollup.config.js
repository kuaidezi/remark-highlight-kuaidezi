import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser"; // 新增：压缩插件
import { readFileSync } from "fs";

// 读取 package.json 中的包信息（可选，用于注释替换）
const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default [
  // CommonJS 版本（适配 Node.js）
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: false, // 生产包关闭 sourcemap（减小体积）
      // 保留版权注释（可选，如 MIT 许可证），移除其他注释
      banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
    },
    plugins: [
      resolve(), // 解析第三方依赖
      commonjs(), // 转换 CommonJS 为 ES 模块
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true, // 必须：生成 .d.ts 文件
        declarationDir: "dist", // 类型文件输出到 dist 目录
        rootDir: "src", // 源码根目录
      }), // TS 编译
      // 新增：压缩配置（移除注释 + 压缩代码）
      terser({
        compress: {
          drop_console: false, // 保留 console（如果插件有日志，设为 true 移除）
          pure_funcs: ["console.log"], // 可选：移除特定 console 方法
        },
        mangle: true, // 混淆变量名（进一步减小体积）
        format: {
          comments: false, // 移除所有注释（banner 里的版权注释除外）
        },
      }),
    ],
    external: ["unist-util-visit", "tslib"], // 排除外部依赖（不打包进产物）
  },
  // ES 模块版本（适配浏览器/ES 模块）
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: false,
      banner: `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser({
        compress: { drop_console: false },
        mangle: true,
        format: { comments: false },
      }),
    ],
    external: ["unist-util-visit", "tslib"],
  },
];
