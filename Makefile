# Makefile for API Docs

.PHONY: clean staging preview test

clean:
	npm run clean

staging:
	BUILD_ENV=staging npm run generate-docs

preview:
	npm run preview

test: clean staging preview
	@echo "Docs built for staging and preview environments."
