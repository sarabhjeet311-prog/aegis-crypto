import type { NextApiRequest, NextApiResponse } from 'next';
import { scanToken, TokenScanResult } from '../../../lib/scan';

type Data = {
  success: boolean;
  data?: TokenScanResult;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing token input.' });
  }

  try {
    const result = await scanToken(input);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Token scan failed or token not found.' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Token scan failed' });
  }
}
