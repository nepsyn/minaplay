#!/bin/bash
# shellcheck shell=bash

if [[ ! -e /app/.env ]]; then
    cp /app/.env.template /app/.env
fi

if [ -z "$APP_SECRET_KEY" ]; then
    export APP_SECRET_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

nohup aria2c --enable-rpc --rpc-allow-origin-all > aria2.log 2>&1 &
exec node dist/main
