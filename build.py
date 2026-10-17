"""Wraps each pages/<slug>.html body in the site header and footer and writes public/<slug>/index.html.

The first two lines of a page file are its title and meta description; the rest is the body.
pages/home.html becomes public/index.html, and pages/404.html becomes public/404.html.
"""
import pathlib

ROOT = pathlib.Path(__file__).parent
HEAD = (ROOT / "template" / "head.html").read_text()
FOOT = (ROOT / "template" / "foot.html").read_text()

for page in sorted((ROOT / "pages").glob("*.html")):
    title, desc, body = page.read_text().split("\n", 2)
    html = HEAD.replace("{TITLE}", title.strip()).replace("{DESC}", desc.strip()) + body + FOOT
    slug = page.stem
    if slug == "home":
        out = ROOT / "public" / "index.html"
    elif slug == "404":
        out = ROOT / "public" / "404.html"
    else:
        out = ROOT / "public" / slug / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print("built", out.relative_to(ROOT))
