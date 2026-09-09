@echo off
REM Native messaging hosts must be a directly executable file -- Chromium
REM cannot exec a bare .js file on Windows. This wrapper is a placeholder
REM for local development only (it assumes Node.js is on PATH). The
REM packaged release build must NOT ship this wrapper as-is, because the
REM product spec (section 11) requires no separate Node.js install. For
REM packaging, compile native-bridge/host.js into a standalone executable
REM (e.g. with @yao-pkg/pkg) and point the generated host manifest's
REM "path" at that .exe directly instead of at this .bat file.
node "%~dp0host.js" %*
