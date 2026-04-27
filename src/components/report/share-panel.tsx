'use client';

import { useMemo, useState } from 'react';
import { Copy, Link2, ShieldAlert } from 'lucide-react';

type SharePanelProps = {
  reportUrl: string;
  safetyMessage: string;
};

type CopyState = 'idle' | 'link-copied' | 'message-copied' | 'failed';

const truncateMessage = (value: string, maxLength = 280) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

export function SharePanel({ reportUrl, safetyMessage }: SharePanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const recipientUrl = useMemo(() => {
    const separator = reportUrl.includes('?') ? '&' : '?';
    return `${reportUrl}${separator}view=recipient`;
  }, [reportUrl]);

  const shareMessage = useMemo(() => truncateMessage(safetyMessage), [safetyMessage]);

  const copyValue = async (value: string, state: Exclude<CopyState, 'idle' | 'failed'>) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(state);
    } catch {
      setCopyState('failed');
    } finally {
      window.setTimeout(() => setCopyState('idle'), 1600);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-cyan-100" />
        <div className="space-y-1">
          <p className="text-sm text-cyan-100/90">
            Recipients see a simplified safety-first report with no technical details.
          </p>
          {copyState === 'failed' ? <p className="text-xs text-amber-100">Copy failed. Select and copy the report link manually.</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyValue(recipientUrl, 'link-copied')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/85 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
        >
          <Link2 className="h-4 w-4" />
          {copyState === 'link-copied' ? 'Recipient link copied' : 'Copy recipient link'}
        </button>

        <button
          type="button"
          onClick={() => copyValue(shareMessage, 'message-copied')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/85 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
        >
          <Copy className="h-4 w-4" />
          {copyState === 'message-copied' ? 'Safety message copied' : 'Copy safety message'}
        </button>
      </div>
    </div>
  );
}
