@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

set "GIT_USER_NAME=NeoRic"
set "GIT_USER_EMAIL=richardzengys@gmail.com"

echo ==========================================
echo Spirit Weaver - Git Quick Push
echo ==========================================
echo Current branch:
git branch --show-current
echo.

set /p "COMMIT_MSG=Enter commit message: "
if "%COMMIT_MSG%"=="" (
  echo Commit message cannot be empty.
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo Current folder is not a git repository.
  pause
  exit /b 1
)

echo.
echo [1/4] Staging changes...
git add -A
if errorlevel 1 (
  echo Failed to stage changes.
  pause
  exit /b 1
)

git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo [2/4] Creating commit...
  git -c user.name="%GIT_USER_NAME%" -c user.email="%GIT_USER_EMAIL%" commit -m "%COMMIT_MSG%"
  if errorlevel 1 (
    echo Commit failed.
    pause
    exit /b 1
  )
) else (
  echo No changes to commit.
  pause
  exit /b 0
)

echo.
echo [3/4] Pushing to remote...
git push
if errorlevel 1 (
  echo Push failed. Check network/login or remote settings.
  pause
  exit /b 1
)

echo.
echo [4/4] Done.
git status --short --branch
echo.
echo Success.
pause
