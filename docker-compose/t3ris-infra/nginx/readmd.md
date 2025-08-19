nginx.dev.conf:  http to https redirect x
nginx.prod.conf: http to https redirect o

compose up 하기전에 볼륨매핑한곳에 미리 두기

certbot tls 발급
```bash
VOL_MOUNT_PATH=/home/ec2-user
DOMAIN=t3tris.duckdns.org
EMAIL=lsy969999@gmail.com

sudo docker run --rm \
  -v ${VOL_MOUNT_PATH}/tetris-infra-docker-volume/certbot/www:/var/www/certbot \
  -v ${VOL_MOUNT_PATH}/tetris-infra-docker-volume/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --non-interactive
```

certbot tls 갱신
```
VOL_MOUNT_PATH=/home/ec2-user
DOMAIN=t3tris.duckdns.org
EMAIL=lsy969999@gmail.com

sudo docker run --rm \
  -v ${VOL_MOUNT_PATH}/tetris-infra-docker-volume/certbot/www:/var/www/certbot \
  -v ${VOL_MOUNT_PATH}/tetris-infra-docker-volume/certbot/conf:/etc/letsencrypt \
  certbot/certbot renew \
  --webroot --webroot-path=/var/www/certbot
```

certbot tls 갱신 cron
```

```