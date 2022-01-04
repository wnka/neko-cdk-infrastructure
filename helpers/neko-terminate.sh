#!/usr/bin/env bash
set -euo pipefail

NEKO_ID=`aws ec2 describe-instances \
  --filters="Name=instance-state-code,Values=16" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output=text`;
echo "NEKO_ID: $NEKO_ID"

aws ec2 terminate-instances --instance-ids $NEKO_ID
