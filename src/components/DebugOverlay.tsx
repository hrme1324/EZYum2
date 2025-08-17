import { useEffect, useState } from 'react';

export default function DebugOverlay() {
  const [msgs, setMsgs] = useState<string[]>([]);

  useEffect(() => {
    const add = (m: string) => setMsgs((xs) => [...xs.slice(-9), m]);

    const onErr = (e: ErrorEvent) => add(`[error] ${e.message}`);
    const onRej = (e: PromiseRejectionEvent) => add(`[unhandled] ${String(e.reason)}`);

    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);

    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  // Only show if debug mode is enabled
  if (!new URLSearchParams(location.search).has('debug')) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 10,
      maxHeight: '40vh',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: 12,
      background: 'rgba(0,0,0,.8)',
      color: '#fff',
      padding: 10,
      zIndex: 99999,
      borderRadius: 8,
      border: '1px solid #666'
    }}>
      <div style={{ marginBottom: 6, opacity: .8, fontWeight: 'bold' }}>
        🐛 Debug Overlay - {msgs.length} messages
      </div>
      {msgs.length === 0 ? (
        <div style={{ opacity: .6 }}>No errors yet…</div>
      ) : (
        msgs.map((m, i) => (
          <div key={i} style={{
            marginBottom: 2,
            padding: '2px 4px',
            background: m.includes('[error]') ? 'rgba(255,0,0,.2)' : 'rgba(255,255,0,.2)',
            borderRadius: 3
          }}>
            {m}
          </div>
        ))
      )}
    </div>
  );
}
