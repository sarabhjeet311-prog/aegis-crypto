import type { NextApiRequest, NextApiResponse } from 'next';
import { scanAuto, AutoScanResult } from '../../../lib/scan';

type Data = {
  success: boolean;
  type?: 'token' | 'wallet';
  data?: AutoScanResult['data'];
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing input value.' });
  }

  try {
    const result = await scanAuto(input);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Unable to detect input type or scan failed.' });
    }

    return res.status(200).json({ success: true, type: result.type, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Auto scan failed.' });
  }
}
