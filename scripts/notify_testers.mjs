import nodemailer from 'nodemailer';
import fs from 'fs';
import readline from 'readline';

const GROUP_EMAIL = 'findlostpuppy-early-access-testers@googlegroups.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jksurampudi5@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

function getLatestVersion() {
  try {
    const gradleContent = fs.readFileSync('android/app/build.gradle', 'utf-8');
    const match = gradleContent.match(/versionName\s+"([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (err) {
    console.warn("Could not read android/app/build.gradle to get version name.");
  }
  return "latest";
}

function generateHtml(version, releaseNotes) {
  // Convert release notes into bullet points if they aren't already HTML
  const formattedNotes = releaseNotes
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `<li style="margin-bottom: 8px;">${line}</li>`)
    .join('');

  return `
<div style="font-family: Arial, sans-serif; background-color: #1a1a1a; color: white; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #ff9800; margin: 0;">FindLostPuppy</h1>
    <p style="color: #aaaaaa; margin: 5px 0 0 0;">APP UPDATE AVAILABLE</p>
  </div>
  
  <p>Hi Testers!</p>
  <p>Thank you for being a part of the <strong>FindLostPuppy</strong> early access testing! We've just released a new update (<strong>Version ${version}</strong>).</p>
  
  <div style="background-color: #2a2a2a; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #ff9800; margin-top: 0;">WHAT'S NEW</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${formattedNotes}
    </ul>
  </div>
  
  <p>Please follow these quick steps on your Android device to update:</p>
  
  <div style="background-color: #2a2a2a; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #ff9800; margin-top: 0;">STEP 1 — GET THE UPDATE</h3>
    <p>Tap the link below to open the Google Play Store and update to the latest version.</p>
    <a href="https://play.google.com/store/apps/details?id=om.findlostpuppy.app" style="display: inline-block; background-color: #ff9800; color: #1a1a1a; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Update FindLostPuppy</a>
  </div>

  <div style="background-color: #2a2a2a; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #ff9800; margin-top: 0;">HAVEN'T JOINED YET?</h3>
    <p>If you haven't joined the testing group yet, please tap the link below to join the testing program first.</p>
    <a href="https://play.google.com/apps/testing/om.findlostpuppy.app" style="display: inline-block; background-color: #555555; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Join Testing Group</a>
  </div>

  <p>Thank you for helping us build a platform dedicated to helping lost dogs find their way home safely.</p>
</div>
`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  if (!process.env.EMAIL_PASS) {
    console.error("❌ ERROR: EMAIL_PASS environment variable is not set.");
    console.error("Please run the script like this:");
    console.error('export EMAIL_PASS="your_app_password" && node scripts/notify_testers.mjs');
    process.exit(1);
  }

  const version = getLatestVersion();
  console.log('🐾 FindLostPuppy Release Notifier 🐾');
  console.log(`Detected Version: ${version}\n`);

  console.log("Enter the release notes for this version.");
  console.log("(Type 'DONE' on a new line when finished):");
  
  const notesLines = [];
  for await (const line of rl) {
    if (line.trim().toUpperCase() === 'DONE') {
      break;
    }
    notesLines.push(line);
  }

  const releaseNotes = notesLines.join('\n');

  const confirm = await askQuestion(`\nReady to send to ${GROUP_EMAIL}? (yes/no): `);
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log("Aborted.");
    process.exit(0);
  }

  console.log(`\nSending update email to the Google Group (${GROUP_EMAIL})...`);
  
  try {
    await transporter.sendMail({
      from: '"FindLostPuppy 🐾" <jksurampudi5@gmail.com>',
      to: GROUP_EMAIL,
      subject: `🐾 FindLostPuppy Update ${version} Available!`,
      html: generateHtml(version, releaseNotes)
    });
    console.log('✅ Successfully sent email broadcast to all testers in the Google Group!');
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }

  rl.close();
}

main().catch(console.error);
