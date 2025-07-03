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

function generateMainIndex() {
  const existingEnvironments = fs.readdirSync(generatedDir).filter(dir => {
    const envPath = path.join(generatedDir, dir);
    return fs.statSync(envPath).isDirectory() && fs.existsSync(path.join(envPath, 'index.html'));
  });

  const mainIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>API Documentation - Card View</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
      color: #333;
    }
    header {
      background-color: #4CAF50;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    .content {
      margin: 1rem auto;
      max-width: 800px;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 1rem;
      background-color: white;
      flex: 1 1 calc(33.333% - 1rem);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .card a {
      color: #4CAF50;
      text-decoration: none;
    }
    .card a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <h1>API Documentation</h1>
  </header>
  <div class="content">
    ${existingEnvironments.map(env => `
      <div class="card">
        <a href="generated/${env}/index.html">${env.toUpperCase()} Environment</a>
      </div>
    `).join('\n')}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), mainIndexHtml);
}

function generateDocs() {
  try {
    const env = getEnvironment();
    ensureEnvironmentDirectory(env);

    const gatewaySpecs = fs.readdirSync(path.join(specsDir, 'gateways')).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    const serviceSpecs = fs.readdirSync(path.join(specsDir, 'services')).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
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
<html>
<head>
  <title>${env.toUpperCase()} API Documentation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
      color: #333;
    }
    header {
      background-color: #4CAF50;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    .content {
      margin: 1rem auto;
      max-width: 800px;
    }
    .content ul {
      list-style-type: none;
      padding: 0;
    }
    .content ul li {
      margin: 0.5rem 0;
    }
    .content ul li a {
      color: #4CAF50;
      text-decoration: none;
      margin-right: 1rem;
    }
    .content ul li a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <h1>${env.toUpperCase()} API Documentation</h1>
  </header>
  <div class="content">
    <ul>
      ${environmentContent.join('\n')}
    </ul>
  </div>
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
