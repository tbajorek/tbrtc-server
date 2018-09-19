#!/usr/bin/env bash

yarn add $1 --dev &&
echo "Installed" &&
npm link tbrtc-common &&
echo "Linked" &&
yarn build &&
echo "Done"