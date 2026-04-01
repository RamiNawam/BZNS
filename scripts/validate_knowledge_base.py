#!/usr/bin/env python3
"""
validate_knowledge_base.py

Validates all JSON files in the data/ directory to ensure they are well-formed,
contain required top-level keys, and pass basic schema checks.
"""

import json
import os
import sys
from pathlib import Path


# Minimum required keys for each data category
REQUIRED_KEYS = {
    "registration": ["agency", "website", "description_en"],
    "permits": ["agency", "website", "description_en"],
    "tax": ["title_en", "year"],
    "funding": ["id", "name_en", "website", "description_en"],
    "compliance": ["title_en", "description_en"],
}


def load_json_file(filepath: Path) -> dict | list | None:
    """Load and parse a JSON file. Returns None on error."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"  [ERROR] Invalid JSON in {filepath}: {e}")
        return None
    except OSError as e:
        print(f"  [ERROR] Cannot read {filepath}: {e}")
        return None


def validate_file(filepath: Path, category: str) -> bool:
    """Validate a single JSON file against category requirements."""
    data = load_json_file(filepath)
    if data is None:
        return False

    required = REQUIRED_KEYS.get(category, [])
    if isinstance(data, dict):
        missing = [key for key in required if key not in data]
        if missing:
            print(f"  [WARN]  {filepath.name} missing keys: {missing}")
            return False
        print(f"  [OK]    {filepath.name}")
        return True
    elif isinstance(data, list):
        print(f"  [OK]    {filepath.name} (array with {len(data)} items)")
        return True
    else:
        print(f"  [WARN]  {filepath.name} unexpected top-level type: {type(data)}")
        return False


def main():
    repo_root = Path(__file__).parent.parent
    data_dir = repo_root / "data"

    if not data_dir.exists():
        print(f"[FATAL] data/ directory not found at {data_dir}")
        sys.exit(1)

    total = 0
    passed = 0
    failed = 0

    print("=" * 60)
    print("BZNS Knowledge Base Validator")
    print("=" * 60)

    for category_dir in sorted(data_dir.rglob("*")):
        if not category_dir.is_dir():
            continue
        json_files = sorted(category_dir.glob("*.json"))
        if not json_files:
            continue

        # Determine category name from path
        relative = category_dir.relative_to(data_dir)
        category = relative.parts[0] if relative.parts else "root"

        print(f"\n[{category.upper()}] ({category_dir.relative_to(repo_root)})")
        for json_file in json_files:
            total += 1
            if validate_file(json_file, category):
                passed += 1
            else:
                failed += 1

    # Also check root-level JSON files
    print(f"\n[ROOT] (data/)")
    for json_file in sorted(data_dir.glob("*.json")):
        total += 1
        data = load_json_file(json_file)
        if data is not None:
            print(f"  [OK]    {json_file.name}")
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} files passed ({failed} failed)")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
    else:
        print("All knowledge base files are valid.")


if __name__ == "__main__":
    main()
