"use client";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import Script from "next/script";

/**
 * Client-side human-check widget.
 *
 * Renders three things behind the scenes:
 *   1. A hidden field carrying the server-issued honeypot token.
 *   2. A hidden field with a randomised name - the actual honeypot;
 *      humans never see it, automated form-fillers populate every field.
 *   3. Cloudflare Turnstile widget, IF NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 *      When unset (open-source / dev), this is omitted - the honeypot +
 *      server-side rate-limit still gate the request.
 *
 * Parent forms read the bundle via the `useHumanCheck` ref API.
 */

export type HumanCheckBundle = {
  challengeToken: string;
  honeypotFieldName: string;
  honeypotValue: string;
  turnstileToken: string | null;
};

export type HumanCheckHandle = {
  /** Returns the current bundle. Resolves when ready (challenge issued + Turnstile token if configured). */
  getBundle: () => Promise<HumanCheckBundle | null>;
  /** True once a challenge has been issued. */
  isReady: () => boolean;
};

type Props = {
  /** Hide the Turnstile widget visually even when configured.
   *  Use this on forms where a CAPTCHA prompt would surprise users
   *  (we still render the widget - invisible mode handles the challenge). */
  invisible?: boolean;
  className?: string;
};

export const HumanCheck = forwardRef<HumanCheckHandle, Props>(function HumanCheck(
  { invisible, className }, ref,
) {
  const [challenge, setChallenge] = useState<{ token: string; honeypotFieldName: string; siteKey: string | null } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch("/api/security/challenge", { cache: "no-store" });
        if (!res.ok) throw new Error(`challenge fetch failed: ${res.status}`);
        const json = (await res.json()) as { token: string; honeypotFieldName: string; turnstileSiteKey: string | null };
        if (mounted) setChallenge({ token: json.token, honeypotFieldName: json.honeypotFieldName, siteKey: json.turnstileSiteKey });
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "unknown");
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Wire Cloudflare callback (renders when their script is loaded and we have a site key).
  useEffect(() => {
    if (!challenge?.siteKey) return;
    const g = window as unknown as {
      turnstile?: { render: (sel: string | HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
      onTurnstileVerify?: (t: string) => void;
    };
    g.onTurnstileVerify = (t: string) => setTurnstileToken(t);
    const id = setInterval(() => {
      if (!g.turnstile) return;
      clearInterval(id);
      const target = document.getElementById("lexoni-turnstile");
      if (target && !target.dataset.rendered) {
        target.dataset.rendered = "1";
        g.turnstile.render(target, {
          sitekey: challenge.siteKey!,
          callback: "onTurnstileVerify",
          theme: "light",
          size: invisible ? "invisible" : "normal",
        });
      }
    }, 200);
    return () => clearInterval(id);
  }, [challenge?.siteKey, invisible]);

  useImperativeHandle(ref, () => ({
    isReady: () => !!challenge,
    getBundle: async () => {
      if (!challenge) return null;
      // If Turnstile is configured, wait a beat for the token (invisible mode resolves quickly).
      if (challenge.siteKey && !turnstileToken) {
        for (let i = 0; i < 30 && !turnstileToken; i++) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      return {
        challengeToken: challenge.token,
        honeypotFieldName: challenge.honeypotFieldName,
        honeypotValue: "",
        turnstileToken: challenge.siteKey ? turnstileToken : null,
      };
    },
  }), [challenge, turnstileToken]);

  if (error) {
    return (
      <div className={className}>
        <p className="text-caption text-danger-700">Security check failed to load. Refresh to try again.</p>
      </div>
    );
  }
  if (!challenge) {
    return <div aria-hidden className={className} />;
  }

  return (
    <div className={className}>
      {/* Honeypot field - randomised name, hidden, accessible-hidden. Bots
          autofill every input by name; humans never see it. */}
      <label
        aria-hidden
        tabIndex={-1}
        style={{ position: "absolute", left: "-9999px", height: 0, width: 0, overflow: "hidden" }}
      >
        <span>Leave this field empty.</span>
        <input
          type="text"
          name={challenge.honeypotFieldName}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </label>
      {challenge.siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div id="lexoni-turnstile" style={{ minHeight: invisible ? 0 : 70 }} />
        </>
      )}
      {!challenge.siteKey && (
        <p className="text-caption text-muted">Protected by anti-bot checks.</p>
      )}
    </div>
  );
});
