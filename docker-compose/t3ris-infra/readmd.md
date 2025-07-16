aarch64-unknown-linux-gnu
t4g.nano
vcpu: 2
mem: 0.5

```
sudo timedatectl set-timezone Asia/Seoul
sudo dnf install -y git

sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
# docker compose 설치
# https://docs.docker.com/compose/install/linux/#install-the-plugin-manually
# x86_64 가아니라 arm에 맞게 docker-compose-linux-aarch64
```