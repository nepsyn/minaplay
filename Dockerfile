FROM node:20-alpine

WORKDIR /app

ENV LANG="C.UTF-8" TZ=Asia/Shanghai

COPY packages/server/. /app/
COPY packages/web/. /web/

RUN set -ex \
    && apk add --no-cache bash tini openssl ffmpeg aria2 python3 py3-pip g++ make linux-headers \
    && yarn \
    && yarn global add @nestjs/cli \
    && yarn add sharp --ignore-engines \
    && yarn run build \
    && cd /web \
    && yarn \
    && yarn run build \
    && cd /app \
    && mv /web/dist public \
    && yarn cache clean \
    && apk del python3 py3-pip g++ make linux-headers \
    && rm -rf /web /root/.cache /tmp/*

COPY --chmod=755 entrypoint.sh /entrypoint.sh

ENTRYPOINT ["tini", "-g", "--", "/entrypoint.sh"]

EXPOSE 3000
VOLUME ["/app/data"]
