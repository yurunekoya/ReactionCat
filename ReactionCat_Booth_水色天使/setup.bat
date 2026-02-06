@echo off
chcp 65001 > nul
title ReactionCat - 初回セットアップ

echo.
echo   ╭─────────────────────────────────────╮
echo   │   🐱 ReactionCat 初回セットアップ   │
echo   ╰─────────────────────────────────────╯
echo.

:: Node.jsの確認
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo   ✅ Node.js は既にインストールされています
    echo.
    echo   start.bat をダブルクリックして起動してください
    echo.
    pause
    exit /b 0
)

echo   📦 Node.js がインストールされていません
echo.
echo   Node.js を自動でダウンロード＆インストールします
echo.
echo   ※ インストールには管理者権限が必要です
echo   ※ ウイルス対策ソフトの警告が出る場合があります
echo.
echo   続行するには何かキーを押してください...
echo   （中止する場合はウィンドウを閉じてください）
pause > nul

echo.
echo   ダウンロード中...
echo.

:: ダウンロード先
set "INSTALLER=%TEMP%\node_setup.msi"
set "NODE_URL=https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"

:: PowerShellでダウンロード
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%INSTALLER%'}" 2>nul

if not exist "%INSTALLER%" (
    echo.
    echo   ❌ ダウンロードに失敗しました
    echo.
    echo   ウイルス対策ソフトにブロックされた可能性があります。
    echo   手動でNode.jsをインストールしてください:
    echo.
    echo   1. 以下のURLをブラウザで開く
    echo      https://nodejs.org/
    echo.
    echo   2. LTS版（推奨版）をダウンロード
    echo.
    echo   3. ダウンロードしたファイルを実行してインストール
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)

echo   インストール中...
echo.
echo   ※ インストーラーが開きます
echo   ※ 画面の指示に従ってインストールを完了してください
echo.

:: インストーラーを実行
start /wait msiexec /i "%INSTALLER%" /passive

:: インストーラーを削除
del "%INSTALLER%" 2>nul

:: 再確認
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo   ╭─────────────────────────────────────╮
    echo   │  ✅ Node.js インストール完了！       │
    echo   ╰─────────────────────────────────────╯
    echo.
    echo   セットアップが完了しました！
    echo.
    echo   次のステップ:
    echo   1. このウィンドウを閉じる
    echo   2. start.bat をダブルクリック
    echo.
) else (
    echo.
    echo   ⚠️ インストールを確認できませんでした
    echo.
    echo   PCを再起動してから start.bat を実行してください
    echo.
)

pause
