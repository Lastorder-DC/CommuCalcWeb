import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

let scriptLoaded = false;
let scriptLoading = false;
type Callback = { resolve: () => void; reject: (err: Error) => void };
const loadCallbacks: Callback[] = [];

function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (scriptLoading) {
      loadCallbacks.push({ resolve, reject });
      return;
    }

    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb.resolve());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      // 실패 시 로딩 상태 초기화하여 이후 재시도가 가능하도록 한다.
      scriptLoading = false;
      script.remove();
      const err = new Error('Turnstile 스크립트 로드 실패');
      reject(err);
      loadCallbacks.forEach(cb => cb.reject(err));
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export default function Turnstile({ siteKey, onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  const renderWidget = useCallback(async () => {
    try {
      await loadTurnstileScript();
    } catch (err) {
      console.error('Turnstile 로드 실패:', err);
      return;
    }

    if (!containerRef.current || !window.turnstile) return;

    // 기존 위젯이 있으면 제거
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (err) {
        console.warn('Failed to remove Turnstile widget:', err);
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerifyRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
      theme: 'auto',
    });
  }, [siteKey]);

  useEffect(() => {
    renderWidget();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.warn('Failed to remove Turnstile widget:', err);
        }
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return <div ref={containerRef} />;
}
