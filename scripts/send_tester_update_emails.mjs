import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// ── 1. CONFIG & CREDENTIALS ──────────────────────────────────────────────────
const ENV_FILE = path.join(ROOT_DIR, '.env.mail.local');
const STATE_FILE = path.join(ROOT_DIR, '.mail-data.local', 'state.json');

let SENDER_EMAIL = 'jksurampudi5@gmail.com';
let APP_PASSWORD = '';

if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MAIL_SENDER=')) {
      SENDER_EMAIL = trimmed.replace('MAIL_SENDER=', '').trim();
    }
    if (trimmed.startsWith('MAIL_APP_PASSWORD=')) {
      APP_PASSWORD = trimmed.replace('MAIL_APP_PASSWORD=', '').trim();
    }
  }
}

if (!APP_PASSWORD) {
  APP_PASSWORD = process.env.MAIL_APP_PASSWORD || process.env.EMAIL_PASS || '';
}
APP_PASSWORD = APP_PASSWORD.replace(/\s+/g, '');

const STORE_LINK = 'https://play.google.com/store/apps/details?id=om.findlostpuppy.app';
const TESTING_LINK = 'https://play.google.com/apps/testing/om.findlostpuppy.app';

// ── 2. GET VERSION ───────────────────────────────────────────────────────────
function getVersion() {
  try {
    const gradle = fs.readFileSync(path.join(ROOT_DIR, 'android/app/build.gradle'), 'utf-8');
    const m = gradle.match(/versionName\s+"([^"]+)"/);
    if (m && m[1]) return m[1];
  } catch (_) {}
  return '1.0.9';
}

const VERSION = getVersion();

// ── 3. LOAD RECIPIENTS FROM STATE.JSON ─────────────────────────────────────────
if (!fs.existsSync(STATE_FILE)) {
  console.error(`❌ State file not found at ${STATE_FILE}`);
  process.exit(1);
}

const stateData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
const eligibleMembers = (stateData.members || []).filter(
  (m) => m.eligible && m.preference === 'email'
);

const isDryRun = process.argv.includes('--dry-run');
const isTestOnly = process.argv.includes('--test-me');

const recipients = isTestOnly
  ? [SENDER_EMAIL]
  : eligibleMembers.map((m) => m.email);

