@echo off
chcp 65001 >nul
title Git Push - Glicose AI

cd /d "c:\Glicose AI"

echo.
echo ================================================
echo   Git Push - Glicose AI
echo ================================================
echo.

if not exist ".git" (
    echo [1/6] Inicializando Git...
    git init
) else (
    echo [1/6] Git ja inicializado.
)
echo.

echo [2/6] Configurando usuario Git e remote origin...
git config user.email "leitekauan538@gmail.com"
git config user.name "kauankaka92"
echo       Usuario: kauankaka92 / leitekauan538@gmail.com
echo.
git remote remove origin 2>nul
git remote add origin https://kauankaka92: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@github.com/kauankaka92/Glicose-AI.git
echo       OK: https://github.com/kauankaka92/Glicose-AI.git
echo.

echo [3/6] Limpando indice Git...
git rm -r --cached . >nul 2>&1
echo       Indice limpo.
echo.

echo [4/6] Adicionando todos os arquivos...
git add .
echo       Todos os arquivos adicionados.
echo.

echo [5/6] Criando commit...
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set DATA=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set HORA=%%a:%%b
git commit -m "chore: sync completo %DATA% %HORA%"
echo.

echo [6/6] Enviando para GitHub...
git branch -M main
git push -u origin main --force

echo.
if %errorlevel% == 0 (
    echo ================================================
    echo   Push realizado com sucesso!
    echo   https://github.com/kauankaka92/Glicose-AI
    echo ================================================
) else (
    echo ================================================
    echo   ERRO no push. Verifique:
    echo   - Credenciais do GitHub
    echo   - Conexao com a internet
    echo   - Se o repositorio existe no GitHub
    echo ================================================
)

echo.
pause
