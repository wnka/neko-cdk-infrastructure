## What?

This is a [AWS CDK](https://aws.amazon.com/cdk/) infrastructure package that sets up the needed resources to launch an EC2 instance that runs [neko](https://github.com/m1k1o/neko), an easy and fun way to watch videos with your friends. I've used it a lot during the COVID-19 pandemic and it works really well!

## Features

1. Sets up the needed security groups and ingress rules.
2. Uses the latest Amazon Linux 2023 AMI and kernel, installs Docker and the latest Docker Compose plugin on boot, then launches the latest stable Neko v3 image from GHCR.
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

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk destroy`     destroy this stack
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
