// generate-docs.v2.js
// Clean, robust, bulletproof docs generator for InspiredTech API Docs
// Uses DOCS_ENV_DIR (or BUILD_ENV) for output, no duplicate code, fail-fast, and validates output.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const swaggerUi = require('swagger-ui-dist');
const yaml = require('js-yaml');

const specsDir = path.resolve(__dirname, '../specs');
const publicDir = path.resolve(__dirname, '../public');
const assetsDir = path.join(publicDir, 'assets');
const generatedDir = path.join(publicDir, 'generated');

function getDocsEnvDir() {
  return process.env.DOCS_ENV_DIR || process.env.BUILD_ENV || 'preview';
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copySwaggerAssets() {
  ensureDir(assetsDir);
  const dist = swaggerUi.getAbsoluteFSPath();
  fs.copyFileSync(path.join(dist, 'swagger-ui.css'), path.join(assetsDir, 'swagger-ui.css'));
  fs.copyFileSync(path.join(dist, 'swagger-ui-bundle.js'), path.join(assetsDir, 'swagger-ui-bundle.js'));
}

function getRelativeAssetsPath(outputHtmlPath) {
  const rel = path.relative(path.dirname(outputHtmlPath), assetsDir);
  return rel.split(path.sep).join('/');
}

function generateRedocDocs(specPath, outputPath) {
  execSync(`npx @redocly/cli build-docs "${specPath}" -o "${outputPath}"`, { stdio: 'inherit' });
}

function generateSwaggerDocs(swaggerSpec, outputPath) {
  const assetsPath = getRelativeAssetsPath(outputPath);
  const html = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Swagger UI</title>\n  <link rel=\"stylesheet\" type=\"text/css\" href=\"${assetsPath}/swagger-ui.css\">\n</head>\n<body>\n  <div id=\"swagger-ui\"></div>\n  <script src=\"${assetsPath}/swagger-ui-bundle.js\"></script>\n  <script>\n    const spec = ${JSON.stringify(swaggerSpec)};\n    const ui = SwaggerUIBundle({ spec, dom_id: '#swagger-ui' });\n  </script>\n</body>\n</html>`;
  fs.writeFileSync(outputPath, html);
}

function getSpecs(type) {
  const dir = path.join(specsDir, type);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
}

function generateEnvIndex(envDir, env, gateways, services) {
  const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>${env.toUpperCase()} API Documentation</title>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap\" rel=\"stylesheet\">\n  <style>body{font-family:'Inter',system-ui,Arial,sans-serif;margin:0;padding:0;background:linear-gradient(120deg,#181c24 0%,#232b3a 100%);color:#e5e7eb;min-height:100vh;}header{background:#111827;color:#f9fafb;padding:2rem 1rem 1rem 1rem;text-align:center;box-shadow:0 2px 8px rgba(17,24,39,0.18);position:sticky;top:0;z-index:10;}.logo{font-size:2.2rem;font-weight:700;letter-spacing:-1px;margin-bottom:0.2em;}.content{margin:2rem auto;max-width:900px;background:#232b3a;border-radius:18px;box-shadow:0 4px 24px rgba(17,24,39,0.18);padding:2rem 2rem 1.5rem 2rem;}h2{margin-top:1.5rem;margin-bottom:0.7rem;color:#93c5fd;font-size:1.3rem;font-weight:600;text-align:center;}.back-link{text-align:center;margin:2rem 0 0.5rem 0;}.back-link a{color:#60a5fa;text-decoration:none;font-weight:600;font-size:1.08rem;}.back-link a:hover{text-decoration:underline;color:#93c5fd;}ul{list-style-type:none;padding:0;margin:0 0 1.5rem 0;display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center;}li{background:#2a2e3b;border-radius:12px;box-shadow:0 2px 8px rgba(17,24,39,0.06);padding:1.2rem 1.5rem;margin:0.5rem 0;min-width:180px;max-width:320px;flex:1 1 180px;text-align:left;transition:box-shadow 0.15s;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;}li .spec-name{font-weight:600;font-size:1.08rem;margin-bottom:0.3rem;color:#e5e7eb;display:block;}.doc-links{display:inline-flex;align-items:center;gap:0.3em;margin-left:0.2em;}.doc-links a{color:#60a5fa;text-decoration:none;font-weight:600;font-size:1.08rem;margin:0 0.1em;display:inline-block;}.doc-links a:hover{text-decoration:underline;color:#93c5fd;}.divider{color:#888;font-size:1.08rem;margin:0 0.1em;user-select:none;}.meta{font-size:0.92rem;color:#888;margin-left:0;display:block;margin-top:0.4rem;}@media (max-width:600px){.content{padding:0.5rem;}ul{flex-direction:column;gap:0.5rem;}li{min-width:0;max-width:100%;padding:0.8rem 0.5rem;}.logo{font-size:1.1rem;}h2{font-size:1rem;}li .spec-name{font-size:1rem;}.doc-links{font-size:1rem;}}</style>\n</head>\n<body>\n  <header>\n    <div class=\"logo\">${env.toUpperCase()} API Documentation</div>\n    <div style=\"font-size:1.1rem;opacity:0.85;\">Browse all gateway and service specs for this environment</div>\n  </header>\n  <div class=\"content\">\n    <h2>Gateways</h2>\n    <ul>\n      ${gateways.join('\n')}\n    </ul>\n    <h2>Services</h2>\n    <ul>\n      ${services.join('\n')}\n    </ul>\n    <div class=\"back-link\">\n      <a href=\"/api-docs/index.html\">&larr; Back to Home</a>\n    </div>\n  </div>\n  <footer style=\"text-align:center;color:#888;font-size:0.95rem;margin:2rem 0 1rem 0;\">\n    &copy; ${new Date().getFullYear()} InspiredTech &mdash; All rights reserved.\n  </footer>\n</body>\n</html>`;
  fs.writeFileSync(path.join(envDir, 'index.html'), html);
}

// Recursively find all subdirectories under dir that contain an index.html
function findEnvDirsWithIndex(dir, relBase = '') {
  let envs = [];
  if (!fs.existsSync(dir)) return envs;
  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = relBase ? relBase + '/' + entry : entry;
    if (fs.statSync(abs).isDirectory()) {
      if (fs.existsSync(path.join(abs, 'index.html'))) {
        envs.push(rel);
      }
      // Recurse into subdirectories
      envs = envs.concat(findEnvDirsWithIndex(abs, rel));
    }
  }
  return envs;
}

