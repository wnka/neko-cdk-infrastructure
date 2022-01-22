#!/usr/bin/env bash

NEKO_IP=`./neko-describe.sh`
echo "NEKO_IP: $NEKO_IP"

ssh -i ~/.ssh/nekonekocdk.pem -o IdentitiesOnly=yes ec2-user@$NEKO_IP
