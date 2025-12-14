import type { NextApiRequest, NextApiResponse } from 'next'
import { featureFlags } from '@/config/featureFlags'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ flags: featureFlags })
}
