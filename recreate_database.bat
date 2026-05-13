@echo off
echo ========================================
echo DESTROYING AND RECREATING DATABASE
echo ========================================
echo.

echo Step 1: Stopping containers...
docker-compose down

echo.
echo Step 2: Removing volume (this will delete all data)...
docker volume rm timali_postgres_data

echo.
echo Step 3: Starting fresh database...
docker-compose up -d postgres

echo.
echo Step 4: Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Step 5: Checking database status...
docker-compose ps

echo.
echo ========================================
echo DATABASE RECREATED SUCCESSFULLY!
echo ========================================
echo.
echo Database: timali_db
echo User: timali_user
echo Password: timali_password
echo Port: 5433
echo.
echo Adminer (DB Interface): http://localhost:8888
echo.
echo Now restart your Grails application!
echo ========================================
pause
