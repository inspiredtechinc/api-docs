#!/bin/bash

# Set output directory based on event type
OUTPUT_DIR="site"
if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
  OUTPUT_DIR="preview"
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Card layout index.html generator for all modules and envs
ENV=""
if [[ "$GITHUB_REF_NAME" == "develop" ]]; then
  ENV="staging"
elif [[ "$GITHUB_REF_NAME" == "master" ]]; then
  ENV="prod"
fi

# Generate docs for the current env (if set)
if [[ -n "$ENV" ]]; then
  for service in */ ; do
    service_name="${service%/}"
    openapi_file="$service_name/$ENV/openapi.yaml"
    if [ -f "$openapi_file" ]; then
      mkdir -p "$OUTPUT_DIR/$service_name/$ENV"
      npx @redocly/cli build-docs "$openapi_file" -o "$OUTPUT_DIR/$service_name/$ENV/redoc.html"
      # Swagger UI HTML (fix: use correct Swagger UI embed and relative path)
      swagger_ui_html="$OUTPUT_DIR/$service_name/$ENV/swagger.html"
      cat > "$swagger_ui_html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI - $service_name ($ENV)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: 'openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
EOF
      # Copy openapi.yaml to output dir for Swagger UI
      cp "$openapi_file" "$OUTPUT_DIR/$service_name/$ENV/openapi.yaml"
      # Write timestamp for this env (with millis)
      date '+%Y-%m-%d %H:%M:%S.%3N' > "$OUTPUT_DIR/$service_name/$ENV/.generated"
    fi
  done
fi

# Card layout index.html for all modules and envs (using env-group and card classes)
echo "<!DOCTYPE html>" > "$OUTPUT_DIR/index.html"
echo "<html>" >> "$OUTPUT_DIR/index.html"
echo "<head>" >> "$OUTPUT_DIR/index.html"
echo "  <title>API Docs</title>" >> "$OUTPUT_DIR/index.html"
echo "  <style>" >> "$OUTPUT_DIR/index.html"
echo "    body { font-family: sans-serif; margin: 2em; background: #f7f7f7; color: #222; }" >> "$OUTPUT_DIR/index.html"
echo "    .env-group { display: flex; gap: 2em; margin-top: 2em; }" >> "$OUTPUT_DIR/index.html"
echo "    .card { border: 1px solid #ccc; border-radius: 8px; padding: 1.5em; min-width: 180px; box-shadow: 0 2px 8px #eee; background: #fafbfc; }" >> "$OUTPUT_DIR/index.html"
echo "    .card h2 { margin-top: 0; }" >> "$OUTPUT_DIR/index.html"
echo "    .card ul { list-style: none; padding: 0; }" >> "$OUTPUT_DIR/index.html"
echo "    .card li { margin: 0.5em 0; }" >> "$OUTPUT_DIR/index.html"
echo "    a { text-decoration: none; color: #0074d9; }" >> "$OUTPUT_DIR/index.html"
echo "    a:hover { text-decoration: underline; }" >> "$OUTPUT_DIR/index.html"
echo "    @media (prefers-color-scheme: dark) { body { background: #181a1b; color: #eee; } .card { background: #23272a; border-color: #444; } a { color: #66baff; } }" >> "$OUTPUT_DIR/index.html"
echo "  </style>" >> "$OUTPUT_DIR/index.html"
echo "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" >> "$OUTPUT_DIR/index.html"
echo "</head>" >> "$OUTPUT_DIR/index.html"
echo "<body>" >> "$OUTPUT_DIR/index.html"
echo "  <h1>API Documentation</h1>" >> "$OUTPUT_DIR/index.html"

