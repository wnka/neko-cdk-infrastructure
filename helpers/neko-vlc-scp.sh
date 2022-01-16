#!/usr/bin/env bash

NEKO_IP=`aws ec2 describe-instances \
  --filters="Name=instance-state-code,Values=16" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output=text`;
echo "NEKO_IP: $NEKO_IP"

scp -i ~/.ssh/nekonekocdk.pem -o IdentitiesOnly=yes $* ec2-user@$NEKO_IP:video/
