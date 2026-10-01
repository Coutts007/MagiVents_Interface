import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google Sign-In.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface GoogleSignInButtonProps {
  /** Receives the Google ID token, to be verified by the backend */
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/** Renders the official Google Identity Services button. */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, onError, text = 'continue_with' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Keep the latest callbacks without re-rendering the Google button
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential)
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: containerRef.current.offsetWidth || 320
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadFailed(true);
        onErrorRef.current?.(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID || loadFailed) {
    return (
      <p className="text-[11px] text-center text-[#736B66] py-2">
        {GOOGLE_CLIENT_ID
          ? 'Google Sign-In is unavailable right now. Please use your email and password.'
          : 'Google Sign-In is not configured (set VITE_GOOGLE_CLIENT_ID).'}
      </p>
    );
  }

  return <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />;
};
