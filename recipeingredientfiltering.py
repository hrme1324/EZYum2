import pandas as pd, json, os, re

SRC = "recipes_easy_strict.csv"
OUT_CSV = "recipes_easiest_strict.csv"
OUT_GZ  = "recipes_easiest_strict.csv.gz"

def json_len(s):
    """Return length of JSON array in a string column, or 0 if invalid/empty."""
    if not isinstance(s, str) or not s.strip():
        return 0
    try:
        v = json.loads(s)
        if isinstance(v, list):
            return len(v)
        return 0
    except Exception:
        return 0

def has_any_tag(tags_str, keywords):
    """Check if tags JSON array contains any keyword (case-insensitive substring)."""
    if not isinstance(tags_str, str) or not tags_str.strip():
        return False
    try:
        tags = json.loads(tags_str)
        if not isinstance(tags, list):
            return False
        t = " ".join(str(x).lower() for x in tags)
        return any(k in t for k in keywords)
    except Exception:
        t = tags_str.lower()
        return any(k in t for k in keywords)

print("Loading CSV (this may take a bit)...")
df = pd.read_csv(SRC)

# Precompute lengths
df["steps_len"] = df["steps"].apply(json_len)
# Prefer ingredients_raw if present/valid, else fall back to ingredients
ing_len_raw = df["ingredients_raw"].apply(json_len)
ing_len_fall = df["ingredients"].apply(json_len)
df["ingredients_len"] = ing_len_raw.where(ing_len_raw > 0, ing_len_fall)

# Tag-based rules
fast_keywords = ["15-minutes-or-less", "30-minutes-or-less"]
easy_keywords = ["easy", "beginner-cook"]  # used only to bias, not required here
dessertish = [
    "dessert","cakes","cookies","candy","fudge","cupcakes","brownies",
    "pies-and-tarts","ice-cream","frozen-desserts","bar-cookies"
]

df["is_fast"] = df["tags"].apply(lambda s: has_any_tag(s, fast_keywords))
df["is_easyish"] = df["tags"].apply(lambda s: has_any_tag(s, easy_keywords))
df["is_dessertish"] = df["tags"].apply(lambda s: has_any_tag(s, dessertish))

# STRICT filter:
#   fast AND <=8 steps AND <=12 ingredients AND NOT dessertish
mask = (
    (df["is_fast"]) &
    (df["steps_len"] <= 5) &
    (df["ingredients_len"] <= 6) &
    (~df["is_dessertish"])
)

df_strict = df.loc[mask].copy()

# Keep only columns you truly need for seed import (trim to cut size)
# Adjust this list if you need more columns for your import function
keep_cols = ["id","name","description","ingredients","ingredients_raw","steps","tags"]
df_strict = df_strict[keep_cols]

# Save (uncompressed, trimmed)
df_strict.to_csv(OUT_CSV, index=False)

# Save compressed (for psql \copy from .gz or to keep locally small)
df_strict.to_csv(OUT_GZ, index=False, compression="gzip")

def human(n):
    for u in ["B","KB","MB","GB"]:
        if n < 1024:
            return f"{n:.1f}{u}"
        n /= 1024
    return f"{n:.1f}TB"

n_total = len(df)
n_kept  = len(df_strict)
size_csv = os.path.getsize(OUT_CSV)
size_gz  = os.path.getsize(OUT_GZ)

print(f"Kept {n_kept} recipes out of {n_total} total.")
print(f"Wrote {OUT_CSV}  ({human(size_csv)})")
print(f"Wrote {OUT_GZ}   ({human(size_gz)})")
print("\nTip: If the plain CSV is still too big for the web UI, use the .csv.gz with psql \\copy.")
