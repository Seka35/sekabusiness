import React from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAddCode?: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, onAddCode }) => {
  const { t } = useTranslation();

  const insertFormat = (format: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = value;
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        newCursorPos = end + 4;
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        newCursorPos = end + 2;
        break;
      case 'h1':
        newText = value.substring(0, start) + `# ${selectedText}` + value.substring(end);
        newCursorPos = end + 2;
        break;
      case 'h2':
        newText = value.substring(0, start) + `## ${selectedText}` + value.substring(end);
        newCursorPos = end + 3;
        break;
      case 'h3':
        newText = value.substring(0, start) + `### ${selectedText}` + value.substring(end);
        newCursorPos = end + 4;
        break;
    }

    onChange(newText);
    
    // Restore cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => insertFormat('bold')}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('editor.bold')}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormat('italic')}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('editor.italic')}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button
          type="button"
          onClick={() => insertFormat('h1')}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('editor.heading1')}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormat('h2')}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('editor.heading2')}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormat('h3')}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('editor.heading3')}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button
          type="button"
          onClick={onAddCode}
          className="flex items-center px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          <Code className="w-4 h-4 mr-2" />
          {t('blog.addCode')}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none min-h-[200px]"
        rows={10}
      />
      <div className="text-sm text-gray-400">
        {t('editor.markdownSupported')}
      </div>
    </div>
  );
};

export default TextEditor; 