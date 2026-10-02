import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const DOCS_DIR = resolve('docs');
const OUTPUT_DIR = resolve('public/docs');

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const docFiles = [
  { src: 'PRD.md', title: 'Product Requirements Document (PRD)', category: 'Product Specification' },
  { src: 'TRD.md', title: 'Technical Requirements Document (TRD)', category: 'Technical Architecture' },
  { src: 'DESIGN_DOCUMENT.md', title: 'Design System & UX Document', category: 'Design & Visual Systems' },
  { src: 'architecture.md', title: 'System Architecture & Data Flows', category: 'Engineering Blueprint' },
  { src: 'security-audit-2026-09-29.md', title: 'Security Audit & Invariants Report', category: 'Security & Privacy' },
  { src: 'findlostpuppy-app-context.md', title: 'Complete App Context & Dossier', category: 'System Dossier' },
  { src: 'android-testing.md', title: 'Android Testing & Release Procedures', category: 'Quality Assurance' },
  { src: 'database.md', title: 'Firestore Collections & Schema', category: 'Data Architecture' },
  { src: 'firebase-setup.md', title: 'Firebase & Cloud Storage Setup', category: 'Cloud Infrastructure' },
  { src: 'legal-compliance-checklist.md', title: 'Legal & Play Store Compliance', category: 'Legal & Compliance' }
];

function markdownToHtml(md, title, category) {
  // Simple regex-based markdown converter for clean styled document rendering
  let body = md
    .replace(/^# (.*$)/gim, '<h1 class="doc-h1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="doc-h2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="doc-h3">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="doc-h4">$1</h4>')
    .replace(/^\> (.*$)/gim, '<blockquote class="doc-quote">$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="doc-code">$1</code>')
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/gim, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gims, '<ul class="doc-list">$1</ul>')
    .replace(/\n\n/gim, '</p><p class="doc-p">');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.6;
      font-size: 13px;
      padding: 24px;
    }
    .header-banner {
      border-bottom: 2px solid #FF7900;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #EA580C;
      letter-spacing: -0.02em;
    }
    .doc-category {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.05em;
    }
    .doc-h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 10px;
      margin-bottom: 12px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 8px;
    }
    .doc-h2 {
      font-size: 17px;
      font-weight: 700;
      color: #1E293B;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    .doc-h3 {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    .doc-p {
      margin-bottom: 12px;
      color: #334155;
    }
    .doc-list {
      margin-left: 20px;
      margin-bottom: 12px;
      color: #334155;
    }
    .doc-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: #F1F5F9;
      color: #C2410C;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .code-block {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: #0F172A;
      color: #F8FAFC;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 12px 0;
      white-space: pre-wrap;
    }
    .doc-quote {
      border-left: 4px solid #FF7900;
      background: #FFF7ED;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
      color: #9A3412;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #F8FAFC;
      font-weight: 700;
      color: #0F172A;
    }
    .footer-stamp {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      font-size: 11px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div>
      <div class="brand-title">🐾 FindLostPuppy</div>
      <div class="doc-category">${category}</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748B;">
      <div>Package: <strong>om.findlostpuppy.app</strong></div>
      <div>Confidential • Internal Technical Documentation</div>
    </div>
  </div>

  <p class="doc-p">${body}</p>

  <div class="footer-stamp">
    <span>FindLostPuppy Admin Portal • Official Documentation Release</span>
    <span>Generated: ${new Date().toISOString().split('T')[0]}</span>
  </div>
</body>
</html>`;
}

async function run() {
  console.log('Starting PDF generation for all project docs...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const doc of docFiles) {
    const srcPath = resolve(DOCS_DIR, doc.src);
    if (!existsSync(srcPath)) {
      console.warn(`File not found: ${srcPath}`);
      continue;
    }

    const mdContent = readFileSync(srcPath, 'utf8');
    const html = markdownToHtml(mdContent, doc.title, doc.category);
    const outPdfName = doc.src.replace(/\.md$/, '.pdf');
    const outPdfPath = resolve(OUTPUT_DIR, outPdfName);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });
    await page.close();
    console.log(`✅ Generated: ${outPdfName} at ${outPdfPath}`);
  }

  await browser.close();
  console.log('All PDFs generated successfully in public/docs/');
}

run().catch(err => {
  console.error('PDF Generation failed:', err);
  process.exit(1);
});
