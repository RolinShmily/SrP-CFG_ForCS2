import os
import json
import hashlib
import urllib.request
import urllib.error
import time

EMBEDDING_MODEL = "@cf/baai/bge-m3"
INDEX_NAME = "cs2-commands-index"
BATCH_SIZE = 50  # commands per embedding + upsert cycle
CACHE_PATH = ".github/scripts/vectorize_sync_cache.json"


def get_credentials():
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
    ai_token = os.environ.get("CLOUDFLARE_AI_TOKEN")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    return account, ai_token, api_token


def cf_request(url, token, payload=None, method="GET", content_type="application/json"):
    """Generic Cloudflare API request with proper error handling."""
    if content_type == "application/json":
        data = json.dumps(payload).encode("utf-8") if payload else None
    else:
        data = payload  # raw bytes

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": content_type,
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode("utf-8")
        except Exception:
            pass
        raise RuntimeError(f"HTTP {e.code} from {url}: {error_body}")


def get_embeddings(account, token, texts):
    """Call Cloudflare Workers AI to generate embeddings for a list of texts."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{EMBEDDING_MODEL}"
    res = cf_request(url, token, payload={"text": texts}, method="POST")
    if not res.get("success"):
        raise RuntimeError(f"Embedding API error: {json.dumps(res)}")
    return res["result"]["data"]


def upsert_vectors(account, token, vectors):
    """Upsert a batch of vectors into Cloudflare Vectorize via raw NDJSON body."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/vectorize/v2/indexes/{INDEX_NAME}/upsert"
    ndjson_lines = "\n".join(json.dumps(v, ensure_ascii=False) for v in vectors) + "\n"
    res = cf_request(
        url,
        token,
        payload=ndjson_lines.encode("utf-8"),
        method="POST",
        content_type="application/x-ndjson",
    )
    if not res.get("success"):
        raise RuntimeError(f"Vectorize upsert error: {json.dumps(res)}")
    return res


def format_value_metadata(cmd):
    value = cmd.get("value") if isinstance(cmd.get("value"), dict) else {}
    constraint = value.get("constraint") if isinstance(value.get("constraint"), dict) else {}
    documented = value.get("documented_range") if isinstance(value.get("documented_range"), dict) else {}

    def range_text(label, value_range):
        minimum = value_range.get("min")
        maximum = value_range.get("max")
        if minimum is not None and maximum is not None:
            return f"{label}: {minimum}–{maximum}"
        if minimum is not None:
            return f"{label}: ≥ {minimum}"
        if maximum is not None:
            return f"{label}: ≤ {maximum}"
        return ""

    ranges = "；".join(filter(None, (
        range_text("引擎约束", constraint),
        range_text("说明范围", documented),
    )))
    options = "；".join(
        f"{option.get('value', '')}={option.get('label', '')}"
        for option in value.get("options", [])
        if isinstance(option, dict)
    )
    return str(value.get("description", "")), ranges, options


def compute_hash(cmd):
    """Compute a content hash for a command — changes if any embed-relevant field changes."""
    value_json = json.dumps(cmd.get("value", {}), ensure_ascii=False, sort_keys=True)
    content = f"{cmd.get('n','')}|{cmd.get('t','')}|{cmd.get('d','')}|{cmd.get('cn','')}|{cmd.get('en','')}|{value_json}"
    return hashlib.md5(content.encode("utf-8")).hexdigest()


def load_cache():
    """Load the local sync cache: { command_name: content_hash }"""
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(cache):
    """Save the sync cache to disk."""
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def main():
    account, ai_token, api_token = get_credentials()
    if not account or not ai_token or not api_token:
        print("Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_AI_TOKEN, or CLOUDFLARE_API_TOKEN. Skipping Vectorize sync.")
        return

    commands_path = "app/website/public/data/commands.json"
    if not os.path.exists(commands_path):
        print(f"Error: {commands_path} not found.")
        return

    with open(commands_path, "r", encoding="utf-8") as f:
        commands = json.load(f)

    # 1. Load cache and determine which commands need (re-)embedding
    cache = load_cache()
    stale_commands = []
    for cmd in commands:
        name = cmd.get("n", "")
        h = compute_hash(cmd)
        if cache.get(name) != h:
            stale_commands.append(cmd)

    total = len(commands)
    stale_count = len(stale_commands)
    print(f"Total commands: {total} | Need sync: {stale_count} | Cached: {total - stale_count}")

    if stale_count == 0:
        print("All vectors are up to date. Nothing to sync.")
        return

    # 2. Batch-embed and upsert only stale commands
    print(f"Syncing {stale_count} changed/new commands to Vectorize index '{INDEX_NAME}'...")
    success_count = 0
    first_batch = True

    for i in range(0, stale_count, BATCH_SIZE):
        batch = stale_commands[i : i + BATCH_SIZE]

        embed_texts = []
        for cmd in batch:
            value_description, value_ranges, value_options = format_value_metadata(cmd)
            parts = [
                f"指令名: {cmd.get('n', '')}",
                f"类型: {cmd.get('t', '')}",
                f"默认值: {cmd.get('d', '')}",
                f"中文释义: {cmd.get('cn', '')}",
                f"英文描述: {cmd.get('en', '')}",
                f"数值说明: {value_description}",
                f"数值范围: {value_ranges}",
                f"离散取值: {value_options}",
            ]
            embed_texts.append(" | ".join(parts))

        try:
            embeddings = get_embeddings(account, ai_token, embed_texts)

            if first_batch:
                print(f"  [DEBUG] Embedding count: {len(embeddings)} | dims: {len(embeddings[0])}")
                first_batch = False

            vectors = []
            for idx, cmd in enumerate(batch):
                value_description, value_ranges, value_options = format_value_metadata(cmd)
                vectors.append({
                    "id": cmd["n"],
                    "values": embeddings[idx],
                    "metadata": {
                        "n": cmd.get("n", ""),
                        "cn": cmd.get("cn", ""),
                        "en": cmd.get("en", ""),
                        "d": str(cmd.get("d", "")),
                        "t": cmd.get("t", ""),
                        "value_cn": value_description,
                        "range": value_ranges,
                        "options": value_options,
                    },
                })

            upsert_vectors(account, api_token, vectors)

            # Update cache for successfully synced commands
            for cmd in batch:
                cache[cmd["n"]] = compute_hash(cmd)

            success_count += len(batch)
            print(f"  [{i + len(batch)}/{stale_count}] Batch synced ({success_count} total)")
            time.sleep(0.3)

        except Exception as e:
            print(f"  [{i}/{stale_count}] ERROR: {e}")

    # 3. Save updated cache
    save_cache(cache)
    print(f"Vectorize sync complete. {success_count}/{stale_count} commands synced. Cache saved to {CACHE_PATH}")


if __name__ == "__main__":
    main()
