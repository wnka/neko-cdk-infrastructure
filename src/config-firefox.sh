#!/bin/bash
set -euo pipefail

mkdir -p /home/ec2-user/video
chown ec2-user:ec2-user /home/ec2-user/video

cat << EOF > /home/ec2-user/docker-compose.yaml
services:
  neko:
    image: "ghcr.io/m1k1o/neko/firefox:3.2.0@sha256:415730ef9e3c35d850fdbbb95aa150cb9eda0b9c260c61d1974fb3af39cb71c3"
    pull_policy: "always"
    restart: "unless-stopped"
    shm_size: "2gb"
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
compose_asset="docker-compose-${compose_os}-${compose_arch}"
# Docker Compose is pinned (with checksum) so an instance launch never pulls an
# unreviewed binary. Bump deliberately: change COMPOSE_VERSION, then read the new
# digest from https://github.com/docker/compose/releases/download/<version>/<asset>.sha256
COMPOSE_VERSION="v5.7.0"
COMPOSE_SHA256="7758048ad38e580f22559603312874fec8bb638d021a9e64182385fc17cc12a2"
install -d /usr/local/lib/docker/cli-plugins
curl --fail --location --show-error --silent \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/${compose_asset}" \
  --output "/tmp/${compose_asset}"
echo "${COMPOSE_SHA256}  /tmp/${compose_asset}" | sha256sum --check
install -m 0755 "/tmp/${compose_asset}" /usr/local/lib/docker/cli-plugins/docker-compose
rm -f "/tmp/${compose_asset}"

docker compose --file /home/ec2-user/docker-compose.yaml up --detach --pull always
