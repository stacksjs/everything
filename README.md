# @stacksjs/everything

Every actively maintained npm package by the Stacks community.

It visualizes the dependencies of the packages with [node-modules-inspector](https://github.com/antfu/node-modules-inspector). The live site is deployed at [`everything.stacksjs.com`](https://everything.stacksjs.com/).

## Development

```bash
pnpm install          # install every listed Stacks package
pnpm dev              # run the inspector locally
pnpm build            # build the static site → dist/__node-modules-inspector
```

## Deployment

Deployed to the shared Stacks Hetzner box via [`ts-cloud`](https://github.com/stacksjs/ts-cloud) as a static site behind the `rpx` gateway. Config lives in [`cloud.config.ts`](./cloud.config.ts); it attaches to the `stacks` project's server and serves the built inspector at `everything.stacksjs.com`.

```bash
# needs HCLOUD_TOKEN + AWS creds (Route53) in the environment
pnpm deploy           # build → ship to /var/www/everything-main → reload rpx → reconcile DNS
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/stacksjs/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/stacksjs/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [Stacks.js](https://github.com/stacksjs)
