@echo off
echo Compiling Java files...

set JAVA_FX="C:\javafx-sdk-21.0.6\lib"

cd /d "%~dp0"

if not exist out mkdir out

javac --module-path %JAVA_FX% --add-modules javafx.controls,javafx.fxml -d out src\app\*.java

if exist src\app\*.fxml xcopy /Y /Q src\app\*.fxml out\app\
if exist resources\*.css xcopy /Y /Q resources\*.css out\

echo Running Rock Paper Scissors...
java --module-path %JAVA_FX% --add-modules javafx.controls,javafx.fxml -cp out app.Main

pause
