"""Fetch the latest 5 videos from the YouTube channel feed and write videos.json.

Runs in GitHub Actions before each deploy. If the feed can't be reached,
the existing videos.json is kept so the site still deploys.
"""
import json
import pathlib
import sys
import urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UCQVAJKpTQjISkB5Wx52As4g"  # @kopeiking_travel
FEED = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUT = pathlib.Path(__file__).resolve().parent.parent / "videos.json"
NS = {
    "a": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def main() -> int:
    try:
        req = urllib.request.Request(FEED, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as res:
            root = ET.fromstring(res.read())
    except Exception as e:  # keep the previous file on any failure
        print(f"feed fetch failed, keeping existing videos.json: {e}")
        return 0

    videos = []
    for entry in root.findall("a:entry", NS)[:5]:
        vid = entry.findtext("yt:videoId", default="", namespaces=NS)
        if not vid:
            continue
        videos.append({
            "id": vid,
            "title": entry.findtext("a:title", default="", namespaces=NS),
            "published": entry.findtext("a:published", default="", namespaces=NS),
        })

    if not videos:
        print("feed had no videos, keeping existing videos.json")
        return 0

    OUT.write_text(json.dumps(videos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(videos)} videos to {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
