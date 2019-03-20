#!/bin/bash

cat << EOT

            _    _____ _  __
           / \  | ____| |/ _|
          / _ \ |  _| | | |_
         / ___ \| |___| |  _|
        /_/   \_\_____|_|_|

EOT

#当变量a为null或为空字符串时则var=b
start_mode=${1:-'start'}
echo ${start_mode}

if [ ${start_mode} = 'stop' ]
then
    pm2 stop aelf-web-proxy
elif [ ${start_mode} = 'restart' ]
then
    pm2 restart aelf-web-proxy
else 
    pm2 start index.js --name aelf-web-proxy
fi