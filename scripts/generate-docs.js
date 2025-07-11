const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const swaggerUi = require('swagger-ui-dist');
const swaggerJsdoc = require('swagger-jsdoc');
const yaml = require('js-yaml');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;

const specsDir = path.resolve(__dirname, '../specs');
const publicDir = path.resolve(__dirname, '../public');
const swaggerUiDistPath = swaggerUi.getAbsoluteFSPath();
const swaggerAssetsDir = path.join(publicDir, 'swagger');
const assetsDir = path.join(publicDir, 'assets');
const generatedDir = path.join(publicDir, 'generated');

function generateRedocDocs(specPath, redocOutputPath) {
  execSync(`npx @redocly/cli build-docs "${specPath}" -o "${redocOutputPath}"`);
}

function generateSwaggerDocs(swaggerSpec, outputPath) {
  const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="/api-docs/assets/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/assets/swagger-ui-bundle.js"></script>
  <script>
    const spec = ${JSON.stringify(swaggerSpec)};
    const ui = SwaggerUIBundle({
      spec,
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>`;
  fs.writeFileSync(outputPath, swaggerHtml);
}

// Ensure assets are copied only once
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.copyFileSync(path.join(swaggerUiDistPath, 'swagger-ui.css'), path.join(assetsDir, 'swagger-ui.css'));
  fs.copyFileSync(path.join(swaggerUiDistPath, 'swagger-ui-bundle.js'), path.join(assetsDir, 'swagger-ui-bundle.js'));
}

function getEnvironment() {
  const env = process.env.BUILD_ENV || 'preview';
  console.warn(`Using environment: ${env}`);
  return env;
}

function ensureEnvironmentDirectory(env) {
  const envDir = path.join(generatedDir, env);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }
}

function getEnvDisplayName(env) {
  if (env === 'prod') return 'Production';
  if (env === 'staging') return 'Staging';
  if (env === 'preview' || env.startsWith('preview-')) return `Preview: ${env}`;
  if (env === 'main') return 'Main';
  if (env === 'develop') return 'Develop';
  // For all other preview/feature branches
  if (env !== 'prod' && env !== 'staging') return `Preview: ${env}`;
  return env.charAt(0).toUpperCase() + env.slice(1);
}

function generateMainIndex() {
  const generatedDir = path.join(publicDir, 'generated');
  const existingEnvironments = fs.existsSync(generatedDir)
    ? fs.readdirSync(generatedDir).filter(dir => {
        const envPath = path.join(generatedDir, dir);
        return fs.statSync(envPath).isDirectory() && fs.existsSync(path.join(envPath, 'index.html'));
      })
    : [];

  const mainIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Card View</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(120deg, #181c24 0%, #232b3a 100%);
      color: #e5e7eb;
      min-height: 100vh;
    }
    header {
      background: #111827;
      color: #f9fafb;
      padding: 2rem 1rem 1rem 1rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(17,24,39,0.18);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .logo {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -1px;
      margin-bottom: 0.2em;
    }
    .content {
      margin: 2rem auto;
      max-width: 1000px;
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
    }
    .card {
      border: none;
      border-radius: 18px;
      padding: 2rem 1.5rem;
      background: #232b3a;
      box-shadow: 0 4px 24px rgba(17,24,39,0.18);
      min-width: 260px;
      max-width: 320px;
      flex: 1 1 260px;
      text-align: center;
      transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
      cursor: pointer;
    }
    .card:hover {
      transform: translateY(-6px) scale(1.03);
      box-shadow: 0 8px 32px rgba(17,24,39,0.28);
      background: #1f2533;
    }
    .card a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
    }
    .card a:hover {
      text-decoration: underline;
      color: #93c5fd;
    }
    footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.95rem;
      margin: 2rem 0 1rem 0;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">API Documentation</div>
    <div style="font-size:1.1rem;opacity:0.85;">Browse environments and view your OpenAPI/Swagger docs</div>
  </header>
  <div class="content">
    ${existingEnvironments.map(env => `
      <div class="card">
        <a href="generated/${env}/index.html">${getEnvDisplayName(env)} Environment</a>
      </div>
    `).join('\n')}
  </div>
  <footer>
    &copy; ${new Date().getFullYear()} InspiredTech &mdash; All rights reserved.
  </footer>
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), mainIndexHtml);
}

// Ensure assets are copied only once
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.copyFileSync(path.join(swaggerUiDistPath, 'swagger-ui.css'), path.join(assetsDir, 'swagger-ui.css'));
  fs.copyFileSync(path.join(swaggerUiDistPath, 'swagger-ui-bundle.js'), path.join(assetsDir, 'swagger-ui-bundle.js'));
}

function getEnvironment() {
  const env = process.env.BUILD_ENV || 'preview';
  console.warn(`Using environment: ${env}`);
  return env;
}

function ensureEnvironmentDirectory(env) {
  const envDir = path.join(generatedDir, env);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }
}

function getEnvDisplayName(env) {
  if (env === 'prod') return 'Production';
  if (env === 'staging') return 'Staging';
  if (env === 'preview' || env.startsWith('preview-')) return `Preview: ${env}`;
  if (env === 'main') return 'Main';
  if (env === 'develop') return 'Develop';
  // For all other preview/feature branches
  if (env !== 'prod' && env !== 'staging') return `Preview: ${env}`;
  return env.charAt(0).toUpperCase() + env.slice(1);
}

function generateMainIndex() {
  const generatedDir = path.join(publicDir, 'generated');
  const existingEnvironments = fs.existsSync(generatedDir)
    ? fs.readdirSync(generatedDir).filter(dir => {
        const envPath = path.join(generatedDir, dir);
        return fs.statSync(envPath).isDirectory() && fs.existsSync(path.join(envPath, 'index.html'));
      })
    : [];

  const mainIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Card View</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(120deg, #181c24 0%, #232b3a 100%);
      color: #e5e7eb;
      min-height: 100vh;
    }
    header {
      background: #111827;
      color: #f9fafb;
      padding: 2rem 1rem 1rem 1rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(17,24,39,0.18);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .logo {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -1px;
      margin-bottom: 0.2em;
    }
    .content {
      margin: 2rem auto;
      max-width: 1000px;
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
    }
    .card {
      border: none;
      border-radius: 18px;
      padding: 2rem 1.5rem;
      background: #232b3a;
      box-shadow: 0 4px 24px rgba(17,24,39,0.18);
      min-width: 260px;
      max-width: 320px;
      flex: 1 1 260px;
      text-align: center;
      transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
      cursor: pointer;
    }
    .card:hover {
      transform: translateY(-6px) scale(1.03);
      box-shadow: 0 8px 32px rgba(17,24,39,0.28);
      background: #1f2533;
    }
    .card a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
    }
    .card a:hover {
      text-decoration: underline;
      color: #93c5fd;
    }
    footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.95rem;
      margin: 2rem 0 1rem 0;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">API Documentation</div>
    <div style="font-size:1.1rem;opacity:0.85;">Browse environments and view your OpenAPI/Swagger docs</div>
  </header>
  <div class="content">
    ${existingEnvironments.map(env => `
      <div class="card">
        <a href="generated/${env}/index.html">${getEnvDisplayName(env)} Environment</a>
      </div>
    `).join('\n')}
  </div>
  <footer>
    &copy; ${new Date().getFullYear()} InspiredTech &mdash; All rights reserved.
  </footer>
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), mainIndexHtml);
}

// Support --index-only mode
if (process.argv.includes('--index-only')) {
  generateMainIndex();
  process.exit(0);
}

function generateDocs() {
  try {
    const env = getEnvironment();
    ensureEnvironmentDirectory(env);

    // Use correct plural directory name for gateways
    const gatewaySpecs = fs.existsSync(path.join(specsDir, 'gateways'))
      ? fs.readdirSync(path.join(specsDir, 'gateways')).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      : [];
    const serviceSpecs = fs.existsSync(path.join(specsDir, 'services'))
      ? fs.readdirSync(path.join(specsDir, 'services')).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      : [];
    const allSpecs = [...gatewaySpecs.map(spec => ({ type: 'gateway', spec })), ...serviceSpecs.map(spec => ({ type: 'service', spec }))];

    const environmentContent = [];

    allSpecs.forEach(({ type, spec }) => {
      const specPath = path.join(specsDir, type === 'gateway' ? 'gateways' : 'services', spec);
      const baseName = path.basename(spec, path.extname(spec));

      // Parse spec
      const rawSpec = fs.readFileSync(specPath, 'utf8');
      const swaggerSpec = yaml.load(rawSpec);

      // Add last generated date to OpenAPI spec
      const lastGeneratedDate = new Date().toISOString();
      swaggerSpec['x-last-generated'] = lastGeneratedDate;

      // Generate Redoc documentation
      const redocDir = path.join(generatedDir, env, 'redoc');
      if (!fs.existsSync(redocDir)) {
        fs.mkdirSync(redocDir, { recursive: true });
      }
      generateRedocDocs(specPath, path.join(redocDir, `${baseName}.html`));

      // Generate Swagger UI documentation
      const swaggerDir = path.join(generatedDir, env, 'swagger');
      if (!fs.existsSync(swaggerDir)) {
        fs.mkdirSync(swaggerDir, { recursive: true });
      }
      generateSwaggerDocs(swaggerSpec, path.join(swaggerDir, `${baseName}.html`));

      // Add to environment-specific index
        environmentContent.push(`<li>${baseName} (${type}) - <a href="redoc/${baseName}.html">Redoc</a> | <a href="swagger/${baseName}.html">Swagger UI</a> <span style="font-size: smaller; color: #888;">(Last generated: ${lastGeneratedDate})</span></li>`);
    });

    // Generate index page for the environment
    const envIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${env.toUpperCase()} API Documentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(120deg, #181c24 0%, #232b3a 100%);
      color: #e5e7eb;
      min-height: 100vh;
    }
    header {
      background: #111827;
      color: #f9fafb;
      padding: 2rem 1rem 1rem 1rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(17,24,39,0.18);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .logo {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -1px;
      margin-bottom: 0.2em;
    }
    .content {
      margin: 2rem auto;
      max-width: 900px;
      background: #232b3a;
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(17,24,39,0.18);
      padding: 2rem 2rem 1.5rem 2rem;
    }
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
    }
    li {
      background: #2a2e3b;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(17,24,39,0.06);
      padding: 1.2rem 1.5rem;
      margin: 0.5rem 0;
      min-width: 220px;
      max-width: 320px;
      flex: 1 1 220px;
      text-align: left;
      transition: box-shadow 0.15s;
    }
    li:hover {
      box-shadow: 0 6px 24px rgba(17,24,39,0.13);
    }
    li a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.08rem;
      margin-right: 1.2rem;
    }
    li a:hover {
      text-decoration: underline;
      color: #93c5fd;
    }
    .meta {
      font-size: 0.92rem;
      color: #888;
      margin-left: 0.5rem;
    }
    @media (max-width: 600px) {
      .content { padding: 1rem; }
      ul { flex-direction: column; gap: 0.5rem; }
      li { min-width: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">${env.toUpperCase()} API Documentation</div>
    <div style="font-size:1.1rem;opacity:0.85;">Browse all gateway and service specs for this environment</div>
  </header>
  <div class="content">
    <ul>
      ${environmentContent.join('\n')}
    </ul>
  </div>
  <footer style="text-align:center;color:#888;font-size:0.95rem;margin:2rem 0 1rem 0;">
    &copy; ${new Date().getFullYear()} InspiredTech &mdash; All rights reserved.
  </footer>
</body>
</html>`;

    fs.writeFileSync(path.join(generatedDir, env, 'index.html'), envIndexHtml);

    // Generate main landing page dynamically
    generateMainIndex();

    console.log(`Documentation generated successfully for ${env} environment.`);
  } catch (error) {
    console.error('Error generating documentation:', error.message);
  }
}

generateDocs();
