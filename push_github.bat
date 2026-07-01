@echo off
chcp 65001 >nul
title Git Push — Glicose AI

cd /d "c:\Glicose AI"

echo.
echo ================================================
echo   Git Push ^> Glicose AI
echo ================================================
echo.

:: Inicializa o repositório se ainda não existir
if not exist ".git" (
    echo [1/5] Inicializando repositório Git...
    git init
    echo.
) else (
    echo [1/5] Repositório Git já inicializado.
    echo.
)

:: Configura o remote origin
echo [2/5] Configurando remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/pcdosilva01-spec/Glicose-AI.git
echo       Remote: https://github.com/pcdosilva01-spec/Glicose-AI.git
echo.

:: Adiciona todos os arquivos
echo [3/5] Adicionando arquivos...
git add .
echo       Todos os arquivos adicionados.
echo.

:: Commit com timestamp
echo [4/5] Criando commit...
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set DATA=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set HORA=%%a:%%b
git commit -m "chore: push automatico %DATA% %HORA%" 2>nul || (
    echo       Nenhuma alteracao para commitar.
)
echo.

:: Push para main
echo [5/5] Enviando para GitHub ^(branch main^)...
git branch -M main
git push -u origin main

echo.
if %errorlevel% == 0 (
    echo ================================================
    echo   Push realizado com sucesso!
    echo   https://github.com/pcdosilva01-spec/Glicose-AI
    echo ================================================
) else (
    echo ================================================
    echo   ERRO no push. Verifique:
    echo   - Credenciais do GitHub configuradas
    echo   - Conexao com a internet
    echo   - Se o repositorio existe no GitHub
    echo ================================================
)

echo.
pause
