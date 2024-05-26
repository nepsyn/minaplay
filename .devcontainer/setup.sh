#!/bin/bash
pwd
#####################
# web project setup #
#####################
# Navigate to the web directory
cd ./packages/web
# setup
yarn install
cp ../../.devcontainer/.env.dev.web .env

########################
# server project setup #
########################
# Navigate to the server directory
cd ../server
# setup
yarn
yarn add sharp --ignore-engines
yarn global add @nestjs/cli
cp ../../.devcontainer/.env.dev.server .env
