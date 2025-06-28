# API Docs

This repository contains scripts and workflows for generating and deploying OpenAPI documentation for a microservices architecture.

## Features
- Dynamically generate Redoc and Swagger UI documentation for service and gateway specs.
- Support for multiple environments: `preview`, `staging`, and `production`.
- CI/CD workflows for preview, staging, and production deployments.
- GitHub Pages integration for serving documentation.

## Directory Structure
- `scripts/`: Contains scripts for generating and cleaning documentation.
- `public/`: Contains assets and generated documentation.
- `.github/workflows/`: Contains GitHub Actions workflows for CI/CD.
- `specs/`: Contains OpenAPI specs copied from the api-specs repo.

## Scripts
### `generate-docs.js`
Generates documentation for the specified environment.

### `cleanup.js`
(Planned) Cleans up obsolete preview environments.

## Workflows
### `docs-preview.yml`
Generates and deploys preview documentation for pull requests (triggered by repository_dispatch from api-specs).

### `staging-deploy.yml`
Generates and deploys staging documentation for the `develop` branch. Also cleans up preview PR folders after merge.

### `prod-deploy.yml`
Generates and deploys production documentation for the `master` branch.

## Setup
1. Ensure `node.js` is installed.
2. Run `npm install` to install dependencies.
3. Configure GitHub Pages for the `gh-pages` branch.

## Testing Workflows Locally
You can test workflows locally using tools like [act](https://github.com/nektos/act).

## Secrets
- `GITHUB_TOKEN`: Auto-injected by GitHub Actions.
- `API_DOCS_REPO_PAT`: Required for cross-repo PR creation from api-specs to api-docs.

## Versioning Support
(Planned) Add logic to handle versioning for specs and documentation.

## Contributing
Feel free to open issues or submit pull requests to improve this repository.
