#!/usr/bin/env bash
# Run as the desktop user. AppImage deletion has no OS uninstall hook, so use:
# bash uninstall-linux.sh --appimage /absolute/path/to/the.AppImage
set -euo pipefail

sam_message() {
  if [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v zenity >/dev/null; then
    zenity --info --title='Steam Account Manager App' --text="$1" || true
  else
    printf '%s\n' "$1" >&2
  fi
}

sam_confirm() {
  if [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v zenity >/dev/null; then
    zenity --question --default-cancel --title='Steam Account Manager App' \
      --ok-label='Erase data' --cancel-label='Keep data' --text="$1"
  elif [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v kdialog >/dev/null; then
    kdialog --defaultno --yesno "$1" --title 'Steam Account Manager App'
  elif [[ -t 0 ]]; then
    printf '%s\nType ERASE to erase data, or press Enter to keep it: ' "$1" >&2
    local answer
    IFS= read -r answer && [[ "$answer" == ERASE ]]
  else
    printf '%s\n' 'No interactive prompt is available; app data has been kept.' >&2
    return 1
  fi
}

sam_remove_data() {
  local base data normalized process arg busy=0
  base="${XDG_CONFIG_HOME:-${HOME:?}/.config}"
  [[ "$base" == /* && "$base" != / ]] || { sam_message 'Invalid config path; data kept.'; return 1; }
  base="$(realpath -m -- "$base")"
  [[ "$base" != / ]] || return 1
  data="$base/SteamAccountManagerApp"
  [[ -e "$data" || -L "$data" ]] || return 0
  normalized="$(realpath -m -- "$data")"
  [[ "$normalized" == "$data" && ! -L "$data" && -d "$data" && -O "$data" ]] || {
    sam_message 'Linked or non-owned app data has been kept.'; return 1;
  }
  sam_confirm "Erase all Steam Account Manager App data for $(id -un)?

This permanently removes accounts, browser sessions, cookies, extension settings, and cached files in:
$data

Close the app and all account browsers first. Keep data to use it after reinstalling." || return 0
  # Do not kill browsers or erase a profile still in use.
  for process in /proc/[0-9]*/cmdline; do
    [[ -r "$process" && -O "$process" && "$process" != "/proc/$$/cmdline" ]] || continue
    while IFS= read -r -d '' arg; do
      case "$arg" in
        --user-data-dir="$data"|--user-data-dir="$data"/*|*/steam-account-manager-app) busy=1 ;;
      esac
    done < "$process" 2>/dev/null || true
  done
  [[ "$busy" == 0 ]] || { sam_message 'Close the app and its account browsers first. Data kept.'; return 1; }
  # Check the final absolute target immediately before removal. rm does not follow
  # symlinks inside this directory; --one-file-system preserves mounted volumes.
  [[ "$(realpath -m -- "$data")" == "$base/SteamAccountManagerApp" && ! -L "$data" ]] || return 1
  rm -rf --one-file-system -- "$data"
  [[ ! -e "$data" ]] || { sam_message 'Some app data could not be erased.'; return 1; }
  local manifest="$base/chromium/NativeMessagingHosts/com.steamaccountmanager.bridge.json"
  if [[ -f "$manifest" && ! -L "$manifest" && -O "$manifest" ]]; then
    rm -f -- "$manifest"
  fi
  sam_message 'Steam Account Manager App data erased.'
}

sam_uninstall() {
  case "${1:---data-only}" in
    --data-only) sam_remove_data ;;
    --appimage)
      local appimage="${2:-}"
      [[ "$appimage" == /* && "$appimage" == *.AppImage && -f "$appimage" && ! -L "$appimage" && -O "$appimage" ]] || {
        sam_message 'Supply the absolute path to your Steam Account Manager App .AppImage file.'; return 1;
      }
      sam_remove_data || return
      rm -f -- "$appimage"
      sam_message 'AppImage removed.'
      ;;
    *) printf '%s\n' 'Usage: bash uninstall-linux.sh [--data-only | --appimage /path/to/app.AppImage]' >&2; return 2 ;;
  esac
}

if [[ "${BASH_SOURCE[0]:-}" == "$0" ]]; then
  sam_uninstall "$@"
fi
