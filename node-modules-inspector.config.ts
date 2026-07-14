import { defineConfig } from 'node-modules-inspector'

export default defineConfig({
  name: '@stacksjs/everything',

  // Pull publish dates, deprecation info & install sizes from npm.
  fetchNpmMeta: true,
  publint: true,

  defaultFilters: {
    sourceType: 'prod',
    excludeWorkspace: true,
  },

  defaultSettings: {
    // Cluster the graph by the pnpm catalog each package comes from
    // (framework / libraries / tools / bun / stx / vite) — matches how the
    // catalogs are organized in pnpm-workspace.yaml.
    dependenciesGroupBy: 'catalog',
    showPublishTimeBadge: true,
    showInstallSizeBadge: true,
    showFileComposition: true,
    showDependencySourceBadge: 'both',
  },

  // Big linting/bundling toolchains would balloon the graph — present them as
  // leaves so their transitive deps don't dominate the visualization.
  excludeDependenciesOf: [
    'eslint',
    'webpack',
    'jsdom',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/utils',
    '@vercel/nft',
  ],

  // This project's own build/deploy tooling — not part of "every Stacks package".
  excludePackages: [
    'typescript',
    'pnpm',
    'node-modules-inspector',
    'netlify-plugin-cache',
    'simple-git-hooks',
    'lint-staged',
  ],
})
