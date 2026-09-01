import React from 'react';
import { Target, AlertCircle, Zap, Terminal, Sparkles, BookOpen } from 'lucide-react';

/**
 * LeetCode & InterviewBit Grade Problem Statement Renderer.
 * Parses rich Markdown tables, ASCII schemas, Example 1/2 blocks, notes, and requirements.
 */
export default function ProblemStatementView({ challenge, isDarkMode = false }) {
  if (!challenge) return null;

  const renderFormattedContent = (text) => {
    if (!text) return null;

    // Split by double line breaks into logical sections
    const blocks = text.trim().split(/\n\s*\n/);

    return blocks.map((block, pIdx) => {
      const trimmed = block.trim();

      // 1. Check for Code Block or ASCII Table (``` or starting with +---)
      if (trimmed.startsWith('```') || (trimmed.startsWith('+') && trimmed.includes('-+'))) {
        const cleanCode = trimmed.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '');
        return (
          <div key={pIdx} className="my-3 overflow-hidden rounded-xl border border-slate-800 shadow-sm">
            <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-emerald-400" />
                <span>Schema / Example Table</span>
              </span>
            </div>
            <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
              {cleanCode}
            </pre>
          </div>
        );
      }

      // 2. Check for Markdown Table (| ... |)
      if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
        const lines = trimmed.split('\n').filter(l => l.trim().startsWith('|'));
        if (lines.length >= 2) {
          const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
          // Skip separator line (|---|---|)
          const dataRows = lines.slice(2).map(line =>
            line.split('|').map(c => c.trim()).filter(Boolean)
          );

          return (
            <div key={pIdx} className={`my-3 overflow-x-auto border rounded-xl shadow-2xs ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <table className="w-full text-left text-xs font-mono">
                <thead className={`uppercase text-[10px] font-black border-b ${
                  isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 bg-slate-950' : 'divide-slate-100 bg-white'}`}>
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className={isDarkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 font-medium">
                          {parseInlineTokens(cell, isDarkMode)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }

      // 3. Check for Example Cards (**Example 1:**, **Example 2:**)
      if (trimmed.startsWith('**Example') || trimmed.startsWith('Example')) {
        return (
          <div key={pIdx} className={`my-3.5 p-4 rounded-2xl border space-y-2.5 ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
              : 'bg-slate-50/90 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}>
            <div className="flex items-center space-x-2 text-xs font-black text-blue-600 uppercase tracking-wider">
              <Sparkles size={13} />
              <span>{trimmed.split('\n')[0].replace(/\*\*/g, '')}</span>
            </div>
            <div className="space-y-2 text-xs leading-relaxed">
              {trimmed.split('\n').slice(1).map((line, lIdx) => (
                <p key={lIdx}>{parseInlineTokens(line, isDarkMode)}</p>
              ))}
            </div>
          </div>
        );
      }

      // 4. Check for Bullet Lists (- item or * item)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
        return (
          <ul key={pIdx} className="space-y-1.5 my-2.5 pl-1">
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^[-*]\s+/, '');
              return (
                <li key={itemIdx} className="flex items-start space-x-2 text-xs leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                    {parseInlineTokens(cleanItem, isDarkMode)}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      }

      // 5. Check for Note / Tip callouts
      if (trimmed.startsWith('*Note:') || trimmed.startsWith('Note:')) {
        return (
          <div key={pIdx} className={`my-3 p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
            isDarkMode 
              ? 'bg-blue-950/30 border-blue-800/60 text-blue-300' 
              : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}>
            <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">
              {parseInlineTokens(trimmed.replace(/^\*?Note:\*?\s*/i, ''), isDarkMode)}
            </div>
          </div>
        );
      }

      // 6. Default Paragraph
      return (
        <p key={pIdx} className={`text-xs leading-relaxed ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {parseInlineTokens(trimmed, isDarkMode)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
            {challenge.moduleTitle}
          </span>
          {challenge.interviewFrequency && (
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
              <Zap size={12} />
              <span>{challenge.interviewFrequency}</span>
            </span>
          )}
        </div>
        <h2 className={`text-xl font-black mt-2 tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {challenge.title}
        </h2>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {challenge.tags?.map((tag, idx) => (
          <span key={idx} className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Problem Statement Card (LeetCode Styled) */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-2xs ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 border-b pb-3 border-slate-100">
          <Target size={14} className="text-blue-600" />
          <h3 className={`text-xs font-black uppercase tracking-wider ${
            isDarkMode ? 'text-slate-300' : 'text-slate-800'
          }`}>
            Problem Statement & Specifications
          </h3>
        </div>

        <div className="space-y-3">
          {renderFormattedContent(challenge.description)}
        </div>
      </div>
    </div>
  );
}

/**
 * Parses bold (**text**), inline code (`code`), and italics (*text*) into JSX elements.
 */
function parseInlineTokens(text, isDarkMode) {
  if (!text) return '';

  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className={`font-black ${
          isDarkMode ? 'text-blue-400' : 'text-slate-900'
        }`}>
          {boldText}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1);
      return (
        <code key={idx} className={`px-1.5 py-0.5 rounded font-mono text-[11px] border font-bold ${
          isDarkMode 
            ? 'bg-slate-800 text-amber-300 border-slate-700' 
            : 'bg-slate-100 text-blue-700 border-slate-200'
        }`}>
          {codeText}
        </code>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      const italicText = part.slice(1, -1);
      return <em key={idx} className="italic text-slate-500">{italicText}</em>;
    }

    return part;
  });
}
