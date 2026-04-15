import type { NextApiRequest, NextApiResponse } from 'next';
import { scanWallet, WalletScanResult } from '../../../lib/scan';

type Data = {
  success: boolean;
  data?: WalletScanResult;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { address } = req.body;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing wallet address.' });
  }

  try {
    const result = await scanWallet(address);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Wallet scan failed or invalid address.' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Wallet scan failed' });
  }
}
