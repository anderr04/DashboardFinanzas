@echo off
title Dashboard Financiero

echo =========================================
echo    Arrancando tu Dashboard Financiero...
echo =========================================
echo.
echo 1. Abriendo tu navegador...
start http://localhost:3000

echo 2. Encendiendo el servidor local...
echo.
echo [IMPORTANTE] No cierres esta ventana negra mientras uses la aplicacion.
echo Cuando termines de usar el Dashboard, simplemente cierra esta ventana.
echo.

npm run dev
