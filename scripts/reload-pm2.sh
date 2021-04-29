#!/bin/bash
cd ~/polkalokr-migration-server/dist
echo "Starting server screen..."
screen -S server -d -m node main.js