@echo off
title AI Study Companion Runner
echo ==========================================================
echo        AI STUDY COMPANION - 1-COMMAND RUNNER
echo ==========================================================
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"
pause
