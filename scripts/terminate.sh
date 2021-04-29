#!/bin/bash
echo "Terminating server screen"
screen -S server -X quit
result=$?
if [ $result -eq 0 ]; then
echo "Terminated server screen successfully"
else
echo "Screen was not terminated because: $result"
fi
echo "Exiting..."
exit