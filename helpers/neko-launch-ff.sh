#!/bin/bash

aws autoscaling set-desired-capacity --auto-scaling-group-name neko-firefox-asg --desired-capacity 1