for service in */ ; do
  service_name="${service%/}"
  # Only show the service if it has at least one env
  has_env=false
  for env in prod staging; do
    if [ -f "$OUTPUT_DIR/$service_name/$env/redoc.html" ]; then
      has_env=true
      break
    fi
  done
  if [ "$has_env" = true ]; then
    echo "  <h2 style='margin-top:2em;'><a href='./$service_name/index.html' style=\"color:inherit;text-decoration:none;\">$service_name</a></h2>" >> "$OUTPUT_DIR/index.html"
    echo "  <div class=\"env-group\">" >> "$OUTPUT_DIR/index.html"
    for env in prod staging; do
      if [ -f "$OUTPUT_DIR/$service_name/$env/redoc.html" ]; then
        env_label="Production"
        [ "$env" = "staging" ] && env_label="Staging"
        # Read timestamp for this env, fallback to N/A
        if [ -f "$OUTPUT_DIR/$service_name/$env/.generated" ]; then
          updated=$(cat "$OUTPUT_DIR/$service_name/$env/.generated")
        else
          updated="N/A"
        fi
        echo "    <div class=\"card\">" >> "$OUTPUT_DIR/index.html"
        echo "      <h2>$env_label</h2>" >> "$OUTPUT_DIR/index.html"
        echo "      <ul>" >> "$OUTPUT_DIR/index.html"
        echo "        <li><a href='./$service_name/$env/redoc.html'>Redoc</a></li>" >> "$OUTPUT_DIR/index.html"
        echo "        <li><a href='./$service_name/$env/swagger.html'>Swagger UI</a></li>" >> "$OUTPUT_DIR/index.html"
        echo "      </ul>" >> "$OUTPUT_DIR/index.html"
        echo "      <p style=\"font-size:0.9em;color:#888;\">Last updated: $updated</p>" >> "$OUTPUT_DIR/index.html"
        echo "    </div>" >> "$OUTPUT_DIR/index.html"
      fi
    done
    echo "  </div>" >> "$OUTPUT_DIR/index.html"
    # --- Generate service-level index.html ---
    service_index="$OUTPUT_DIR/$service_name/index.html"
    mkdir -p "$OUTPUT_DIR/$service_name"
    echo "<!DOCTYPE html>" > "$service_index"
    echo "<html>" >> "$service_index"
    echo "<head>" >> "$service_index"
    echo "  <title>$service_name API Environments</title>" >> "$service_index"
    echo "  <style>" >> "$service_index"
    echo "    body { font-family: sans-serif; margin: 2em; background: #f7f7f7; color: #222; }" >> "$service_index"
    echo "    .env-group { display: flex; gap: 2em; margin-top: 2em; }" >> "$service_index"
    echo "    .card { border: 1px solid #ccc; border-radius: 8px; padding: 1.5em; min-width: 180px; box-shadow: 0 2px 8px #eee; background: #fafbfc; }" >> "$service_index"
    echo "    .card h2 { margin-top: 0; }" >> "$service_index"
    echo "    .card ul { list-style: none; padding: 0; }" >> "$service_index"
    echo "    .card li { margin: 0.5em 0; }" >> "$service_index"
    echo "    a { text-decoration: none; color: #0074d9; }" >> "$service_index"
    echo "    a:hover { text-decoration: underline; }" >> "$service_index"
    echo "    @media (prefers-color-scheme: dark) { body { background: #181a1b; color: #eee; } .card { background: #23272a; border-color: #444; } a { color: #66baff; } }" >> "$service_index"
    echo "  </style>" >> "$service_index"
    echo "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" >> "$service_index"
    echo "</head>" >> "$service_index"
    echo "<body>" >> "$service_index"
    echo "  <h1>$service_name API Environments</h1>" >> "$service_index"
    echo "  <div class=\"env-group\">" >> "$service_index"
    for env in prod staging; do
      if [ -f "$OUTPUT_DIR/$service_name/$env/redoc.html" ]; then
        env_label="Production"
        [ "$env" = "staging" ] && env_label="Staging"
        # Read timestamp for this env, fallback to N/A
        if [ -f "$OUTPUT_DIR/$service_name/$env/.generated" ]; then
          updated=$(cat "$OUTPUT_DIR/$service_name/$env/.generated")
        else
          updated="N/A"
        fi
        echo "    <div class=\"card\">" >> "$service_index"
        echo "      <h2>$env_label</h2>" >> "$service_index"
        echo "      <ul>" >> "$service_index"
        echo "        <li><a href='./$env/redoc.html'>Redoc</a></li>" >> "$service_index"
        echo "        <li><a href='./$env/swagger.html'>Swagger UI</a></li>" >> "$service_index"
        echo "      </ul>" >> "$service_index"
        echo "      <p style=\"font-size:0.9em;color:#888;\">Last updated: $updated</p>" >> "$service_index"
        echo "    </div>" >> "$service_index"
      fi
    done
    echo "  </div>" >> "$service_index"
    echo "  <p style=\"margin-top:2em;\"><a href=\"../index.html\">&larr; Back to API Home</a></p>" >> "$service_index"
    echo "</body>" >> "$service_index"
    echo "</html>" >> "$service_index"
  fi
done
echo "</body>" >> "$OUTPUT_DIR/index.html"
echo "</html>" >> "$OUTPUT_DIR/index.html"

touch "$OUTPUT_DIR/.nojekyll"