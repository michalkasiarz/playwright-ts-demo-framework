import { Router } from 'express';
import { User } from '../../models/User';
import { signToken } from '../../auth/jwt';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = await User.findOne({ username });

  // Simple password check for demo purposes
  if (!user || !user.passwordHash || user.passwordHash !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({
    sub: user.id,
    username: user.username!,
    role: user.role as 'customer' | 'admin',
  });

  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
  });

  res.json({ username: user.username, role: user.role });
});

export default router;