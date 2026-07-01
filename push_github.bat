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
    echo [1/6] Inicializando repositório Git...
    git init
) else (
    echo [1/6] Repositório Git já inicializado.
)
echo.

:: Configura o remote origin
echo [2/6] Configurando remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/pcdosilva01-spec/Glicose-AI.git
echo       Remote: https://github.com/pcdosilva01-spec/Glicose-AI.git
echo.

:: Remove TUDO do índice git (limpa o que estava antes)
echo [3/6] Limpando índice Git...
git rm -r --cached . >nul 2>&1
echo       Índice limpo.
echo.

:: Adiciona TUDO da pasta atual do zero
echo [4/6] Adicionando todos os arquivos...
git add .
echo       Todos os arquivos adicionados.
echo.

:: Commit com timestamp
echo [5/6] Criando commit...
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set DATA=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set HORA=%%a:%%b
git commit -m "chore: sync completo %DATA% %HORA%"
echo.

:: Force push para main (substitui tudo no remoto)
echo [6/6] Enviando para GitHub ^(branch main^)...
git branch -M main
git push -u origin main --force

echo.
if %errorlevel% == 0 (
    echo ================================================
    echo   Push realizado com sucesso!
    echo   https://github.com/pcdosilva01-spec/Glicose-AI
    echo ================================================
) else (
    echo ================================================
    echo   ERRO no push. Verifique:
    echo   - Credenciais do GitHub ^(use Personal Access Token^)
    echo   - Conexao com a internet
    echo   - Se o repositorio existe no GitHub
    echo ================================================
)

echo.
pause
