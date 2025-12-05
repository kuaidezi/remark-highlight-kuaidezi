/**
 * 测试自定义remark-highlight插件的核心脚本
 * 功能：
 * 1. 读取本地Markdown测试文件
 * 2. 解析并获取插件处理后的MDAST语法树（输出为JSON文件）
 * 3. 完整执行Markdown→HTML转换流水线（应用高亮插件）
 * 4. 将最终HTML结果输出为文件
 * 环境：Node.js + ES模块（package.json需设置"type": "module"）
 */

// ===================== 核心依赖导入 =====================
// 1. unified核心：串联remark/rehype插件，实现Markdown→HTML的完整处理流程
import { unified } from 'unified';
// 2. remark-parse：将原始Markdown文本解析为MDAST（Markdown抽象语法树）
import remarkParse from 'remark-parse';
// 3. remark-rehype：MDAST→HAST（HTML抽象语法树）的桥梁插件
import remarkRehype from 'remark-rehype';
// 4. rehype-stringify：将HAST转换为最终的HTML字符串
import rehypeStringify from 'rehype-stringify';

// 5. Node.js文件操作（异步版）：读取测试文件、写入输出文件
import { readFile, writeFile } from 'fs/promises';
// 6. URL/路径处理：解决ES模块中__dirname缺失的问题，拼接绝对路径
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 7. 导入自定义开发的remark-highlight插件（Rollup打包后的ES模块版本）
//    路径指向项目根目录dist下的产物，确保测试的是最终发布版本
import remarkHighlight from '../dist/index.esm.js';

/**
 * 核心测试函数：完整验证remark-highlight插件的功能
 * 执行流程：读取文件 → 解析MDAST → 应用插件 → 输出MDAST → 转换HTML → 输出HTML
 */
async function testMarkdownParse() {
    try {
        // ===================== 第一步：读取Markdown测试文件 =====================
        // 1. 获取当前脚本文件（test/index.js）的绝对目录（解决ES模块无__dirname问题）
        const __dirname = dirname(fileURLToPath(import.meta.url));
        // 2. 拼接example.md的绝对路径（避免相对路径陷阱，不受执行目录影响）
        const mdPath = join(__dirname, './example.md');
        // 3. 读取Markdown文件内容（指定utf8编码，避免返回Buffer）
        const mdContent = await readFile(mdPath, 'utf8');
        // 控制台输出原始内容，验证文件读取成功
        console.log('📝 原始Markdown内容：\n', mdContent, '\n');

        // ===================== 第二步：获取插件处理后的MDAST =====================
        // 1. 创建仅包含解析器的unified实例（只解析，不编译）
        const parser = unified().use(remarkParse);
        // 2. 解析原始Markdown为未处理的MDAST语法树
        const rawMdast = parser.parse(mdContent);
        // 3. 手动实例化并执行高亮插件（模拟unified的use逻辑，修改MDAST）
        const highlightPlugin = remarkHighlight();
        highlightPlugin(rawMdast); // 插件核心逻辑：识别!!内容!!并生成highlight节点

        // --- 将MDAST写入JSON文件（方便查看完整结构） ---
        // 定义MDAST输出文件路径（test目录下的mdast-output.json）
        const mdastOutputPath = join(__dirname, './mdast-output.json');
        // 将MDAST对象转换为格式化的JSON字符串（缩进2空格，易读）并写入文件
        await writeFile(
            mdastOutputPath,
            JSON.stringify(rawMdast, null, 2), // null=无过滤，2=缩进格式
            'utf8' // 编码格式，避免中文乱码
        );
        // 控制台提示文件写入成功，方便定位文件
        console.log(`✅ MDAST已成功写入文件：${mdastOutputPath}\n`);

        // ===================== 第三步：完整流水线生成HTML =====================
        // 1. 创建完整的unified处理流水线：解析→应用插件→MDAST转HAST→HAST转HTML
        const result = await unified()
            .use(remarkParse)          // 阶段1：Markdown → MDAST
            .use(remarkHighlight)      // 阶段2：应用自定义插件，修改MDAST（生成highlight节点）
            .use(remarkRehype, {       // 阶段3：MDAST → HAST（自定义节点转换规则）
                // 自定义处理器：将highlight MDAST节点转换为带样式的span HAST节点
                handlers: {
                    highlight: (h, node) => {
                        // h：HAST节点创建函数，参数：上下文节点、标签名、属性、子节点
                        return h(
                            node,                          // 上下文节点（继承位置信息）
                            'span',                        // HTML标签名
                            { style: 'color:red;font-weight:bold' }, // 标签属性（高亮样式）
                            node.children                   // 子节点（高亮文本内容）
                        );
                    }
                }
            })
            .use(rehypeStringify)      // 阶段4：HAST → HTML字符串
            .process(mdContent);       // 执行完整流水线（传入原始Markdown内容）

        // --- 将最终HTML写入文件（方便查看转换结果） ---
        const htmlOutputPath = join(__dirname, './html-output.html');
        await writeFile(htmlOutputPath, result.toString(), 'utf8');
        console.log(`✅ HTML已成功写入文件：${htmlOutputPath}\n`);

        // 控制台输出最终HTML结果，快速验证
        console.log('✅ 最终解析为HTML：\n', result.toString(), '\n');

    } catch (error) {
        // 捕获并输出所有异常（文件读取/解析/插件执行/文件写入错误）
        console.error('❌ 处理失败：', error);
    }
}

// 执行测试函数（异步函数需主动调用，ES模块顶层无await）
testMarkdownParse();