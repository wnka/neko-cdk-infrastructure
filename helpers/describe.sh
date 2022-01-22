#!/usr/bin/env bash

aws ec2 describe-instances \
--filters="Name=tag-key,Values=application" \
--filters="Name=tag-value,Values=neko" \
--filters="Name=instance-state-code,Values=16" \
--query "Reservations[*].Instances[*].PublicIpAddress" \
--output=text
