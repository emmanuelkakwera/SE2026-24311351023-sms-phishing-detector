@echo off
pushd "%~dp0android-app"
call gradlew.bat :app:testDebugUnitTest --tests "com.moneyguard.malawi.slices.VerticalSlicesTest"
set "EXIT_CODE=%0%"
popd
exit /b %%EXIT_CODE%%
