!macro customUnInstall
  ${IfNot} ${isUpdated}
  ${AndIfNot} ${Silent}
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Erase all Steam Account Manager App data for this Windows user?$\r$\n$\r$\nThis permanently removes saved accounts, browser sessions, cookies, extension settings, and cached files. Close all account browsers first.$\r$\n$\r$\nChoose No to keep your data for a future installation." IDNO sam_keep_data
    nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$INSTDIR\resources\uninstall-data.ps1"'
    Pop $0
    Pop $1
    ${If} $0 != "0"
      MessageBox MB_OK|MB_ICONEXCLAMATION "Some app data could not be erased and has been kept. Close the app and all account browsers before removing the SteamAccountManagerApp folder in your roaming AppData.$\r$\n$\r$\n$1"
    ${EndIf}
    sam_keep_data:
  ${EndIf}
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\com.steamaccountmanager.bridge"
!macroend
