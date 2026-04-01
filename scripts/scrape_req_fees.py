#!/usr/bin/env python3
"""
scrape_req_fees.py

Scrapes or fetches the latest REQ (Registraire des entreprises du Québec)
registration fees and updates data/registration/req.json.

NOTE: This is a stub. The REQ does not expose a public API, so this script
uses a requests + BeautifulSoup approach to parse the REQ fee page.
Run periodically to keep fee data current.
"""

import json
import re
from datetime import date
from pathlib import Path


# REQ fees page URL (may require browser-like headers)
REQ_FEES_URL = "https://www.registreentreprises.gouv.qc.ca/en/general/tarifs.aspx"

DATA_FILE = Path(__file__).parent.parent / "data" / "registration" / "req.json"


def fetch_req_fees() -> dict:
    """
    Stub: Fetch and parse REQ fees from the official website.

    In production, use requests + BeautifulSoup to scrape the fee table.
    Returns a dict of fee_type -> amount_cad.
    """
    # TODO: Implement actual scraping logic
    # import requests
    # from bs4 import BeautifulSoup
    # response = requests.get(REQ_FEES_URL, headers={"User-Agent": "Mozilla/5.0"})
    # soup = BeautifulSoup(response.text, "html.parser")
    # ... parse fee table ...

    print(f"[STUB] Would fetch fees from: {REQ_FEES_URL}")
    print("[STUB] Returning placeholder fee data")

    return {
        "sole_proprietorship_registration": 36,
        "partnership_registration": 36,
        "corporation_registration": 357,
        "annual_update": 54,
        "currency": "CAD",
        "scraped_date": str(date.today()),
        "note": "Fees subject to change — verify at REQ website",
    }


def update_req_json(fees: dict) -> None:
    """Update the req.json data file with freshly scraped fees."""
    if not DATA_FILE.exists():
        print(f"[ERROR] Data file not found: {DATA_FILE}")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    current_year = date.today().year
    data["fees_2026"] = {**fees, "year": current_year}

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[OK] Updated {DATA_FILE} with fees: {fees}")


def main():
    print("REQ Fee Scraper — BZNS Knowledge Base")
    print("=" * 40)

    fees = fetch_req_fees()
    update_req_json(fees)

    print("\nDone.")


if __name__ == "__main__":
    main()
