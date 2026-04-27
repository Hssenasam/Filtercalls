'use client';

import { useMemo, useState } from 'react';
import { Copy, Link2, ShieldAlert } from 'lucide-react';

type SharePanelProps = {
  reportUrl: string;
  safetyMessage: string;
};

export function SharePanel({ reportUrl, safetyMessage }: SharePanelProps) {
  const [copiedType, setCopiedType] = useState<'none' | 'link' | 'message'>('none');

  const recipientUrl = useMemo(() => {
    const separator = reportUrl.includes('?') ? '&' : '?';
    return `${reportUrl}${separator}view=recipient`;
  }, [reportUrl]);

  const copyValue = async (value: string, type: 'link' | 'message') => {
    await navigator.clipboard.writeText(value);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType('none'), 1400);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-cyan-100" />
        <p className="text-sm text-cyan-100/90">
          Recipients see a simplified safety-first report with no technical details.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyValue(recipientUrl, 'link')}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:bg-white/[0.08]"
        >
          <Link2 className="h-4 w-4" />
          {copiedType === 'link' ? 'Recipient link copied' : 'Copy recipient link'}
        </button>

        <button
          type="button"
          onClick={() => copyValue(safetyMessage, 'message')}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:bg-white/[0.08]"
        >
          <Copy className="h-4 w-4" />
          {copiedType === 'message' ? 'Safety message copied' : 'Copy safety message'}
        </button>
      </div>
    </div>
  );
}
