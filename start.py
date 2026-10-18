#!/usr/bin/env python3
"""Serve the bundled book over loopback, with no third-party dependencies."""
import argparse
import functools
import http.server
from pathlib import Path
import threading
import webbrowser


def main():
    parser = argparse.ArgumentParser(description='Read GALAXIES locally')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    site = root / 'dist' if (root / 'dist' / 'index.html').is_file() else root
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(site))
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as exc:
        parser.error(f'Cannot listen on port {args.port}: {exc}. Try --port 8766.')
    url = f'http://127.0.0.1:{server.server_port}/'
    print(f'GALAXIES: {url}\nPress Ctrl+C to stop.', flush=True)
    if not args.no_browser:
        timer = threading.Timer(.3, webbrowser.open, args=(url,))
        timer.daemon = True
        timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
