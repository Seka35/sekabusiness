import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash' }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('blog.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('blog.copyError'));
    }
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden">
      <div className="bg-gray-900 p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap">
        {code}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        title={t('blog.copyCode')}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default CodeBlock; 