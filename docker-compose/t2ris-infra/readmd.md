
certbot tls 발급
```bash
VOL_MOUNT_PATH=/home/ec2-user
DOMAIN=t2ris.duckdns.org
EMAIL=lsy969999@gmail.com

sudo docker run --rm \
  -v ${VOL_MOUNT_PATH}/t2ris-infra-docker-volume/certbot/www:/var/www/certbot \
  -v ${VOL_MOUNT_PATH}/t2ris-infra-docker-volume/certbot/conf:/etc/letsencrypt \
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
DOMAIN=t2ris.duckdns.org
EMAIL=lsy969999@gmail.com

sudo docker run --rm \
  -v ${VOL_MOUNT_PATH}/t2ris-infra-docker-volume/certbot/www:/var/www/certbot \
  -v ${VOL_MOUNT_PATH}/t2ris-infra-docker-volume/certbot/conf:/etc/letsencrypt \
  certbot/certbot renew \
  --webroot --webroot-path=/var/www/certbot
```

certbot tls 갱신 cron
```

```