function generateRootIndex() {
  let envs = findEnvDirsWithIndex(generatedDir);
  // Sort: preview, staging, then PRs (alphabetically)
  envs = envs.sort((a, b) => {
    const order = env =>
      env === 'preview' ? 0 :
      env === 'staging' ? 1 :
      env.startsWith('sync/') ? 2 : 3;
    const oA = order(a), oB = order(b);
    if (oA !== oB) return oA - oB;
    return a.localeCompare(b);
  });

  function getBadge(env) {
    if (env === 'preview') return '<span class="badge badge-preview">PREVIEW</span>';
    if (env === 'staging') return '<span class="badge badge-staging">STAGING</span>';
    if (env.startsWith('sync/')) return '<span class="badge badge-pr">PR</span>';
    return '';
  }

  const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>API Documentation - Card View</title>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap\" rel=\"stylesheet\">\n  <style>body{font-family:'Inter',system-ui,Arial,sans-serif;margin:0;padding:0;background:linear-gradient(120deg,#181c24 0%,#232b3a 100%);color:#e5e7eb;min-height:100vh;}header{background:#111827;color:#f9fafb;padding:2rem 1rem 1rem 1rem;text-align:center;box-shadow:0 2px 8px rgba(17,24,39,0.18);position:sticky;top:0;z-index:10;}.logo{font-size:2.2rem;font-weight:700;letter-spacing:-1px;margin-bottom:0.2em;}.content{margin:2rem auto;max-width:1000px;display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;}.card{border:none;border-radius:18px;padding:2rem 1.5rem;background:#232b3a;box-shadow:0 4px 24px rgba(17,24,39,0.18);min-width:260px;max-width:320px;flex:1 1 260px;text-align:center;transition:transform 0.15s,box-shadow 0.15s,background 0.15s;cursor:pointer;position:relative;}.card:hover{transform:translateY(-6px) scale(1.03);box-shadow:0 8px 32px rgba(17,24,39,0.28);background:#1f2533;}.card a{color:#60a5fa;text-decoration:none;font-weight:600;font-size:1.1rem;}.card a:hover{text-decoration:underline;color:#93c5fd;}.badge{display:inline-block;margin-left:0.5em;padding:0.2em 0.7em;border-radius:8px;font-size:0.85em;font-weight:600;letter-spacing:1px;}.badge-prod{background:#10b981;color:#fff;}.badge-staging{background:#f59e42;color:#fff;}.badge-preview{background:#6366f1;color:#fff;}.badge-pr{background:#f43f5e;color:#fff;} .timestamp{display:block;margin-top:0.5rem;font-size:0.7rem;color:#a1a1aa;}footer{text-align:center;color:#6b7280;font-size:0.95rem;margin:2rem 0 1rem 0;}</style>\n</head>\n<body>\n  <header>\n    <div class=\"logo\">API Documentation</div>\n    <div style=\"font-size:1.1rem;opacity:0.85;\">Browse environments and view your OpenAPI/Swagger docs</div>\n  </header>\n  <div class=\"content\">\n    ${envs.map(env => `<div class=\"card\"><a href=\"generated/${env}/index.html\">${env} Environment</a> ${getBadge(env)}<span class=\"timestamp\" style=\"font-size:0.7em;color:#a1a1aa;\">Build time: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })}</span></div>`).join('\n')}\n  </div>\n  <footer>\n    &copy; ${new Date().getFullYear()} InspiredTech &mdash; All rights reserved.\n  </footer>\n</body>\n</html>`;
  fs.writeFileSync(path.join(publicDir, 'index.html'), html);
}

