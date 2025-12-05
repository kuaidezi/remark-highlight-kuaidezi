import type { Root, Text } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

// 定义自定义 highlight 节点类型
interface HighlightNode {
  type: "highlight";
  value: string;
  children: Text[];
  position?: import("unist").Position;
}

// 核心插件逻辑
const remarkHighlight: Plugin<[], Root> = () => {
  return (tree: any) => {
    // 遍历所有 text 类型节点
    visit(tree, "text", (node: Text, index: any, parent: any) => {
      // 防御：确保父节点和索引有效
      if (!parent || index === null || typeof index !== "number") return;

      const text = node.value;
      // 匹配 !!内容!! 的正则（关键：[^!] 匹配非!字符）
      const highlightRegex = /!!([^!]+)!!/g;

      // 如果没有匹配内容，直接返回
      if (!highlightRegex.test(text)) return;
      // 重置正则 lastIndex（避免全局匹配的坑）
      highlightRegex.lastIndex = 0;

      const newNodes: (Text | HighlightNode)[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      // 遍历所有匹配项，拆分节点
      while ((match = highlightRegex.exec(text)) !== null) {
        const [fullMatch, content] = match;
        const matchStart = match.index;
        const matchEnd = matchStart + fullMatch.length;

        // 1. 添加匹配前的普通文本
        if (matchStart > lastIndex) {
          newNodes.push({
            type: "text",
            value: text.slice(lastIndex, matchStart),
            position: node.position, // 继承位置信息
          });
        }

        // 2. 添加自定义 highlight 节点
        newNodes.push({
          type: "highlight",
          value: content,
          children: [{ type: "text", value: content }],
          position: node.position, // 继承位置信息
        });

        // 更新最后位置
        lastIndex = matchEnd;
      }

      // 3. 添加匹配后的剩余文本
      if (lastIndex < text.length) {
        newNodes.push({
          type: "text",
          value: text.slice(lastIndex),
          position: node.position,
        });
      }

      // 替换原文本节点为拆分后的新节点
      parent.children.splice(index, 1, ...newNodes);

      // 告诉 visit 跳过新添加的节点（避免重复处理）
      return [SKIP, index + newNodes.length];
    });
  };
};

// 必须默认导出
export default remarkHighlight;
