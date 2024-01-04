import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cdk from 'aws-cdk-lib';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';

export class NekoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Use default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true
    });

    const mySecurityGroup = new ec2.SecurityGroup(this, 'neko-cdg', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true   // Can be set to false
    });
    mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world');
    mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'allow http access from the world');
    mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udpRange(59000, 59100), 'websockets for neko');

    const role = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

    // Use Latest Amazon Linux Image
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    const userDataVlc = ec2.UserData.forLinux();

    // Create an asset that will be used as part of User Data to run on first load
    const asset_vlc = new Asset(this, 'Asset-VLC', { path: path.join(__dirname, '../src/config-vlc.sh') });
    asset_vlc.grantRead(role);

    const localPath_vlc = userDataVlc.addS3DownloadCommand({
      bucket: asset_vlc.bucket,
      bucketKey: asset_vlc.s3ObjectKey,
    });

    userDataVlc.addExecuteFileCommand({
      filePath: localPath_vlc,
      arguments: '--verbose -y'
    });

    const launchTemplateVlc = new ec2.LaunchTemplate(this, 'NekoLaunchTemplate-VLC', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M7I_FLEX, ec2.InstanceSize.XLARGE2),
      machineImage: ami,
      securityGroup: mySecurityGroup,
      keyName: "nekonekocdk",
      role: role,
      userData: userDataVlc,
      spotOptions: {requestType: ec2.SpotRequestType.ONE_TIME},
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: false,
          })
        }
      ]
    });

    const autoscalingVlc = new autoscaling.CfnAutoScalingGroup(this, 'asg-vlc', {
      maxSize: '1',
      minSize: '0',
      desiredCapacity: '0',
      availabilityZones: cdk.Stack.of(this).availabilityZones,
      autoScalingGroupName: 'neko-vlc-asg',
      launchTemplate: {
        version: launchTemplateVlc.latestVersionNumber,
        launchTemplateId: launchTemplateVlc.launchTemplateId
      },
      tags: [{
        key: 'application',
        propagateAtLaunch: true,
        value: 'neko',
      }]
    });

    const userDataFirefox = ec2.UserData.forLinux();

    // Create an asset that will be used as part of User Data to run on first load
    const asset_firefox = new Asset(this, 'Asset-Firefox', { path: path.join(__dirname, '../src/config-firefox.sh') });
    asset_firefox.grantRead(role);

    const localPath_firefox = userDataFirefox.addS3DownloadCommand({
      bucket: asset_firefox.bucket,
      bucketKey: asset_firefox.s3ObjectKey,
    });

    userDataFirefox.addExecuteFileCommand({
      filePath: localPath_firefox,
      arguments: '--verbose -y'
    });

    const launchTemplateFirefox = new ec2.LaunchTemplate(this, 'NekoLaunchTemplate-Firefox', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M7I_FLEX, ec2.InstanceSize.XLARGE2),
      machineImage: ami,
      securityGroup: mySecurityGroup,
      keyName: "nekonekocdk",
      role: role,
      userData: userDataFirefox,
      spotOptions: {requestType: ec2.SpotRequestType.ONE_TIME},
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: false,
          })
        }
      ]
    });

    const autoscalingFirefox = new autoscaling.CfnAutoScalingGroup(this, 'asg-firefox', {
      maxSize: '1',
      minSize: '0',
      desiredCapacity: '0',
      availabilityZones: cdk.Stack.of(this).availabilityZones,
      autoScalingGroupName: 'neko-firefox-asg',
      launchTemplate: {
        version: launchTemplateFirefox.latestVersionNumber,
        launchTemplateId: launchTemplateFirefox.launchTemplateId
      },
      tags: [{
        key: 'application',
        propagateAtLaunch: true,
        value: 'neko',
      }]
    });

    const user = new iam.User(this, 'neko-user', {
      userName: 'neko-user',
    });

    // create a policy that has minimal creds for using neko
    const nekoUserPolicy = new iam.Policy(this, 'neko-helper-policy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['autoscaling:SetDesiredCapacity'],
          resources: ['*'],
          conditions: {
                "StringEquals": {"autoscaling:ResourceTag/application": "neko"}
          }
        }),
        new iam.PolicyStatement({
          actions: ["ec2:DescribeInstances"],
          resources: ['*'],
        })
      ],
    });
    user.attachInlinePolicy(nekoUserPolicy);

    new cdk.CfnOutput(this, 'VLC AutoScalingGroup', { value: 'aws autoscaling set-desired-capacity --auto-scaling-group-name ' + autoscalingVlc.autoScalingGroupName! + ' --desired-capacity 1' })
    new cdk.CfnOutput(this, 'Firefox AutoScalingGroup', { value: 'aws autoscaling set-desired-capacity --auto-scaling-group-name ' + autoscalingFirefox.autoScalingGroupName! + ' --desired-capacity 1' })
  }
}
