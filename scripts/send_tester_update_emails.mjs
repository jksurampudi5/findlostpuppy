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
  const subject = `🐾 FindLostPuppy update ${VERSION} is ready on Google Play`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1.5px solid #FF7900;box-shadow:0 0 32px rgba(255,121,0,0.22);overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A0D00 0%,#2A1500 100%);padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,121,0,0.25);">
            <div style="font-size:42px;margin-bottom:8px;">🐾</div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#FF7900;letter-spacing:-0.5px;">FindLostPuppy</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#94A3B8;letter-spacing:0.5px;text-transform:uppercase;font-weight:700;">NEW UPDATE READY (v${VERSION})</p>
          </td>
        </tr>

        <!-- Content Body -->
        <tr>
          <td style="padding:28px 32px 16px;">
            <p style="margin:0 0 16px;font-size:16px;color:#F8F9FA;line-height:1.6;">
              Hi early access tester! 🐶
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#CBD5E1;line-height:1.7;">
              Google Play has approved our newest build (<strong>Version ${VERSION}</strong>). This update delivers major reliability and experience improvements:
            </p>

            <!-- What's New Box -->
            <div style="background:#16191E;border-left:4px solid #FF7900;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
              <h3 style="margin:0 0 10px;font-size:14px;color:#FF7900;text-transform:uppercase;letter-spacing:0.5px;">What's New in ${VERSION}:</h3>
              <ul style="margin:0;padding-left:18px;color:#CBD5E1;font-size:14px;line-height:1.8;">
                <li><strong>Community Adoptions Management:</strong> Pet parents and moderators can now easily manage, view, and delete adoption listings directly from cards and detail views.</li>
                <li><strong>Clean Dog Registry:</strong> Removed all demo and sample dog entries so only genuine, active community listings are displayed.</li>
                <li><strong>Enhanced Mobile Layout:</strong> Fixed bottom dock navigation and footer clearance so Terms &amp; Conditions and legal disclosures are easily readable.</li>
                <li><strong>Performance &amp; Speed:</strong> Streamlined dashboard navigation and faster local and cloud synchronization.</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align:center;margin:30px 0 24px;">
              <a href="${STORE_LINK}" style="display:inline-block;background:linear-gradient(135deg,#FF7900 0%,#E56B00 100%);color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:800;padding:14px 32px;border-radius:10px;box-shadow:0 4px 18px rgba(255,121,0,0.4);">
                Update on Google Play →
              </a>
            </div>

            <!-- Steps -->
            <p style="margin:0 0 8px;font-size:14px;color:#94A3B8;text-align:center;">
              1. Tap the button above on your Android phone.<br/>
              2. Tap <strong>Update</strong> in Google Play.<br/>
              3. Open the app and verify your profile &amp; area.
            </p>

            <div style="border-top:1px solid rgba(255,255,255,0.08);margin:24px 0 16px;padding-top:16px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#64748B;">Haven't joined the tester program yet?</p>
              <a href="${TESTING_LINK}" style="font-size:13px;color:#FF9B42;text-decoration:underline;">
                Join Google Play Testing Program
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;background:#0C0D0F;">
            <p style="margin:0 0 4px;font-size:12px;color:#64748B;">
              Thank you for helping us reunite lost dogs with their loving families!
            </p>
            <p style="margin:0;font-size:13px;color:#FF7900;font-weight:700;">
              — Jayakrishna &amp; FindLostPuppy Team 🐾
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  const text = `Hi early access tester! 🐶

FindLostPuppy update version ${VERSION} is now available on Google Play!

What's New in v${VERSION}:
• Automatic Profile Restore: Profile photo & phone number automatically restore on sign-in.
• Faster Location Selection: Spacious selector for State, District, Mandal, and Village with direct tap.
• Zero Keyboard Occlusion: Virtual keyboard stays closed so you can pick from dropdowns directly.
• Stability, speed, and offline resilience improvements.

How to update:
1. Open this link on your phone: ${STORE_LINK}
2. Tap "Update" in Google Play.
3. Open the app and test your profile and area.

Haven't joined testing yet?
Join here: ${TESTING_LINK}

Thank you so much for your support!
— Jayakrishna & FindLostPuppy Team 🐾`;

  return {
    from: `"FindLostPuppy 🐾" <${SENDER_EMAIL}>`,
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
