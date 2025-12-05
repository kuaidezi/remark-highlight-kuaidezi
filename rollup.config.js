import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts", // 入口文件
  output: [
    // 输出 ES 模块（现代项目用）
    {
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: true,
    },
    // 输出 CommonJS 模块（Node/旧项目用）
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
      exports: "default",
    },
  ],
  plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  // 外部依赖（不打包进最终文件，让用户自己安装）
  external: ["unist-util-visit"],
};
