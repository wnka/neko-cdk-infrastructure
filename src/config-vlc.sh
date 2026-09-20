#!/bin/bash
set -euo pipefail

mkdir -p /home/ec2-user/video
chown ec2-user:ec2-user /home/ec2-user/video

cat << EOF > /home/ec2-user/docker-compose.yaml
services:
  neko:
    image: "ghcr.io/m1k1o/neko/vlc:latest"
    pull_policy: "always"
    restart: "unless-stopped"
    shm_size: "2gb"
    volumes:
      - "/home/ec2-user/video:/video"
    ports:
      - "8080:8080"
      - "59000-59100:59000-59100/udp"
    environment:
      NEKO_DESKTOP_SCREEN: "1280x720@30"
      NEKO_MEMBER_MULTIUSER_USER_PASSWORD: "password"
      NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD: "adminpassword"
      NEKO_WEBRTC_EPR: "59000-59100"
EOF

chown ec2-user:ec2-user /home/ec2-user/docker-compose.yaml
dnf install -y docker
systemctl enable --now docker
usermod -a -G docker ec2-user

compose_os=$(uname -s | tr '[:upper:]' '[:lower:]')
compose_arch=$(uname -m)
install -d /usr/local/lib/docker/cli-plugins
curl --fail --location --show-error --silent \
  "https://github.com/docker/compose/releases/latest/download/docker-compose-${compose_os}-${compose_arch}" \
  --output /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

docker compose --file /home/ec2-user/docker-compose.yaml up --detach --pull always
