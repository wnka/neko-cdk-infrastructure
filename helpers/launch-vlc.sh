#!/bin/bash

aws autoscaling set-desired-capacity --auto-scaling-group-name neko-vlc-asg --desired-capacity 1
