@echo off
rem Éditeur local du portfolio : s'ouvre dans le navigateur, uniquement sur cet ordinateur.
cd /d "%~dp0"
start "" http://localhost:5310
node scripts\editeur\server.mjs
