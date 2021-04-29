#!/bin/bash

echo "Validating server screen"
screen -ls | grep server
result=$?
if [ $result -eq 0 ]; then
echo "Server screen successfully running"
else
echo "Screen was not running because: $result"
echo "Trying to run again..."
cd ~/polkalokr-migration-server/dist
echo "Starting server screen..."
screen -S server -d -m node main.js
echo "started..."
fi
echo "Exiting..."
exit