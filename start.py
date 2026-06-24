#!/usr/bin/env python3
"""
start.py — Launch script for Concept in 60 Seconds
Starts both the Express backend (server/) and Vite frontend (client/)
in parallel, streams their logs, and shuts both down cleanly on Ctrl+C.

Usage:
    python start.py            # start both
    python start.py --install  # install npm deps first, then start
"""

import subprocess
import sys
import os
import signal
import threading
import argparse
import time

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT   = os.path.dirname(os.path.abspath(__file__))
CLIENT = os.path.join(ROOT, "client")
SERVER = os.path.join(ROOT, "server")

# ── Colors (ANSI) ──────────────────────────────────────────────────────────────
RESET  = "\033[0m"
BOLD   = "\033[1m"
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
GREY   = "\033[90m"

# Windows: enable ANSI colors
if sys.platform == "win32":
    os.system("")


def log(prefix: str, color: str, line: str):
    print(f"{color}{BOLD}[{prefix}]{RESET} {line}", flush=True)


def stream_output(process: subprocess.Popen, prefix: str, color: str):
    """Read stdout+stderr from a process and print with a colored prefix."""
    for raw in process.stdout:
        line = raw.rstrip("\n").rstrip("\r\n")
        if line:
            log(prefix, color, line)


def npm_install(cwd: str, name: str):
    print(f"\n{YELLOW}{BOLD}▶ Installing dependencies for {name}…{RESET}")
    result = subprocess.run(
        ["npm", "install"],
        cwd=cwd,
        shell=(sys.platform == "win32"),
    )
    if result.returncode != 0:
        print(f"{RED}✖ npm install failed in {name}. Aborting.{RESET}")
        sys.exit(1)
    print(f"{GREEN}✔ Dependencies ready for {name}.{RESET}")


def start_process(cmd: list, cwd: str, name: str) -> subprocess.Popen:
    return subprocess.Popen(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(sys.platform == "win32"),
    )


def main():
    parser = argparse.ArgumentParser(description="Start Concept in 60 Seconds")
    parser.add_argument(
        "--install", "-i",
        action="store_true",
        help="Run 'npm install' in both client/ and server/ before starting.",
    )
    args = parser.parse_args()

    print(f"\n{CYAN}{BOLD}{'═' * 50}")
    print("   Concept in 60 Seconds — Dev Launcher")
    print(f"{'═' * 50}{RESET}\n")

    # ── Optional: install deps ─────────────────────────────────────────────────
    if args.install:
        npm_install(CLIENT, "client")
        npm_install(SERVER, "server")

    # ── Launch processes ───────────────────────────────────────────────────────
    print(f"{GREEN}{BOLD}▶ Starting backend  (server/)  on http://localhost:5000{RESET}")
    server_proc = start_process(["npm", "start"], SERVER, "server")

    # Small delay so the server starts before the client's proxy tries to connect
    time.sleep(1)

    print(f"{CYAN}{BOLD}▶ Starting frontend (client/) on http://localhost:5173{RESET}\n")
    client_proc = start_process(["npm", "run", "dev"], CLIENT, "client")

    processes = [server_proc, client_proc]

    # ── Stream output in background threads ────────────────────────────────────
    threads = [
        threading.Thread(target=stream_output, args=(server_proc, "SERVER", YELLOW), daemon=True),
        threading.Thread(target=stream_output, args=(client_proc, "CLIENT", CYAN),   daemon=True),
    ]
    for t in threads:
        t.start()

    print(f"\n{GREY}Press Ctrl+C to stop both servers.{RESET}\n")

    # ── Graceful shutdown on Ctrl+C ────────────────────────────────────────────
    def shutdown(sig=None, frame=None):
        print(f"\n{RED}{BOLD}⏹  Shutting down…{RESET}")
        for proc in processes:
            try:
                if sys.platform == "win32":
                    proc.send_signal(signal.CTRL_C_EVENT)
                else:
                    proc.terminate()
            except Exception:
                pass
        # Give them 3 s to exit gracefully, then kill
        deadline = time.time() + 3
        for proc in processes:
            remaining = max(0, deadline - time.time())
            try:
                proc.wait(timeout=remaining)
            except subprocess.TimeoutExpired:
                proc.kill()
        print(f"{GREEN}✔ All servers stopped.{RESET}\n")
        sys.exit(0)

    signal.signal(signal.SIGINT,  shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # ── Wait for either process to exit unexpectedly ───────────────────────────
    while True:
        for proc, name in zip(processes, ["server", "client"]):
            if proc.poll() is not None:
                print(f"\n{RED}{BOLD}✖ {name} exited unexpectedly (code {proc.returncode}).{RESET}")
                shutdown()
        time.sleep(1)


if __name__ == "__main__":
    main()
