import os
import json
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    exit(1)

print(f"Supabase URL: {SUPABASE_URL[:40]}...")
print("Testing connection to library_schedules table...")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

test_url = f"{SUPABASE_URL}/rest/v1/library_schedules?select=id&limit=1"
req = urllib.request.Request(test_url, headers=headers)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        status = resp.status
        body = resp.read().decode()
        print(f"Status: {status}")
        if status == 200:
            print("SUCCESS: Connection OK. library_schedules table exists!")
        else:
            print(f"Response: {body[:200]}")
except urllib.error.HTTPError as e:
    status = e.code
    body = e.read().decode()
    print(f"HTTP Error: {status}")
    print(f"Response: {body[:300]}")
    if status == 404 or "does not exist" in body:
        print("\nTable does not exist yet.")
        print("Please run scripts/001_create_tables.sql in your Supabase SQL Editor.")
    else:
        print("Connection established but unexpected error.")
        print("Please run scripts/001_create_tables.sql in your Supabase SQL Editor.")
except Exception as e:
    print(f"Connection failed: {e}")

print("\nChecking announcements table...")
test_url2 = f"{SUPABASE_URL}/rest/v1/announcements?select=id&limit=1"
req2 = urllib.request.Request(test_url2, headers=headers)
try:
    with urllib.request.urlopen(req2, timeout=10) as resp:
        print(f"announcements table: OK (status {resp.status})")
except urllib.error.HTTPError as e:
    print(f"announcements table: {e.code} - {e.read().decode()[:100]}")

print("\nChecking loans table...")
test_url3 = f"{SUPABASE_URL}/rest/v1/loans?select=id&limit=1"
req3 = urllib.request.Request(test_url3, headers=headers)
try:
    with urllib.request.urlopen(req3, timeout=10) as resp:
        print(f"loans table: OK (status {resp.status})")
except urllib.error.HTTPError as e:
    print(f"loans table: {e.code} - {e.read().decode()[:100]}")

print("\nDone.")
