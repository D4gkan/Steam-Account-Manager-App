if (process.platform !== 'linux') {
  console.error('Build Linux packages on Linux so native SQLite/sharp binaries, executable modes and AppImage symlinks match the target. See packaging/linux-build.sh.');
  process.exit(1);
}
