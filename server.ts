import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config for API key verification
const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  } catch (e) {
    console.error('Error reading firebase-applet-config.json:', e);
  }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory rate limiting for admin password attempts
interface RateLimitRecord {
  attempts: number;
  lockoutUntil: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown-client';
}

function checkRateLimit(clientId: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = rateLimits.get(clientId);

  if (record && record.lockoutUntil > now) {
    const waitMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

function recordFailedAttempt(clientId: string) {
  const now = Date.now();
  const record = rateLimits.get(clientId) || { attempts: 0, lockoutUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    // Lockout for 15 minutes after 5 consecutive failures
    record.lockoutUntil = now + 15 * 60 * 1000;
  }
  rateLimits.set(clientId, record);
}

function resetRateLimit(clientId: string) {
  rateLimits.delete(clientId);
}

// Secret key for signing admin session tokens
const SERVER_SIGNING_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const AUTHORIZED_ADMIN_EMAIL = 'omermikayilov69@gmail.com';

function signAdminToken(payload: { email: string; uid: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SERVER_SIGNING_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return { valid: false };

    const expected = crypto.createHmac('sha256', SERVER_SIGNING_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return { valid: false };
    if (payload.email !== AUTHORIZED_ADMIN_EMAIL) return { valid: false };

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Endpoint to check server status and whether ADMIN_PASSWORD is set in server secrets
 */
app.get('/api/admin/check-status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const tokenValidation = token ? verifyAdminToken(token) : { valid: false };

  const isConfigured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim() !== '');

  res.json({
    configured: isConfigured,
    authorizedAdminEmail: AUTHORIZED_ADMIN_EMAIL,
    isSessionValid: tokenValidation.valid,
  });
});

/**
 * Secure administrator login verification endpoint
 */
app.post('/api/admin/verify', async (req: Request, res: Response): Promise<void> => {
  const clientId = getClientIdentifier(req);
  const rateLimitCheck = checkRateLimit(clientId);

  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      error: `Çok fazla başarısız parola denemesi. Lütfen ${rateLimitCheck.waitMinutes} dakika sonra tekrar deneyin.`,
    });
    return;
  }

  const { idToken, password } = req.body;

  if (!idToken) {
    res.status(400).json({ error: 'Firebase kimlik doğrulama belirteci (idToken) gereklidir.' });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Yönetici parolası gereklidir.' });
    return;
  }

  // 1. Verify Google identity with Firebase Identity Platform
  let userEmail = '';
  let emailVerified = false;
  let userUid = '';

  try {
    const apiKey = firebaseConfig.apiKey || process.env.FIREBASE_API_KEY;
    const lookupResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    const lookupData = await lookupResponse.json();

    if (!lookupResponse.ok || !lookupData.users || lookupData.users.length === 0) {
      res.status(401).json({ error: 'Geçersiz veya süresi dolmuş Google oturumu. Lütfen tekrar giriş yapın.' });
      return;
    }

    const user = lookupData.users[0];
    userEmail = (user.email || '').toLowerCase();
    emailVerified = Boolean(user.emailVerified);
    userUid = user.localId;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(500).json({ error: 'Kimlik doğrulama sunucusuyla iletişim kurulamadı.' });
    return;
  }

  // 2. Enforce: The ONLY authorized admin is omermikayilov69@gmail.com
  if (userEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    recordFailedAttempt(clientId);
    res.status(403).json({
      error: `Yetkisiz Google hesabı: "${userEmail}". Yalnızca "${AUTHORIZED_ADMIN_EMAIL}" yönetici paneline erişebilir.`,
    });
    return;
  }

  if (!emailVerified) {
    res.status(403).json({
      error: 'Google e-posta adresi doğrulanmamış. Lütfen doğrulanmış bir hesapla giriş yapın.',
    });
    return;
  }

  // 3. Enforce: Check if ADMIN_PASSWORD is set in server-side Secrets
  const serverAdminPassword = process.env.ADMIN_PASSWORD;
  if (!serverAdminPassword || serverAdminPassword.trim() === '') {
    res.status(503).json({
      error: 'Sunucu tarafında ADMIN_PASSWORD sırrı henüz tanımlanmamış. Lütfen AI Studio Secrets panelinden ADMIN_PASSWORD sırrını yapılandırın.',
      notConfigured: true,
    });
    return;
  }

  // 4. Constant-time secure password comparison
  const submittedPasswordBuffer = Buffer.from(password.normalize());
  const expectedPasswordBuffer = Buffer.from(serverAdminPassword.trim().normalize());

  const isPasswordValid =
    submittedPasswordBuffer.length === expectedPasswordBuffer.length &&
    crypto.timingSafeEqual(submittedPasswordBuffer, expectedPasswordBuffer);

  if (!isPasswordValid) {
    recordFailedAttempt(clientId);
    res.status(401).json({
      error: 'Yönetici parolası hatalı. Lütfen parolanızı kontrol edip tekrar deneyin.',
    });
    return;
  }

  // Success: Clear rate limit & issue signed administrator session token
  resetRateLimit(clientId);

  const sessionToken = signAdminToken({
    email: userEmail,
    uid: userUid,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  });

  res.json({
    success: true,
    token: sessionToken,
    message: 'Yönetici doğrulaması başarılı! Yönetici paneline hoş geldiniz.',
    admin: {
      email: userEmail,
      uid: userUid,
      role: 'admin',
    },
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`CBBOSS SHOP Server active on port ${port}`);
  });
}

startServer();
