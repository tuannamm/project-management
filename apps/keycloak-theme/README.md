# Keycloak theme

Initialize the `apps/front-end-kit` submodule, then run `npm ci --workspaces=false` in this directory. From the repository root:

- `npm exec -- nx run keycloak-theme:storybook` starts Storybook at http://localhost:6006.
- `npm exec -- nx run keycloak-theme:build-storybook` builds the static preview.
- `npm exec -- nx run keycloak-theme:package` builds the Keycloak provider JAR; Java and Maven are required.

Storybook uses mock Keycloak data. Forms and authentication actions require a running Keycloak server and cannot be tested in the preview.
