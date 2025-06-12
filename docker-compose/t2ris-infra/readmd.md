
certbot tls 발급
```
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/lib/letsencrypt \
  -d t2ris.duckdns.org \
  --email lsy969999@gmail.com \
  --agree-tos \
  --non-interactive
```

certbot tls 갱신
```
docker compose run --rm certbot renew --webroot-path=/var/lib/letsencrypt
docker compose exec nginx nginx -s reload


nginx -T # 전체 적용된 설정파일 확인
```

certbot tls 갱신 cron
```

```