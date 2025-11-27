import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
});

export const renderMarkdown = (text?: string) => {
  if (!text) return "";
  const html = marked.parse(text);
    return DOMPurify.sanitize(html);
};