// ── 4. EMAIL TEMPLATE ────────────────────────────────────────────────────────
function buildUpdateEmail(recipientEmail) {
  const subject = `🐾 FindLostPuppy update is ready — update your app`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#111111;border:1px solid #FF7900;border-radius:16px;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 24px 20px;text-align:center;border-bottom:1px solid #332315;">
              <p style="margin:0 0 8px;font-size:28px;">🐾</p>
              <p style="margin:0;color:#FF7900;font-size:22px;font-weight:bold;">FindLostPuppy</p>
              <p style="margin:8px 0 0;color:#CBD5E1;font-size:13px;letter-spacing:0.5px;">EARLY ACCESS UPDATE</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;">
              <h1 style="margin:0 0 14px;color:#FFFFFF;font-size:26px;line-height:1.25;">Your new update is ready.</h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#CBD5E1;">
                Hi everyone! The latest FindLostPuppy update is available. Thank you for helping us test the app.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td bgcolor="#FF7900" style="border-radius:9px;text-align:center;">
                    <a href="${STORE_LINK}" style="display:inline-block;padding:16px 28px;color:#111111;font-size:17px;font-weight:bold;text-decoration:none;border:1px solid #FF7900;border-radius:9px;">
                      Update App →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 22px;font-size:16px;line-height:1.7;color:#FFFFFF;">
                1. Tap the button on your Android phone.<br>
                2. Tap <strong>Update</strong> in Google Play.<br>
                3. Tap <strong>Open</strong> and try the app.
              </p>
              <p style="margin:0 0 16px;color:#CBD5E1;font-size:13px;line-height:1.6;">
                Use the same Google account you joined the testers group with. If you see <strong>Open</strong>, you may already have the latest version available to your account.
              </p>
              <p style="margin:0 0 24px;color:#CBD5E1;font-size:13px;line-height:1.6;">
                Not installed yet? <a href="${TESTING_LINK}" style="color:#FF9B42;text-decoration:underline;">Join the test and install</a>.
              </p>
              <p style="margin:0;color:#E2E8F0;font-size:15px;line-height:1.7;">
                Need help or spotted a problem?<br>
                <strong>Just reply to this email.</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #332315;">
              <p style="margin:0;color:#CBD5E1;font-size:14px;line-height:1.7;">
                Thank you,<br>
                <strong style="color:#FF9B42;">Jayakrishna · FindLostPuppy 🐾</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi everyone! The latest FindLostPuppy update is available. Thank you for helping us test the app.

1. Open this link on your Android phone: ${STORE_LINK}
2. Tap Update in Google Play.
3. Tap Open and try the app.

Use the same Google account you joined the testers group with. If you see Open, you may already have the latest version available to your account.

Not installed yet? Join the test and install: ${TESTING_LINK}

Need help or spotted a problem? Just reply to this email.

Thank you,
Jayakrishna · FindLostPuppy 🐾`;

  return {
    from: `"Jayakrishna Surampudi" <${SENDER_EMAIL}>`,
    to: recipientEmail,
    subject,
    html,
    text,
  };
}

// ── 5. RUN BROADCAST ─────────────────────────────────────────────────────────
async function run() {
  console.log(`\n🐾 FindLostPuppy Tester Update Dispatcher (v${VERSION}) 🐾`);
  console.log(`From:    ${SENDER_EMAIL}`);
  console.log(`Total:   ${recipients.length} individual recipients`);
  if (isDryRun) console.log(`Mode:    [DRY RUN - No emails will actually be sent]`);
  if (isTestOnly) console.log(`Mode:    [TEST ME ONLY -> ${SENDER_EMAIL}]`);
  console.log('──────────────────────────────────────────────────────');

  if (isDryRun) {
    recipients.forEach((email, i) => {
      console.log(`  [${i + 1}/${recipients.length}] Would send to: ${email}`);
    });
    console.log(`\n✅ Dry run complete. All ${recipients.length} addresses verified.`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass: APP_PASSWORD },
  });

  console.log('Verifying Gmail SMTP connection...');
  await transporter.verify();
  console.log('✅ Gmail SMTP connected!\n');

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i];
    try {
      const mailOptions = buildUpdateEmail(email);
      const res = await transporter.sendMail(mailOptions);
      sent++;
      console.log(`  [${i + 1}/${recipients.length}] ✅ Sent to ${email} (ID: ${res.messageId})`);
      // Throttling 900ms to stay well below Gmail sending rate limit
      await new Promise((resolve) => setTimeout(resolve, 950));
    } catch (err) {
      failed++;
      console.error(`  [${i + 1}/${recipients.length}] ❌ Failed to ${email}: ${err.message}`);
    }
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`🎉 Dispatch Summary: ${sent} sent successfully, ${failed} failed.`);

  // Record job in state.json
  try {
    if (!stateData.jobs) stateData.jobs = [];
    stateData.jobs.push({
      id: `update-v${VERSION}-${Date.now()}`,
      version: VERSION,
      subject: `🐾 FindLostPuppy update ${VERSION} is ready on Google Play`,
      createdAt: new Date().toISOString(),
      status: failed === 0 ? 'complete' : 'partial',
      totalSent: sent,
      totalFailed: failed,
    });
    fs.writeFileSync(STATE_FILE, JSON.stringify(stateData, null, 2), 'utf-8');
    console.log('✅ Updated .mail-data.local/state.json with dispatch log.');
  } catch (e) {
    console.warn('Notice: Could not write job log to state.json:', e.message);
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
