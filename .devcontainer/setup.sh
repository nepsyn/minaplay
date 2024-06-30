#!/bin/bash
pwd

# Install packages
sudo apt update
sudo apt install -y ffmpeg aria2

# Start aria2
nohup aria2c --enable-rpc --rpc-allow-origin-all > aria2.log 2>&1 &

#####################
# web project setup #
#####################
# Navigate to the web directory
cd ./packages/web
# setup
pnpm install
cp ../../.devcontainer/.env.dev.web .env

########################
# server project setup #
########################
# Navigate to the server directory
cd ../server
# setup
pnpm install
cp ../../.devcontainer/.env.dev.server .env
