"""Manage the user's macOS LaunchAgent for the signage server."""
import argparse
from pathlib import Path
import os
import plistlib
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LABEL = 'local.health-signage'
DOMAIN = f'gui/{os.getuid()}'
TARGET = f'{DOMAIN}/{LABEL}'
PLIST = Path.home() / 'Library' / 'LaunchAgents' / f'{LABEL}.plist'
LOGS = Path.home() / 'Library' / 'Logs' / 'health-signage'


def loaded():
    return subprocess.run(['launchctl', 'print', TARGET],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def stop():
    if loaded():
        subprocess.run(['launchctl', 'bootout', TARGET], check=True)


def start():
    if not PLIST.exists():
        raise SystemExit('Run npm run service:install first.')
    if not loaded():
        subprocess.run(['launchctl', 'bootstrap', DOMAIN, str(PLIST)], check=True)
    subprocess.run(['launchctl', 'kickstart', TARGET], check=True)


def install():
    for directory in ('Desktop', 'Documents', 'Downloads'):
        if ROOT.is_relative_to(Path.home() / directory):
            raise SystemExit('Move the project to ~/Applications/health-signage before installing.')
    for relative in ('.venv/bin/python', 'serve_local.py', 'static/js/app.js'):
        if not (ROOT / relative).is_file():
            raise SystemExit(f'Missing {relative}; set up dependencies and run npm run build first.')
    settings = {
        'Label': LABEL,
        'ProgramArguments': [str(ROOT / '.venv/bin/python'), str(ROOT / 'serve_local.py')],
        'WorkingDirectory': str(ROOT),
        'RunAtLoad': True,
        'KeepAlive': True,
        'ThrottleInterval': 10,
        'ProcessType': 'Background',
        'EnvironmentVariables': {'PYTHONUNBUFFERED': '1', 'TZ': 'Asia/Tokyo'},
        'StandardOutPath': str(LOGS / 'server.log'),
        'StandardErrorPath': str(LOGS / 'server.log'),
    }
    PLIST.parent.mkdir(parents=True, exist_ok=True)
    LOGS.mkdir(parents=True, exist_ok=True, mode=0o700)
    stop()
    with PLIST.open('wb') as file:
        plistlib.dump(settings, file)
    PLIST.chmod(0o600)
    start()
    print(f'Installed {LABEL}; log: {LOGS / "server.log"}')


def main():
    if sys.platform != 'darwin':
        raise SystemExit('This service installer requires macOS.')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('install', 'start', 'stop', 'restart', 'status', 'uninstall'))
    command = parser.parse_args().command
    if command == 'install':
        install()
    elif command == 'start':
        start()
    elif command == 'stop':
        stop()
    elif command == 'restart':
        if loaded():
            subprocess.run(['launchctl', 'kickstart', '-k', TARGET], check=True)
        else:
            start()
    elif command == 'status':
        raise SystemExit(subprocess.run(['launchctl', 'print', TARGET]).returncode)
    elif command == 'uninstall':
        stop()
        PLIST.unlink(missing_ok=True)
        print('LaunchAgent removed; application data and logs retained.')


if __name__ == '__main__':
    main()
