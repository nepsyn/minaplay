FROM node:20-alpine

WORKDIR /app

ENV LANG="C.UTF-8" TZ=Asia/Shanghai

COPY packages/server/. /app/
COPY packages/web/. /web/

RUN set -ex \
    && apk add --no-cache bash tini openssl ffmpeg aria2 python3 py3-pip g++ make linux-headers \
    && npm install pnpm --global \
    && pnpm install \
    && pnpm run build \
    && cd /web \
    && pnpm install \
    && pnpm run build \
    && cd /app \
    && mv /web/dist public \
    && pnpm store prune \
    && apk del python3 py3-pip g++ make linux-headers \
    && rm -rf /web /root/.cache /tmp/*

COPY --chmod=755 entrypoint.sh /entrypoint.sh

ENTRYPOINT ["tini", "-g", "--", "/entrypoint.sh"]

EXPOSE 3000
VOLUME ["/app/data"]
