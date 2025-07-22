import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";

/**
 * ChatMessage component renders markdown content with code highlighting and optional references.
 * @param {Object} props
 * @param {string} props.content - The markdown content to render.
 * @param {string} [props.references] - Optional references to display below the answer.
 */
export default function ChatMessage({ content, references }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 text-sm leading-relaxed">
      <div className="prose prose-base prose-slate max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-1">{children}</h3>,
            p: ({ children }) => <p className="my-3">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-6 space-y-1 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1 my-2">{children}</ol>,
            code: ({ children }) => (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-purple-700">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto my-4 text-sm">{children}</pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 my-4">{children}</blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {references && (
        <div className="mt-4 border-t pt-3 text-xs text-gray-500">
          <strong>References:</strong> {references}
        </div>
      )}
    </div>
  );
}
