"""
check_links.py
--------------
Crawls all JSON files in /data/ and checks every URL found.
Prints a report of broken links grouped by file.

Run from your project root:
    python3 scripts/check_links.py

Requirements: none (uses only Python stdlib)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from collections import defaultdict

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent.parent / "data"
TIMEOUT = 8          # seconds per request
DELAY = 0.3          # seconds between requests (be polite to gov sites)
MAX_RETRIES = 1      # retry once on timeout

# Some gov sites block bots — spoof a browser user-agent
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.5",
}

# Status codes that mean "exists but requires login / redirects to homepage"
# These are NOT broken links — treat them as OK
ACCEPTABLE_CODES = {200, 301, 302, 303, 307, 308, 401, 403}

# ---------------------------------------------------------------------------
# URL extraction — recursively finds all string values that look like URLs
# ---------------------------------------------------------------------------

def extract_urls(obj, path="") -> list[tuple[str, str]]:
    """
    Returns list of (json_path, url) tuples found anywhere in the object.
    """
    results = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            results.extend(extract_urls(value, f"{path}.{key}"))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            results.extend(extract_urls(item, f"{path}[{i}]"))
    elif isinstance(obj, str):
        val = obj.strip()
        if val.startswith("http://") or val.startswith("https://"):
            results.append((path, val))
    return results

# ---------------------------------------------------------------------------
# URL checker
# ---------------------------------------------------------------------------

def check_url(url: str) -> tuple[bool, str]:
    """
    Returns (is_ok, status_message).
    Follows redirects automatically.
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS, method="HEAD")
            with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
                code = response.status
                if code in ACCEPTABLE_CODES:
                    return True, f"HTTP {code}"
                else:
                    return False, f"HTTP {code} (unexpected)"

        except urllib.error.HTTPError as e:
            if e.code in ACCEPTABLE_CODES:
                return True, f"HTTP {e.code}"
            # Some servers don't support HEAD — retry with GET
            if e.code == 405 and attempt == 0:
                try:
                    req2 = urllib.request.Request(url, headers=HEADERS)
                    with urllib.request.urlopen(req2, timeout=TIMEOUT) as r:
                        return True, f"HTTP {r.status} (GET fallback)"
                except Exception:
                    pass
            return False, f"HTTP {e.code} — {e.reason}"

        except urllib.error.URLError as e:
            reason = str(e.reason)
            if "timed out" in reason.lower() and attempt < MAX_RETRIES:
                time.sleep(1)
                continue
            return False, f"URL Error: {reason}"

        except Exception as e:
            return False, f"Error: {str(e)}"

    return False, "Timed out after retries"

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not DATA_DIR.exists():
        print(f"❌  Could not find data directory at: {DATA_DIR}")
        print("    Run this script from your project root.")
        sys.exit(1)

    # Collect all JSON files
    json_files = sorted(DATA_DIR.rglob("*.json"))
    print(f"🔍  Found {len(json_files)} JSON files in {DATA_DIR}\n")

    # Extract all URLs, deduplicated globally to avoid checking the same URL twice
    all_urls: dict[str, list[tuple[str, str]]] = defaultdict(list)
    # url -> list of (file_path, json_path)
    url_locations: dict[str, list[tuple[str, str]]] = defaultdict(list)

    for json_file in json_files:
        rel = json_file.relative_to(DATA_DIR)
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            urls = extract_urls(data)
            for json_path, url in urls:
                url_locations[url].append((str(rel), json_path))
        except json.JSONDecodeError as e:
            print(f"⚠️   JSON parse error in {rel}: {e}")
        except Exception as e:
            print(f"⚠️   Could not read {rel}: {e}")

    unique_urls = list(url_locations.keys())
    print(f"🔗  Found {len(unique_urls)} unique URLs to check\n")
    print("=" * 70)

    # Check each URL
    results: dict[str, tuple[bool, str]] = {}
    for i, url in enumerate(unique_urls, 1):
        print(f"[{i:3}/{len(unique_urls)}] Checking {url[:70]}...", end=" ", flush=True)
        ok, status = check_url(url)
        results[url] = (ok, status)
        icon = "✅" if ok else "❌"
        print(f"{icon} {status}")
        time.sleep(DELAY)

    # ---------------------------------------------------------------------------
    # Report
    # ---------------------------------------------------------------------------

    broken = {url: info for url, info in results.items() if not info[0]}
    ok_count = len(results) - len(broken)

    print("\n" + "=" * 70)
    print(f"\n📊  RESULTS: {ok_count} OK  |  {len(broken)} BROKEN\n")

    if not broken:
        print("🎉  All links are working!")
        return

    # Group broken links by file
    broken_by_file: dict[str, list[tuple[str, str, str]]] = defaultdict(list)
    for url, (_, status) in broken.items():
        for file_path, json_path in url_locations[url]:
            broken_by_file[file_path].append((url, json_path, status))

    print("❌  BROKEN LINKS BY FILE")
    print("=" * 70)

    for file_path in sorted(broken_by_file.keys()):
        print(f"\n📄  {file_path}")
        for url, json_path, status in broken_by_file[file_path]:
            print(f"    Field : {json_path}")
            print(f"    URL   : {url}")
            print(f"    Status: {status}")
            print()

    # Also write a machine-readable report
    report_path = Path(__file__).parent / "broken_links_report.json"
    report = {
        "checked": len(results),
        "ok": ok_count,
        "broken_count": len(broken),
        "broken": [
            {
                "url": url,
                "status": status,
                "locations": [
                    {"file": fp, "json_path": jp}
                    for fp, jp in url_locations[url]
                ]
            }
            for url, (_, status) in broken.items()
        ]
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n💾  Full report saved to: {report_path}")
    print(f"    Fix the URLs above in your JSON files, then re-run this script.")


if __name__ == "__main__":
    main()