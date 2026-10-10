// lib/adp-client.ts — mTLS HTTPS agent for ADP Workforce Now API
// ADP requires mutual TLS (client certificate) in addition to OAuth 2.0.
// The cert and key are supplied as base64-encoded PEM via env vars.
//
// Node 18 native fetch does not support agent/mTLS.
// We implement adpFetch() using node:https.request directly.

import https from 'node:https';
import http from 'node:http';

interface AdpFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface AdpFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

function getCerts(): { cert: Buffer; key: Buffer } {
  const certB64 = process.env.ADP_CERT_PEM_B64;
  const keyB64 = process.env.ADP_CERT_KEY_B64;

  if (!certB64 || !keyB64) {
    throw new Error('ADP_CERT_PEM_B64 and ADP_CERT_KEY_B64 must be set for ADP integration');
  }

  return {
    cert: Buffer.from(certB64, 'base64'),
    key: Buffer.from(keyB64, 'base64'),
  };
}

/**
 * fetch()-compatible wrapper for ADP API calls that requires mTLS.
 * Uses node:https.request with the client certificate from env vars.
 */
export async function adpFetch(url: string, init?: AdpFetchOptions): Promise<AdpFetchResponse> {
  const { cert, key } = getCerts();
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const reqOptions: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: init?.method ?? 'GET',
      headers: init?.headers ?? {},
      cert,
      key,
    };

    const req = https.request(reqOptions, (res: http.IncomingMessage) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const bodyText = Buffer.concat(chunks).toString('utf8');
        const status = res.statusCode ?? 0;
        resolve({
          ok: status >= 200 && status < 300,
          status,
          async json() { return JSON.parse(bodyText); },
          async text() { return bodyText; },
        });
      });
    });

    req.on('error', reject);

    if (init?.body) {
      req.write(init.body);
    }

    req.end();
  });
}
