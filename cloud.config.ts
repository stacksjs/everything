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
      root: 'dist/__node-modules-inspector',
      domain: 'everything.stacksjs.com',
      // Rebuilds the inspector before packaging. `bun run` puts node_modules/.bin
      // on PATH, so node-modules-inspector resolves without a global install.
      //
      // node-modules-tools shells out to `<pm> root` to locate node_modules,
      // and every package-manager shim in .bin execs `node`. Without a real
      // node on PATH that call fails, resolveRoot silently falls back, and the
      // build emits an EMPTY graph (7KB payload, blank site) while still
      // reporting success. pantry/.bin comes from deps.yaml (bun + node), so
      // the toolchain is declared rather than assumed from the host.
      build: 'PATH="$PWD/pantry/.bin:$PATH" bun run build',
      // node-modules-inspector is a client-rendered Nuxt SPA — fall back to
      // index.html for deep links.
      spa: true,
    },
  },
}

export default config
