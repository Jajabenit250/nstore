import { notarize, signPhantom, stringifyNotarized } from '../notary/client';
import { Formatter, Notarized } from '../notary/common';
import { connectSolana } from '../solana';
import { Solana } from '../solana/types';
import { Storefront } from './types';

export type PutStorefrontParams = Notarized<Storefront>;

export interface PutStorefrontResult {
  storefront: Storefront;
}

export const formatMessage: Formatter = (bytes) =>
  `Your storefront upload fingerprint is ${bytes.toString('base64')}`;

export const putStorefront = async ({
  solana,
  storefront,
  onProgress,
  onComplete,
  onError,
}: {
  solana: Solana | undefined;
  storefront: Storefront;
  onProgress?: (
    status: 'connecting-wallet' | 'signing' | 'uploading' | 'uploaded' | 'failed'
  ) => void;
  onComplete?: (result: PutStorefrontResult) => void;
  onError?: (msg: string) => void;
}): Promise<PutStorefrontResult> => {
  try {
    if (!onProgress) onProgress = () => {};

    if (!solana) throw new Error('Could not connect to Solana');

    if (!solana.isConnected) {
      onProgress('connecting-wallet');
      connectSolana(solana);
    }

    onProgress('signing');

    const notarized: PutStorefrontParams = await notarize(storefront, signPhantom(solana), {
      format: formatMessage,
    });

    onProgress('uploading');

    const putResp = await fetch('/api/storefronts', {
      method: 'PUT',
      body: stringifyNotarized(notarized),
    });

    if (!putResp.ok) {
      let json;

      try {
        json = await putResp.json();
      } catch {
        json = { message: 'An error occurred' };
      }

      throw new Error(`Store upload failed: ${json.message ?? JSON.stringify(json)}`);
    }

    onProgress('uploaded');

    const result: PutStorefrontResult = await putResp.json();
    if (onComplete) onComplete(result);
    return result;
  } catch (e) {
    if (onProgress) onProgress('failed');
    if (onError && e instanceof Error) onError(e.message);

    throw e;
  }
};
