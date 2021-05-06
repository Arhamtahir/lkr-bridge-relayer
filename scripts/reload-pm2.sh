#!/bin/bash
echo "Copying environment in dist..."
cp /home/ubuntu/environment/.env /home/ubuntu/polkalokr-migration-server/dist/
echo "Starting server screen..."
cd ~/polkalokr-migration-server/dist
screen -S server -d -m node main.js
result=$?
if [ $result -eq 0 ]
then
    echo "screen started..."
    screen -ls
else
    screen -S server -d -m node main.js && screen -ls
fi
