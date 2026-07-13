import os
import json
import urllib.request
import time

EMBEDDING_MODEL = "@cf/baai/bge-large-zh-v1.5"
INDEX_NAME = "cs2-commands-index"
BATCH_SIZE = 50  # commands per embedding + upsert cycle

def get_credentials():
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
    token = (
        os.environ.get("CLOUDFLARE_AI_TOKEN")
        or os.environ.get("CLOUDFLARE_API_TOKEN")
        or os.environ.get("CF_API_TOKEN")
    )
    return account, token


def cf_request(url, token, payload=None, method="GET"):
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_embeddings(account, token, texts):
    """Call Cloudflare Workers AI to generate embeddings for a list of texts."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{EMBEDDING_MODEL}"
    res = cf_request(url, token, payload={"text": texts}, method="POST")
    if not res.get("success"):
        raise RuntimeError(f"Embedding API error: {json.dumps(res)}")
    return res["result"]["data"]


def upsert_vectors(account, token, vectors):
    """Upsert a batch of vectors into Cloudflare Vectorize."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/vectorize/indexes/{INDEX_NAME}/insert"
    res = cf_request(url, token, payload={"vectors": vectors}, method="POST")
    if not res.get("success"):
        raise RuntimeError(f"Vectorize upsert error: {json.dumps(res)}")
    return res


def main():
    account, token = get_credentials()
    if not account or not token:
        print("Missing Cloudflare credentials. Skipping Vectorize sync.")
        return

    commands_path = "app/website/public/data/commands.json"
    if not os.path.exists(commands_path):
        print(f"Error: {commands_path} not found.")
        return

    with open(commands_path, "r", encoding="utf-8") as f:
        commands = json.load(f)

    total = len(commands)
    print(f"Syncing {total} commands to Cloudflare Vectorize index '{INDEX_NAME}'...")

    success_count = 0
    for i in range(0, total, BATCH_SIZE):
        batch = commands[i : i + BATCH_SIZE]

        # Build composite text for embedding: combine name, type, default, CN, EN
        embed_texts = []
        for cmd in batch:
            parts = [
                f"指令名: {cmd.get('n', '')}",
                f"类型: {cmd.get('t', '')}",
                f"默认值: {cmd.get('d', '')}",
                f"中文释义: {cmd.get('cn', '')}",
                f"英文描述: {cmd.get('en', '')}",
            ]
            embed_texts.append(" | ".join(parts))

        try:
            # 1. Generate embeddings
            embeddings = get_embeddings(account, token, embed_texts)

            # 2. Build vector payloads with metadata
            vectors = []
            for idx, cmd in enumerate(batch):
                vectors.append(
                    {
                        "id": cmd["n"],
                        "values": embeddings[idx],
                        "metadata": {
                            "n": cmd.get("n", ""),
                            "cn": cmd.get("cn", ""),
                            "en": cmd.get("en", ""),
                            "d": str(cmd.get("d", "")),
                            "t": cmd.get("t", ""),
                        },
                    }
                )

            # 3. Upsert into Vectorize
            upsert_vectors(account, token, vectors)
            success_count += len(batch)
            print(f"  [{i + len(batch)}/{total}] Batch synced ({success_count} total)")
            time.sleep(0.3)  # gentle rate limiting
        except Exception as e:
            print(f"  [{i}/{total}] ERROR: {e}")
            # Continue with next batch instead of aborting entirely

    print(f"Vectorize sync complete. {success_count}/{total} commands indexed.")


if __name__ == "__main__":
    main()
