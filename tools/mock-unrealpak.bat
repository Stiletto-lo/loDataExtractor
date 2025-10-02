@echo off
REM Mock UnrealPak tool for testing PAK extraction
REM This simulates the UnrealPak.exe behavior for development/testing

echo Mock UnrealPak v4.27.0
echo.

REM Check if arguments are provided
if "%~1"=="" (
    echo Usage: UnrealPak.exe ^<PakFilename^> [Options]
    echo.
    echo Options:
    echo   -Extract ^<Path^>     Extract PAK file to specified path
    echo   -List               List contents of PAK file
    echo   -Test               Test PAK file integrity
    echo   -AESKey=^<Key^>      AES encryption key for encrypted PAKs
    exit /b 1
)

REM Parse arguments - properly handle paths with spaces
set "pakfile=%~1"
set "extract_path="
set "aes_key="
set "list_mode=false"
set "test_mode=false"

REM Parse remaining arguments
:parse_args
if "%~2"=="" goto end_parse
if /i "%~2"=="-Extract" (
    set "extract_path=%~3"
    shift
    shift
    goto parse_args
)
if /i "%~2"=="-List" (
    set "list_mode=true"
    shift
    goto parse_args
)
if /i "%~2"=="-Test" (
    set "test_mode=true"
    shift
    goto parse_args
)
if "%~2:~0,8%"=="-AESKey=" (
    set "aes_key=%~2:~8%"
    shift
    goto parse_args
)
REM Skip unknown arguments
shift
goto parse_args

:end_parse

REM Check if PAK file exists (simulate)
if not exist "%pakfile%" (
    echo Error: PAK file "%pakfile%" not found
    exit /b 1
)

REM Simulate different operations
if "%list_mode%"=="true" (
    echo Listing contents of "%pakfile%":
    echo   Game/Content/Data/Items.uasset
    echo   Game/Content/Data/Creatures.uasset
    echo   Game/Content/Blueprints/Items/BP_Item_Base.uasset
    echo   Game/Content/Localization/Game/en/Game.locres
    echo.
    echo Total files: 4
    exit /b 0
)

if "%test_mode%"=="true" (
    echo Testing PAK file integrity...
    timeout /t 2 /nobreak >nul
    echo PAK file integrity check passed
    exit /b 0
)

if not "%extract_path%"=="" (
    echo Extracting "%pakfile%" to "%extract_path%"...
    
    REM Create extraction directory structure matching target directories
    if not exist "%extract_path%" mkdir "%extract_path%"
    if not exist "%extract_path%\Game" mkdir "%extract_path%\Game"
    if not exist "%extract_path%\Game\Content" mkdir "%extract_path%\Game\Content"
    if not exist "%extract_path%\Game\Content\Data" mkdir "%extract_path%\Game\Content\Data"
    if not exist "%extract_path%\Game\Content\Blueprints" mkdir "%extract_path%\Game\Content\Blueprints"
    if not exist "%extract_path%\Game\Content\Blueprints\Items" mkdir "%extract_path%\Game\Content\Blueprints\Items"
    if not exist "%extract_path%\Game\Content\Blueprints\Creatures" mkdir "%extract_path%\Game\Content\Blueprints\Creatures"
    if not exist "%extract_path%\Game\Content\Blueprints\Technologies" mkdir "%extract_path%\Game\Content\Blueprints\Technologies"
    if not exist "%extract_path%\Game\Content\Localization" mkdir "%extract_path%\Game\Content\Localization"
    
    REM Create some mock extracted files in target directories
    echo Mock item data > "%extract_path%\Game\Content\Data\Items.uasset"
    echo Mock creature data > "%extract_path%\Game\Content\Data\Creatures.uasset"
    echo Mock technology data > "%extract_path%\Game\Content\Data\Technologies.uasset"
    echo Mock item blueprint > "%extract_path%\Game\Content\Blueprints\Items\BP_Item_Base.uasset"
    echo Mock weapon blueprint > "%extract_path%\Game\Content\Blueprints\Items\BP_Weapon_Sword.uasset"
    echo Mock creature blueprint > "%extract_path%\Game\Content\Blueprints\Creatures\BP_Creature_Wolf.uasset"
    echo Mock tech blueprint > "%extract_path%\Game\Content\Blueprints\Technologies\BP_Tech_Crafting.uasset"
    echo Mock localization data > "%extract_path%\Game\Content\Localization\Game_en.locres"
    echo Mock localization data > "%extract_path%\Game\Content\Localization\Game_es.locres"
    
    REM Simulate extraction time
    timeout /t 1 /nobreak >nul
    
    echo Extraction completed successfully
    echo Extracted 9 files
    exit /b 0
)

echo No operation specified
exit /b 1