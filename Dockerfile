FROM node:20-slim

WORKDIR /app

# 依存だけ先に入れてレイヤキャッシュを効かせる
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# アプリ本体（src/schema/input は compose でマウントもする）
COPY . .

# 既定は生成。compose の command で上書き可能
CMD ["npm", "run", "generate"]
