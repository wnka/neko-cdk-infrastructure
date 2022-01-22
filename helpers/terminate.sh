#!/usr/bin/env bash
set -euo pipefail

aws autoscaling set-desired-capacity --auto-scaling-group-name neko-firefox-asg --desired-capacity 0
aws autoscaling set-desired-capacity --auto-scaling-group-name neko-vlc-asg --desired-capacity 0
