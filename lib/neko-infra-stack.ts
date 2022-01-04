import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
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

    // Use Latest Amazon Linux Image - CPU Type ARM64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
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
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.XLARGE),
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
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.XLARGE),
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

    new cdk.CfnOutput(this, 'VLC launch command', { value: 'aws ec2 run-instances --launch-template LaunchTemplateId=' + launchTemplateVlc.launchTemplateId + ',Version=' + launchTemplateVlc.latestVersionNumber + ' --profile <your profile>' })
    new cdk.CfnOutput(this, 'Firefox launch command', { value: 'aws ec2 run-instances --launch-template LaunchTemplateId=' + launchTemplateFirefox.launchTemplateId + ',Version=' + launchTemplateFirefox.latestVersionNumber + ' --profile <your profile>' })
  }
}
