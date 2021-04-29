#!/bin/bash
echo "Copying environment in dist..."
cp /home/ubuntu/environment/.env /home/ubuntu/polkalokr-migration-server/dist/
echo "Starting server screen..."
cd ~/polkalokr-migration-server/dist
screen -S server -d -m node main.js