function failIfMissing(file, msg) {
  if (!fs.existsSync(file)) {
    console.error(msg);
    process.exit(1);
  }
}

function main() {
  try {
    copySwaggerAssets();
    const env = getDocsEnvDir();
    const envDir = path.join(generatedDir, env);
    ensureDir(envDir);
    const gateways = [];
    const services = [];
    for (const type of ['gateways', 'services']) {
      for (const spec of getSpecs(type)) {
        const specPath = path.join(specsDir, type, spec);
        const baseName = path.basename(spec, path.extname(spec));
        const rawSpec = fs.readFileSync(specPath, 'utf8');
        const swaggerSpec = yaml.load(rawSpec);
        swaggerSpec['x-last-generated'] = new Date().toISOString();
        // Redoc
        const redocDir = path.join(envDir, 'redoc');
        ensureDir(redocDir);
        console.log(`[Redoc] Generating for ${baseName}...`);
        try {
          generateRedocDocs(specPath, path.join(redocDir, `${baseName}.html`));
          console.log(`[Redoc] Done: ${baseName}`);
        } catch (err) {
          console.error(`[Redoc] Failed for ${baseName}:`, err);
        }
        // Swagger
        const swaggerDir = path.join(envDir, 'swagger');
        ensureDir(swaggerDir);
        console.log(`[Swagger] Generating for ${baseName}...`);
        try {
          const swaggerOutPath = path.join(swaggerDir, `${baseName}.html`);
          generateSwaggerDocs(swaggerSpec, swaggerOutPath);
          console.log(`[Swagger] Done: ${baseName}`);
          // Add celebratory log for Swagger
          const stats = fs.statSync(swaggerOutPath);
          const sizeKiB = Math.round(stats.size / 1024);
          console.log(`🎉 bundled successfully in: ${swaggerOutPath} (${sizeKiB} KiB) (Swagger)`);
        } catch (err) {
          console.error(`[Swagger] Failed for ${baseName}:`, err);
        }
        // Index entry
        const humanTimestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' });
        const entry = `<li><span class=\"spec-name\">${baseName}</span> <span class=\"doc-links\"><a href=\"redoc/${baseName}.html\">Redoc</a> <span class=\"divider\">|</span> <a href=\"swagger/${baseName}.html\">Swagger</a></span> <span class=\"meta\" style=\"font-size:0.7em;\">Timestamp: ${humanTimestamp}</span></li>`;
        if (type === 'gateways') gateways.push(entry); else services.push(entry);
      }
    }
    generateEnvIndex(envDir, env, gateways, services);
    failIfMissing(path.join(envDir, 'index.html'), `Failed to generate environment index for ${env}`);
    generateRootIndex();
    failIfMissing(path.join(publicDir, 'index.html'), 'Failed to generate root index');
    console.log(`Documentation generated successfully for ${env}`);
  } catch (err) {
    console.error('Error generating documentation:', err);
    process.exit(1);
  }
}

if (process.argv.includes('--index-only')) {
  try {
    generateRootIndex();
    process.exit(0);
  } catch (err) {
    console.error('Error generating root index:', err);
    process.exit(1);
  }
}

main();
