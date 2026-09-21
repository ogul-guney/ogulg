import React from 'react';

interface FormattedTextProps {
  content: string;
  highlightKeyword?: string;
  className?: string;
}

/**
 * Highlights any occurrences of keyword in a plain string
 */
function renderWithHighlight(text: string, highlightKeyword?: string): React.ReactNode {
  if (!highlightKeyword || !highlightKeyword.trim()) {
    return text;
  }

  const escaped = highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-amber-100 dark:bg-amber-900/50 text-neutral-900 dark:text-amber-200 font-medium px-0.5 rounded-sm"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Parses inner text for italic tokens (_text_)
 */
function parseItalics(text: string, highlightKeyword?: string, keyPrefix = ''): React.ReactNode[] {
  const italicRegex = /((?<![a-zA-Z0-9])_[^_\n]+?_(?![a-zA-Z0-9]))/g;
  const parts = text.split(italicRegex);

  return parts.map((part, i) => {
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={`${keyPrefix}-it-${i}`} className="italic">
          {renderWithHighlight(inner, highlightKeyword)}
        </em>
      );
    }
    return (
      <React.Fragment key={`${keyPrefix}-txt-${i}`}>
        {renderWithHighlight(part, highlightKeyword)}
      </React.Fragment>
    );
  });
}

/**
 * FormattedText component supporting:
 * - **bold** -> <strong>
 * - _italic_ -> <em>
 * - Nested **_bold italic_**
 * - Search keyword highlighting
 */
export function FormattedText({ content, highlightKeyword, className }: FormattedTextProps) {
  // Tokenize by **bold** or _italic_
  const tokenRegex = /(\*\*[^*\n]+?\*\*|(?<![a-zA-Z0-9])_[^_\n]+?_(?![a-zA-Z0-9]))/g;
  const tokens = content.split(tokenRegex);

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        // Bold: **text**
        if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
          const inner = token.slice(2, -2);
          return (
            <strong key={`b-${i}`} className="font-semibold text-neutral-950 dark:text-white">
              {parseItalics(inner, highlightKeyword, `b-in-${i}`)}
            </strong>
          );
        }

        // Italic: _text_
        if (token.startsWith('_') && token.endsWith('_') && token.length >= 2) {
          const inner = token.slice(1, -1);
          const boldInsideRegex = /(\*\*[^*\n]+?\*\*)/g;
          const innerParts = inner.split(boldInsideRegex);

          return (
            <em key={`i-${i}`} className="italic">
              {innerParts.map((sub, j) => {
                if (sub.startsWith('**') && sub.endsWith('**') && sub.length >= 4) {
                  return (
                    <strong key={`sub-b-${j}`} className="font-semibold text-neutral-950 dark:text-white">
                      {renderWithHighlight(sub.slice(2, -2), highlightKeyword)}
                    </strong>
                  );
                }
                return (
                  <React.Fragment key={`sub-txt-${j}`}>
                    {renderWithHighlight(sub, highlightKeyword)}
                  </React.Fragment>
                );
              })}
            </em>
          );
        }

        // Normal text segment
        return (
          <React.Fragment key={`t-${i}`}>
            {renderWithHighlight(token, highlightKeyword)}
          </React.Fragment>
        );
      })}
    </span>
  );
}
