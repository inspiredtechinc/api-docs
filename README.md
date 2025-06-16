# openapi-docs/openapi-docs/README.md

# OpenAPI Documentation Repository

[![Generate OpenAPI Documentation](https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>/actions/workflows/generate-docs.yml/badge.svg)](https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>/actions/workflows/generate-docs.yml)

This repository is designed to host OpenAPI documentation for multiple services, including both staging and production versions. The documentation is automatically generated using GitHub Actions whenever changes are pushed to the `develop` or `master` branches.

## 🚀 Documentation Previews

- **Main Site:**  
  [https://<your-username>.github.io/<your-repo>/](https://<your-username>.github.io/<your-repo>/)  
  (Always shows the latest docs from `develop` and `master`.)

- **Pull Request Previews:**  
  When you open a PR, a preview of the docs is automatically deployed and a link is posted in the PR comments.  
  Example:  
  `https://<your-username>.github.io/<your-repo>/preview/pr-123/`

## Usage

### Local Development

- Run `make local` to generate docs for both environments and serve locally at [http://localhost:8000](http://localhost:8000).
- Run `make clean` to remove all generated files.

### GitHub Actions

- Docs are automatically generated and deployed to GitHub Pages on every push to `develop` (staging) and `master` (prod).
- Linting is performed on all OpenAPI specs before docs are generated.
- PRs from `feature/*` branches get a preview link posted in the PR comments.

## Features

- Dynamic card layout for each service and environment
- Per-service landing pages
- Last updated timestamp with milliseconds
- Custom 404 page for GitHub Pages
- Responsive, accessible HTML with dark mode support

---

## Directory Structure

```
openapi-docs/
  dashboard/
    prod/
      openapi.yaml
      redoc.html
      swagger.html
    staging/
      openapi.yaml
      redoc.html
      swagger.html
    index.html
  mobile/
    ...
  index.html
  generate-docs.sh
  Makefile
  package.json
  .github/
    workflows/
      generate-docs.yml
```

---

## 404

If you land on a missing page, [return to the API Home](./index.html).