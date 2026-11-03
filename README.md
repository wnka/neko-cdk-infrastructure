## What?

This is a [AWS CDK](https://aws.amazon.com/cdk/) infrastructure package that sets up the needed resources to launch an EC2 instance that runs [neko](https://github.com/m1k1o/neko), an easy and fun way to watch videos with your friends. I've used it a lot during the COVID-19 pandemic and it works really well!

## Features

1. Sets up the needed security groups and ingress rules.
2. Uses the latest Amazon Linux 2023 AMI and kernel, installs Docker plus a checksum-pinned
   Docker Compose release on boot, then launches a pinned Neko release (image tag + digest) from GHCR.
3. Creates 2 launch templates (one for Firefox, one for VLC) and two AutoScaling groups (ASGs) for spinning up instances.
4. Currently requests an `m7i-flex.2xlarge` with Spot pricing.

## How to use

See scripts in `helpers/` for help in launching/terminating instances.

1. Run `aws sso login --profile neko-admin` to authenticate.
2. Create a keypair named `nekonekocdk` in your account.
3. Tweak the `UserData` scripts in `src` to set the desired `NEKO_MEMBER_MULTIUSER_USER_PASSWORD` and `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD` values.
4. Do a `cdk deploy` to create or update the CloudFormation stack. The project defaults to the `neko-admin` profile in `us-west-2`.
5. Launch an instance by setting the Desired Capacity to 1 on the right ASG.
6. Open up `http://public-ip-of-instance:8080` and use the configured user or admin password to log in. See the [neko docs](https://neko.m1k1o.net/) for more info.
7. For VLC, `scp` your video files to `ec2-user@<ip>:video/`. Those files will show up in VLC under `/video`.
8. Terminate the instance by setting the Desired Capacity to 0 on the ASGs.
9. Run `cdk destroy` if you want to tear down the stack. Not necessary tho.

## Useful commands

 * `npm run build`   type-check the TypeScript (`tsc --noEmit`; nothing is emitted)
 * `npm run watch`   type-check on every change
 * `npm run test`    run the `node:test` unit tests via `tsx`
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk destroy`     destroy this stack
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## Dependencies

Two managers, and the boundary matters:

| What | Manager | Pinned by |
| --- | --- | --- |
| `aws-cdk-lib`, `constructs`, `aws-cdk` (CLI), `typescript`, `tsx`, `@types/node` | npm | `package-lock.json` |
| Node runtime (`pkgs.nodejs_24`, currently 24.20), npm, git, `typescript-language-server` | devenv/nixpkgs | `devenv.lock` |
| AWS CLI | neither (host install) | nothing |
| Neko image, Docker Compose binary, Docker, AL2023 AMI | resolved at instance boot / by `aws-cdk-lib` | `src/config-*.sh` |

Rules worth knowing:

1. **Bump `aws-cdk` and `aws-cdk-lib` together, always.** `aws-cdk-lib >= 2.274.0` writes
   cloud assembly schema `55.x`, which CDK CLI `< 2.1147.0` refuses to read. Both are pinned
   exactly in `package.json` so an accidental split fails at install time, not at deploy time.
2. **`minimatch`/`brace-expansion`/`yaml`/`semver` are vendored inside the `aws-cdk-lib`
   tarball** (`bundleDependencies`). `npm update` and `npm audit fix` cannot move them — the
   only lever is bumping `aws-cdk-lib` itself. `npm audit` currently reports the `minimatch`
   advisory as unfixable for exactly this reason.
3. **Node is a nix concern; `@types/node` is an npm concern; keep the majors aligned.**
   `package.json` declares `"engines": { "node": ">=24 <25" }` and `devenv.nix` pins
   `pkgs.nodejs_24`. If you change one, change the other in the same commit.
4. **After any CDK library bump, run `npx cdk flags --set --unconfigured --recommended`** to pick
   up new feature flags, then `cdk diff` before deploying.
5. **`devenv.lock` is not covered by Dependabot** (its `nix` ecosystem only reads `flake.lock`).
   Update it with `devenv update` and confirm `pkgs.nodejs_24` still resolves before merging.

Runtime images and binaries are pinned deliberately in `src/config-*.sh` (Neko tag + digest,
Docker Compose release + sha256). Bumping them changes the launch template version, so a
`cdk diff` will show replacement of the user data — that is expected.
