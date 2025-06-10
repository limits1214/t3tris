aarch64-unknown-linux-gnu
t4g.nano
vcpu: 2
mem: 0.5

```
ssh -i "Ec2TetrisServer.pem" ec2-user@${PUBLIC_DNS}
```

```
sudo timedatectl set-timezone Asia/Seoul

sudo dnf install -y git
sudo dnf install -y nginx
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```


```
sudo systemctl start nginx
# sudo systemctl status nginx

```

```
server {
    listen 80;
    server_name _; # need specify your domain for ssl

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```


```
sudo nginx -t                # 설정 확인 (꼭)
sudo systemctl reload nginx  # 설정 반영
```


```
# domain
# limits1214-tetris.duckdns.org 
sudo dnf install -y certbot python3-certbot-nginx


sudo certbot --nginx -d limits1214-tetris.duckdns.org  -d www.limits1214-tetris.duckdns.org 


# Certificate is saved at: /etc/letsencrypt/live/limits1214-tetris.duckdns.org/fullchain.pem
# Key is saved at:         /etc/letsencrypt/live/limits1214-tetris.duckdns.org/privkey.pem
```



```
sudo dnf install -y redis-server
```


```
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

```
mkdir -p ~/redis-data
chmod 700 ~/redis-data       # (보통은 필요 없음, 확실하게 하려면)
sudo chown 999:999 ~/redis-data  # Redis 컨테이너가 내부에서 쓰기 가능하게
```

```
sudo docker run -d \
    --name redis-stack \
    -p 6379:6379 \
    -v "$HOME/redis-data:/data" \
    redis/redis-stack-server:latest
```