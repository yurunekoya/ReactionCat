@echo off
chcp 65001 > nul
title ReactionCat

echo.
echo   ╭─────────────────────────────────────╮
echo   │         🐱 ReactionCat 🐱          │
echo   │    YouTube Live Reaction Tool       │
echo   ╰─────────────────────────────────────╯
echo.

:: Node.jsの確認
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   ❌ Node.js がインストールされていません
    echo.
    echo   setup.bat を実行してセットアップを完了してください
    echo.
    pause
    exit /b 1
)

:: 初回実行時のみ npm install
if not exist "node_modules" (
    echo   📦 初回セットアップ中...
    echo.
    npm install --silent
    echo.
)

:: メイン実行
node injector.js

pause
