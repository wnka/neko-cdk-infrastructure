import { test } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NekoInfraStack } from '../lib/neko-infra-stack';

test('creates current Neko launch templates', () => {
  const account = '111111111111';
  const region = 'us-west-2';
  const app = new App({
    context: {
      [`availability-zones:account=${account}:region=${region}`]: [
        `${region}a`,
        `${region}b`,
      ],
      [`vpc-provider:account=${account}:filter.isDefault=true:region=${region}:returnAsymmetricSubnets=true`]: {
        vpcId: 'vpc-12345678',
        vpcCidrBlock: '172.31.0.0/16',
        ownerAccountId: account,
        availabilityZones: [],
        subnetGroups: [],
      },
    },
  });
  const stack = new NekoInfraStack(app, 'TestStack', {
    env: { account, region },
  });
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::EC2::LaunchTemplate', 2);
  template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            Encrypted: false,
            VolumeSize: 8,
            VolumeType: 'gp3',
          },
        },
      ],
      InstanceType: 'm7i-flex.2xlarge',
    },
  });
  template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 2);
});
