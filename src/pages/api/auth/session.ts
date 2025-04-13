import { NextApiRequest, NextApiResponse } from 'next';
import { validateSession } from '../../../lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_token } = req.body;

  if (!session_token) {
    return res.status(400).json({ error: 'Session token is required' });
  }

  const result = await validateSession(session_token);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  // If validation is successful, set the session cookie
  res.setHeader('Set-Cookie', `session=${session_token}; Path=/; HttpOnly; SameSite=Strict`);
  
  return res.status(200).json({
    success: true,
    user: result.user
  });
} 