#!/usr/bin/env bash

NEKO_IP=`./describe.sh`
echo "NEKO_IP: $NEKO_IP"

scp -i ~/.ssh/nekonekocdk.pem -o IdentitiesOnly=yes $* ec2-user@$NEKO_IP:video/
