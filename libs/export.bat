@echo off

REM Load environment variables from .env file
if exist "..\.env" (
    for /f "usebackq tokens=1,2 delims==" %%a in ("..\.env") do (
        REM Skip lines that start with # (comments) or are empty
        echo %%a | findstr /r "^#" >nul
        if errorlevel 1 (
            if not "%%a"=="" (
                set "%%a=%%b"
            )
        )
    )
) else (
    echo Warning: .env file not found. Using default values or environment variables.
)

REM Execute Ue4Export with environment variables
Ue4Export\Ue4Export.exe "%PAKS_FOLDER%" %UNREAL_VERSION% "%CONFIG_FILE%" "%EXPORT_FOLDER_PATH%" --key %AES_KEY%