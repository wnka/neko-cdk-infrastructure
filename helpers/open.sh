#!/usr/bin/env bash

NEKO_IP=`./describe.sh`
echo "Opening: http://$NEKO_IP:8080"

# NOTE: this only works on Mac
open http://$NEKO_IP:8080
