## What?

This is a [AWS CDK](https://aws.amazon.com/cdk/) infrastructure package that sets up the needed resources to launch an EC2 instance that runs [neko](https://github.com/m1k1o/neko), an easy and fun way to watch videos with your friends. I've used it a lot during the COVID-19 pandemic and it works really well!

## Features

1. Sets up the needed security groups and ingress rules.
2. Uses the default Amazon Linux 2 AMI but installs `docker` and `docker-compose` on boot, then runs `docker-compose up` to fire up neko. 
3. Creates 2 launch templates (one for Firefox, one for VLC) that you can use with `aws ec2 run-instances --launch-template` to easily spin up a new instance.
4. Currently requests a `t3a.xlarge` with Spot pricing.

## How to use

See scripts in `helpers/` for help in launching/terminating instances.

1. Create a keypair named `nekonekocdk` in your account.
2. Tweak the `UserData` scripts in `src` to have the desired `NEKO_PASSWORD` and `NEKO_PASSWORD_ADMIN` values.
3. Do a `cdk deploy` to create the CloudFormation stack.
4. Launch an instance
5. Open up `http://public-ip-of-instance:8080` and use either `NEKO_PASSWORD` or `NEKO_PASSWORD_ADMIN` to login. See the [neko docs](https://neko.m1k1o.net/) for more info.
6. For VLC, `scp` your video files to `ec2-user@<ip>:video/`. Those files will show up in VLC under `/video`.
7. Terminate your instance when done.
8. Run `cdk destroy` if you want to tear down the stack. Not necessary tho.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk destroy`     destroy this stack
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
