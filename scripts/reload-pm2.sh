#!/bin/bash
cd ~/polkalokr-migration-server/dist
pm2 startOrReload ecosystem.config.js 