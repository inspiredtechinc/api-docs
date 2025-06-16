# Makefile for OpenAPI Docs local testing

.PHONY: all serve clean

all: generate-prod generate-staging

# Generate prod docs (master branch logic)
generate-prod:
	export GITHUB_REF_NAME=master && ./generate-docs.sh

# Generate staging docs (develop branch logic)
generate-staging:
	export GITHUB_REF_NAME=develop && ./generate-docs.sh

# Serve docs locally on port 8000
serve:
	python3 -m http.server 8000

# Clean generated HTML and timestamp files
clean:
	rm -f */*/redoc.html */*/swagger.html */*/.generated */index.html index.html
	echo "Cleaned generated files."

# Full local test: generate both, then serve
local: all serve
