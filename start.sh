#!/bin/bash

if [ -z "$1" ];then
  OFFSET=0
else
  OFFSET=$1
fi

let "SPORT = 3000 + $OFFSET"
PATH=$PATH:/home/sfxuser01/opt/node/current/bin:/home/sfxuser01/opt/yarn/current/bin
export PORT=$SPORT && /home/sfxuser01/.config/yarn/global/node_modules/sfx-resolve/server.js
