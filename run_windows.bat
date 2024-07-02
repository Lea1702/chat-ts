@echo off
setlocal

:: Prompt the user to enter the path to the Pulumi project
set /p PROJECT_PATH=Enter the path to your Pulumi project: 

:: Check if the entered path exists
if not exist "%PROJECT_PATH%" (
    echo The specified path does not exist. Exiting.
    exit /b 1
)

:: Configure AWS
aws configure

:: Navigate to the Pulumi project directory
cd /d "%PROJECT_PATH%"


:: Run Pulumi up to deploy the stack
pulumi up --yes

endlocal
pause