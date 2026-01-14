#!/bin/bash
# Script de lancement manuel OTEA Server (Linux)
cd "$(dirname "$0")/../.."
npm install
node js/server.js
