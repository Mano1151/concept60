"""
start.py — Local development launcher for Concept in 60 Seconds
Starts the Express backend (server/) and the Vite frontend (client/)
in parallel. Press Ctrl+C to shut both down cleanly.

Usage:
    python start.py
"""

import subprocess
import sys
import os
import signal
import threading
import time
from pathlib import Path

ROOT       = Path(__file__).resolve().parent
CLIENT_DIR = ROOT / "client"
SERVER_DIR = ROOT / "server"

# ── Colour helpers ─────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
CYAN   = "\033[96m"
YELLOW = "\033[93m"
RED    = "\033[91m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def tag(label, colour):
    return f"{colour}{BOLD}[{label}]{RESET}"

# ── Stream subprocess output with a coloured prefix ───────────────────────────
def stream(proc, prefix):
    for line in iter(proc.stdout.readline, b""):
        try:
            print(f"{prefix} {line.decode('utf-8', errors='replace').rstrip()}", flush=True)
        except Exception:
            pass

# ── Read a .env file and return its key=value pairs as a dict ─────────────────
def load_dotenv_file(path):
    env = {}
    try:
        with open(path, encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key   = key.strip()
                value = value.strip()
                # Strip surrounding quotes if present
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                env[key] = value
    except FileNotFoundError:
        pass
    return env

# ── npm command for the platform ───────────────────────────────────────────────
NPM = "npm.cmd" if sys.platform == "win32" else "npm"

def start_process(label, colour, cwd, cmd, extra_env=None):
    print(f"{tag(label, colour)} Starting: {' '.join(cmd)}")
    merged_env = {**os.environ}
    if extra_env:
        merged_env.update(extra_env)
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=0,
        env=merged_env,
    )
    t = threading.Thread(target=stream, args=(proc, tag(label, colour)), daemon=True)
    t.start()
    return proc

def main():
    # Enable ANSI colours on Windows
    if sys.platform == "win32":
        os.system("color")

    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║   Concept in 60 Seconds — Dev Start  ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════╝{RESET}\n")

    # ── Check directories exist ────────────────────────────────────────────────
    for path, name in [(CLIENT_DIR, "client"), (SERVER_DIR, "server")]:
        if not path.is_dir():
            print(f"{RED}ERROR: {name}/ directory not found at {path}{RESET}")
            sys.exit(1)

    # ── Explicitly load server/.env so Firebase / API keys are always injected ─
    server_env_file = SERVER_DIR / ".env"
    server_env = load_dotenv_file(server_env_file)
    if server_env:
        print(f"{GREEN}Loaded {len(server_env)} vars from server/.env{RESET}")
    else:
        print(f"{YELLOW}Warning: server/.env not found or empty — server may lack credentials{RESET}")

    # ── Start server (Express on port 5000) ───────────────────────────────────
    server_proc = start_process(
        "SERVER", GREEN,
        SERVER_DIR,
        [NPM, "start"],
        extra_env=server_env,
    )

    # Small delay so server boot messages appear first
    time.sleep(1)

    # ── Start client (Vite on port 5173) ──────────────────────────────────────
    client_proc = start_process(
        "CLIENT", CYAN,
        CLIENT_DIR,
        [NPM, "run", "dev"],
    )

    print(f"\n{YELLOW}Both processes running. Press Ctrl+C to stop.{RESET}\n")
    print(f"  {GREEN}Backend :{RESET}  http://localhost:5000")
    print(f"  {CYAN}Frontend:{RESET}  http://localhost:5173\n")

    procs = [server_proc, client_proc]

    def shutdown(sig=None, frame=None):
        print(f"\n{YELLOW}Shutting down…{RESET}")
        for p in procs:
            try:
                if sys.platform == "win32":
                    p.terminate()
                else:
                    os.killpg(os.getpgid(p.pid), signal.SIGTERM)
            except Exception:
                pass
        for p in procs:
            try:
                p.wait(timeout=5)
            except Exception:
                p.kill()
        print(f"{GREEN}Done. Goodbye!{RESET}\n")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            for p in procs:
                if p.poll() is not None:
                    print(f"{RED}A process exited unexpectedly (code {p.returncode}). Shutting down.{RESET}")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
