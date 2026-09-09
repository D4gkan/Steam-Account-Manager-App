// Keep electron-builder's normal symlink/AppArmor cleanup and append our prompt.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const builder = path.dirname(require.resolve('app-builder-lib/package.json'));
const defaults = fs.readFileSync(path.join(builder, 'templates/linux/after-remove.tpl'), 'utf8');
const helper = fs.readFileSync(path.join(__dirname, 'uninstall-linux.sh'), 'utf8');
const hook = `
# Updates must never erase data or prompt. An unattended removal keeps data.
case "$1" in
  remove|purge)
    sam_uid="\${SUDO_UID:-\${PKEXEC_UID:-}}"
    if [ -n "$sam_uid" ] && [ "$sam_uid" != 0 ] && id "$sam_uid" >/dev/null 2>&1; then
      sam_user="$(id -un "$sam_uid")"
      sam_home="$(getent passwd "$sam_uid" | cut -d: -f6)"
      runuser -u "$sam_user" -- env HOME="$sam_home" bash -c ${shellQuote(helper)} sam-cleanup --data-only || true
    elif [ "$(id -u)" != 0 ]; then
      bash -c ${shellQuote(helper)} sam-cleanup --data-only || true
    else
      echo 'App data kept. Each desktop user can run uninstall-linux.sh --data-only to choose whether to erase their data.'
    fi
    ;;
esac
`;
function shellQuote(text) { return "'" + text.replaceAll("'", "'\\''") + "'"; }
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
// Explicitly call the entry point when executed with bash -c.
const output = (defaults + hook.replaceAll(shellQuote(helper), shellQuote(helper + '\nsam_uninstall "$@"\n'))).replaceAll('\r\n', '\n');
fs.writeFileSync(path.join(root, '.tmp/linux-after-remove.sh'), output, { mode: 0o755 });
