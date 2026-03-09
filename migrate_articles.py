#!/usr/bin/env python3
"""
Migrate rewritten articles (with spaces in dirname) from content/ to content/hr/
These are articles that were generated recently and have spaces in the directory name.
"""
import os
import shutil
import re
from pathlib import Path

content_dir = Path("/opt/openclaw/workspace/tech-pulse-css/content")
hr_content_dir = Path("/opt/openclaw/workspace/tech-pulse-css/content/hr")

# Articles with spaces in dirname (timestamp format "YYYY-MM-DD HH:MM:SS-slug")
# These are the rewritten ones and should be moved to HR
space_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}-')

categories = ["ai", "gaming", "space", "medicine", "robotics", "tech", "society"]

migrated = 0
for cat in categories:
    cat_dir = content_dir / cat
    if not cat_dir.exists():
        continue

    for item in sorted(cat_dir.iterdir()):
        if not item.is_dir():
            continue

        # Check if dirname has space (timestamp pattern)
        if space_pattern.match(item.name):
            # Extract slug from dir name (remove timestamp prefix)
            parts = item.name.split('-', 1)  # Split on first hyphen after timestamp
            if len(parts) == 2:
                # Create clean slug without timestamp
                slug = parts[1].strip()
                # But keep the slug simple, remove any remaining issues
                slug = slug.replace("'", "").replace("'", "").replace('"', "")[:80]
                slug = re.sub(r'[^a-z0-9-]', '-', slug.lower())
                slug = re.sub(r'-+', '-', slug).strip('-')

                # Create HR category dir if needed
                hr_cat_dir = hr_content_dir / cat
                hr_cat_dir.mkdir(parents=True, exist_ok=True)

                # Create new dir with just slug (date will be in index.mdx frontmatter)
                new_dir = hr_cat_dir / slug

                # If destination exists, skip
                if new_dir.exists():
                    print(f"⊘ {cat}/{item.name} → already exists at {cat}/{slug}")
                    continue

                try:
                    # Move the directory
                    shutil.move(str(item), str(new_dir))
                    print(f"✓ {cat}/{item.name} → hr/{cat}/{slug}")
                    migrated += 1
                except Exception as e:
                    print(f"✗ {cat}/{item.name} → ERROR: {e}")

print(f"\nMigrated {migrated} articles to content/hr/")
