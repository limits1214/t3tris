# --- 1단계: 빌드 단계 ---
FROM node:22-slim AS builder

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 및 빌드

COPY . .
RUN npm run build

# --- 2단계: 프로덕션 실행 이미지 --- # 50mb
FROM nginx:alpine
WORKDIR /app

# 정적 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 3000으로 리스닝하는 nginx.conf 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 외부 노출 포트
EXPOSE 3000

# --- 2단계: 프로덕션 실행 이미지 --- # 170mb
# FROM node:22-alpine

# WORKDIR /app

# # serve 설치 (정적 파일 서버)
# RUN npm install -g serve

# # 빌드 결과물만 복사
# COPY --from=builder /app/dist ./dist

# # 기본 serve 포트
# EXPOSE 3000

# # serve -s dist -l 3000 으로 정적 서버 실행
# CMD ["serve", "-s", "dist", "-l", "3000"]