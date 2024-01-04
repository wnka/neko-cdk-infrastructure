#!/bin/bash
mkdir /home/ec2-user/video
chown ec2-user /home/ec2-user/video
cat << EOF > /home/ec2-user/docker-compose.yaml
version: "3.4"
services:
  neko:
    image: "m1k1o/neko:vlc"
    restart: "unless-stopped"
    shm_size: "2gb"
    volumes:
      - "/home/ec2-user/video:/video"
    ports:
      - "8080:8080"
      - "59000-59100:59000-59100/udp"
    cap_add:
      - SYS_ADMIN
    environment:
      NEKO_SCREEN: '1280x720@30'
      NEKO_PASSWORD: password
      NEKO_PASSWORD_ADMIN: adminpassword
      NEKO_EPR: 59000-59100
EOF
chown ec2-user /home/ec2-user/docker-compose.yaml
yum install -y docker
service docker start
usermod -a -G docker ec2-user
chmod 666 /var/run/docker.sock
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
cd /home/ec2-user
/usr/local/bin/docker-compose up &
