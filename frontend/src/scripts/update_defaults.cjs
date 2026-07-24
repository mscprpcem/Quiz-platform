const fs = require('fs');

const segoeSvg = fs.readFileSync('c:/Quiz-platform/frontend/public/assets/Segoe UI (1).svg', 'utf8');

// 1. Update CertificateTemplateModal.jsx
const modalPath = 'c:/Quiz-platform/frontend/src/components/CertificateTemplateModal.jsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');
const modalRegex = /const DEFAULT_SVG = `[\s\S]*?`;/;
modalContent = modalContent.replace(modalRegex, `const DEFAULT_SVG = ${JSON.stringify(segoeSvg)};`);
fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('Updated DEFAULT_SVG in CertificateTemplateModal.jsx!');

// 2. Update quiz.js
const quizRoutePath = 'c:/Quiz-platform/backend/src/routes/quiz.js';
let quizRouteContent = fs.readFileSync(quizRoutePath, 'utf8');
const quizRouteRegex = /function getDefaultSvgTemplate\(\) \{[\s\S]*?return `[\s\S]*?`;\n\}/;
quizRouteContent = quizRouteContent.replace(quizRouteRegex, `function getDefaultSvgTemplate() {\n  return ${JSON.stringify(segoeSvg)};\n}`);
fs.writeFileSync(quizRoutePath, quizRouteContent, 'utf8');
console.log('Updated getDefaultSvgTemplate in quiz.js!');

// 3. Update svg.service.js
const svgServicePath = 'c:/certificate-verification/backend/src/services/svg.service.js';
let svgServiceContent = fs.readFileSync(svgServicePath, 'utf8');
const svgServiceRegex = /getDefaultVectorSVG\(\{ name, title, date, id, category, skills \}\) \{[\s\S]*?return `[\s\S]*?`;\n  \}/;
svgServiceContent = svgServiceContent.replace(svgServiceRegex, `getDefaultVectorSVG({ name, title, date, id, category, skills }) {\n    return ${JSON.stringify(segoeSvg)};\n  }`);
fs.writeFileSync(svgServicePath, svgServiceContent, 'utf8');
console.log('Updated getDefaultVectorSVG in svg.service.js!');
