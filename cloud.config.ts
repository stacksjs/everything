import type { CloudConfig } from '@stacksjs/ts-cloud'

/**
 * ts-cloud deployment config for @stacksjs/everything.
 *
 * Ships the built node-modules-inspector site (a static SPA) to the shared
 * Stacks Hetzner box as `everything.stacksjs.com`.
 *
 * @see https://github.com/stacksjs/ts-cloud
 */
const config: CloudConfig = {
  project: {
    name: 'everything',
    slug: 'everything',
    region: 'us-east-1',
  },

  environments: {
    production: {
      type: 'production',
      // Push to `main` → deploy here, served at everything.stacksjs.com.
      deployBranch: 'main',
      variables: {
        NODE_ENV: 'production',
      },
    },
  },

  // Reuse the shared box owned by the `stacks` project instead of provisioning
  // our own: the deploy resolves the `stacks-production-app` server (pinned via
  // .ts-cloud/state/everything-production.json), ships only this app's site, and
  // adds an additive rpx `sites.d/everything.json` fragment — never touching the
  // box lifecycle or the other tenants (stacks, bughq, ghostanalytics, …).
  cloud: {
    provider: 'hetzner',
    attachTo: 'stacks',
  },
  hetzner: {
    // apiToken falls back to HCLOUD_TOKEN in the environment.
    location: 'fsn1',
    image: 'ubuntu-24.04',
    sshPrivateKeyPath: '~/.ssh/id_ed25519',
    sshUser: 'root',
  },

  infrastructure: {
    compute: {
      mode: 'server',
      size: 'small',
      runtime: 'bun',
      // rpx serves the box (not nginx). Both signals are set so the deploy never
      // stands up nginx + certbot for this site — that would race rpx for :80.
      webServer: 'rpx',
      // rpx already fronts :80/:443 on the shared box. This deploy only appends
      // this app's fragment and reloads the gateway. on-demand TLS lazily issues
      // a Let's Encrypt cert for everything.stacksjs.com on first HTTPS hit once
      // DNS resolves. `autoWww: false` — it's a subdomain, no www variant.
      proxy: {
        engine: 'rpx',
        onDemandTls: true,
        onDemandTlsEmail: 'hello@stacksjs.com',
        autoWww: false,
      },
    },
    // stacksjs.com is a Route53-hosted zone. With `provider` set, `cloud deploy`
    // reconciles an `everything.stacksjs.com` A record → the box IP after the
    // compute deploy (UPSERT-only; the S3/CloudFront path is skipped because the
    // site is deploy:'server'). Route53 creds come from the AWS profile
    // (AWS_PROFILE) at deploy time.
    dns: {
      provider: 'route53',
      domain: 'stacksjs.com',
      hostedZoneId: 'Z01455702Q7952O6RCY37',
    },
  },

  sites: {
    // server-static: built locally, shipped to /var/www/everything-main/current,
    // served by the shared rpx gateway's file_server. No `start`/`port`.
    main: {
      deploy: 'server',
      root: 'dist/inspector',
      domain: 'everything.stacksjs.com',
      // Rendered by pantry's own inspector (packages/inspector), which reads
      // this project's node_modules directly — every package the Stacks team
      // publishes, with what each one costs the install it lands in.
      //
      // The analyzer needs a pantry checkout, since the inspector is part of
      // that repo rather than a published package. PANTRY_PATH overrides the
      // default for anyone whose checkout is somewhere else.
      build: 'PATH="$PWD/pantry/.bin:$PATH" bun run build',
      // Static HTML, one directory per route — the gateway serves each
      // route's index.html, so no SPA fallback.
      spa: false,
    },
  },
}

export default config
