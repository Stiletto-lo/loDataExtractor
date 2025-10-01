@echo off
REM Mock FModel tool for testing PAK extraction
REM This simulates the FModel.exe behavior for development/testing

echo Mock FModel v4.2.0
echo.

REM Check if arguments are provided
if "%~1"=="" (
    echo Usage: FModel.exe [Options]
    echo.
    echo Options:
    echo   --paksdir ^<Path^>        Directory containing PAK files
    echo   --output ^<Path^>         Output directory for extracted files
    echo   --aeskey ^<Key^>          AES encryption key
    echo   --game ^<GameName^>       Game name (e.g., LastOasis)
    echo   --export                 Export assets
    echo   --bulk                   Bulk export mode
    exit /b 1
)

REM Parse arguments
set "paks_dir="
set "output_dir="
set "aes_key="
set "game_name="
set "export_mode=false"
set "bulk_mode=false"

:parse_args
if "%~1"=="" goto end_parse
if /i "%~1"=="--paksdir" (
    shift
    set "paks_dir=%~1"
    shift
    goto parse_args
)
if /i "%~1"=="--output" (
    shift
    set "output_dir=%~1"
    shift
    goto parse_args
)
if /i "%~1"=="--aeskey" (
    shift
    set "aes_key=%~1"
    shift
    goto parse_args
)
if /i "%~1"=="--game" (
    shift
    set "game_name=%~1"
    shift
    goto parse_args
)
if /i "%~1"=="--export" (
    set "export_mode=true"
    shift
    goto parse_args
)
if /i "%~1"=="--bulk" (
    set "bulk_mode=true"
    shift
    goto parse_args
)
shift
goto parse_args

:end_parse

REM Validate required parameters
if "%paks_dir%"=="" (
    echo Error: --paksdir parameter is required
    exit /b 1
)

if "%output_dir%"=="" (
    echo Error: --output parameter is required
    exit /b 1
)

REM Check if PAKs directory exists
if not exist "%paks_dir%" (
    echo Error: PAKs directory '%paks_dir%' not found
    exit /b 1
)

echo Loading PAK files from: %paks_dir%
echo Output directory: %output_dir%
if not "%aes_key%"=="" echo AES Key: %aes_key:~0,8%********
if not "%game_name%"=="" echo Game: %game_name%
echo.

REM Create output directory structure
if not exist "%output_dir%" mkdir "%output_dir%"
if not exist "%output_dir%\Game" mkdir "%output_dir%\Game"
if not exist "%output_dir%\Game\Content" mkdir "%output_dir%\Game\Content"
if not exist "%output_dir%\Game\Content\Data" mkdir "%output_dir%\Game\Content\Data"
if not exist "%output_dir%\Game\Content\Blueprints" mkdir "%output_dir%\Game\Content\Blueprints"
if not exist "%output_dir%\Game\Content\Blueprints\Items" mkdir "%output_dir%\Game\Content\Blueprints\Items"
if not exist "%output_dir%\Game\Content\Blueprints\Creatures" mkdir "%output_dir%\Game\Content\Blueprints\Creatures"
if not exist "%output_dir%\Game\Content\Localization" mkdir "%output_dir%\Game\Content\Localization"

echo Scanning PAK files...
timeout /t 1 /nobreak >nul

echo Found PAK files:
echo   LastOasis-WindowsNoEditor.pak (2.1 GB)
echo   LastOasis-WindowsNoEditor_0_P.pak (156 MB)
echo.

if "%export_mode%"=="true" (
    echo Starting export process...
    timeout /t 2 /nobreak >nul
    
    REM Create mock exported files
    echo Mock FModel exported data > "%output_dir%\Game\Content\Data\DT_Items.json"
    echo Mock FModel exported data > "%output_dir%\Game\Content\Data\DT_Creatures.json"
    echo Mock FModel exported data > "%output_dir%\Game\Content\Data\DT_Technologies.json"
    echo Mock FModel exported data > "%output_dir%\Game\Content\Blueprints\Items\BP_Item_Base.json"
    echo Mock FModel exported data > "%output_dir%\Game\Content\Blueprints\Creatures\BP_Creature_Base.json"
    echo Mock FModel exported data > "%output_dir%\Game\Content\Localization\Game_en.json"
    
    echo.
    echo Export completed successfully!
    echo Exported 6 assets
    echo Total processing time: 3.2 seconds
) else (
    echo Use --export flag to export assets
)

exit /b 0