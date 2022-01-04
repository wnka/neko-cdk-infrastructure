#!/usr/bin/env bash

NEKO_IP=`aws ec2 describe-instances \
  --filters="Name=instance-state-code,Values=16" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output=text`;
echo "Opening: http://$NEKO_IP:8080"

# NOTE: this only works on Mac
open http://$NEKO_IP:8080
