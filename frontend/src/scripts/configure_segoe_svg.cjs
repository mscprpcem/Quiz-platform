const fs = require('fs');
const path = require('path');

const srcPath = 'c:/certificate-verification/frontend/public/assets/Segoe UI (1).svg';
const targetDir = 'c:/Quiz-platform/frontend/public/assets';
const targetPath = path.join(targetDir, 'Segoe UI (1).svg');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let content = fs.readFileSync(srcPath, 'utf8');

const placeholderLayer = `
  <!-- Configured Placeholders Layer -->
  <g id="svg-certificate-text-layer">
    <text x="421" y="210" fill="#01204f" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="4">CERTIFICATE OF ACHIEVEMENT</text>
    <text x="421" y="240" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" text-anchor="middle">PROUDLY PRESENTED TO</text>
    
    <text x="421" y="285" fill="#01204f" font-family="'Segoe UI', sans-serif" font-size="32" font-weight="900" text-anchor="middle">{name}</text>
    <line x1="221" y1="300" x2="621" y2="300" stroke="#00a4ef" stroke-width="2"/>
    
    <text x="421" y="335" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="600" text-anchor="middle">For outstanding performance in {event_name}</text>
    <text x="421" y="370" fill="#00a4ef" font-family="'Segoe UI', sans-serif" font-size="24" font-weight="800" text-anchor="middle">{title}</text>
    <text x="421" y="405" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" text-anchor="middle">Category: {category} | Rank: #{rank} | Score: {score} pts</text>

    <!-- Dynamic QR Code Group -->
    <g id="svg-qr-group" transform="translate(421, 465)">
      <g transform="translate(-32, -32)">
        {qr}
      </g>
    </g>

    <!-- Dynamic Verification Link -->
    <text id="svg-verification-url" x="421" y="520" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" text-anchor="middle">Verify Credential: {url}</text>

    <!-- Footer Information -->
    <g transform="translate(60, 550)">
      <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="700">DATE ISSUED</text>
      <text x="0" y="16" fill="#01204f" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700">{date}</text>
    </g>

    <g transform="translate(780, 550)">
      <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="700" text-anchor="end">CREDENTIAL ID</text>
      <text x="0" y="16" fill="#00a4ef" font-family="Consolas, monospace" font-size="12" font-weight="800" text-anchor="end">{credential_id}</text>
    </g>
  </g>
</svg>`;

if (!content.includes('id="svg-certificate-text-layer"')) {
  content = content.replace('</svg>', placeholderLayer);
  fs.writeFileSync(srcPath, content, 'utf8');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully configured Segoe UI (1).svg with {name}, {url}, and {qr} placeholders across both projects!');
