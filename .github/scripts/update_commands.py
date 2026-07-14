import urllib.request
import re
import json
import os
import sys

from command_values import enrich_dataset, parse_convar_metadata

ALLOWED_CATEGORIES = {
    "network", "graphics", "audio", "mouse", "gameplay", "cheats", "practice", "system"
}


def normalize_category(category, name, flags):
    normalized = str(category or "").strip().rstrip(",").lower()
    legacy = {
        "graphics_viewmodel": "graphics",
        "graphics_cn": "graphics",
        "graphics_bloom_when_smoked": "graphics",
        "cheats_practice": "practice",
        "physics": "system",
        "movement": "gameplay",
    }
    normalized = legacy.get(normalized, normalized)
    return normalized if normalized in ALLOWED_CATEGORIES else guess_category(name, flags)


def validate_dataset(commands):
    names = set()
    for command in commands:
        name = command.get("n", "")
        if not name or name in names:
            raise RuntimeError(f"Command dataset contains a missing or duplicate name: {name!r}")
        names.add(name)
        if command.get("t") not in {"cmd", "var"}:
            raise RuntimeError(f"Command {name} has invalid type: {command.get('t')!r}")
        if command.get("c") not in ALLOWED_CATEGORIES:
            raise RuntimeError(f"Command {name} has invalid category: {command.get('c')!r}")
        if not str(command.get("cn", "")).strip():
            raise RuntimeError(f"Command {name} is missing a Chinese description")
    return commands

def fetch_and_parse(url, is_convar):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
    
    entries = []
    lines = content.split('\n')
    i = 0
    total_lines = len(lines)
    while i < total_lines:
        line = lines[i].strip()
        if not line or line.startswith('---'):
            i += 1
            continue
            
        if is_convar:
            match = re.match(r'^([\w\+\-]+)\s*(.*?)\s*\((.*?)\)$', line)
        else:
            match = re.match(r'^([\w\+\-]+)\s*\((.*?)\)$', line)
            
        if match:
            name = match.group(1)
            value = {}
            if is_convar:
                val = match.group(2).strip()
                if val.startswith('"') and val.endswith('"'):
                    val = val[1:-1]
                flags, bounds = parse_convar_metadata(match.group(3))
                if bounds:
                    value["constraint"] = bounds
            else:
                val = ""
                flags = [f.strip() for f in match.group(2).split() if f.strip()]
            
            desc = ""
            if i + 1 < total_lines and lines[i+1].startswith('\t'):
                desc = lines[i+1].strip()
                if desc == "<no description>":
                    desc = ""
                i += 1
            
            entry = {
                "n": name,
                "d": val,
                "f": flags,
                "en": desc,
                "t": "var" if is_convar else "cmd"
            }
            if value:
                entry["value"] = value
            entries.append(entry)
        i += 1
    return entries

def guess_category(name, flags):
    """Heuristic fallback for categorizing new commands if no API key is set."""
    if "cheat" in flags:
        return "cheats"
        
    n = name.lower()
    if n.startswith("cl_crosshair") or n.startswith("crosshair"):
        return "gameplay"
    elif n.startswith("cl_viewmodel") or n.startswith("viewmodel"):
        return "gameplay"
    elif n.startswith("cl_hud") or n.startswith("hud_"):
        return "gameplay"
    elif n.startswith("snd_") or n.startswith("volume") or n.startswith("voice_") or n.startswith("play"):
        return "audio"
    elif n.startswith("m_") or n.startswith("sensitivity") or n.startswith("zoom_sensitivity"):
        return "mouse"
    elif n.startswith("r_") or n.startswith("fps_") or n.startswith("mat_") or n.startswith("cl_showfps"):
        return "graphics"
    elif n.startswith("cl_interp") or n.startswith("rate") or n.startswith("net_") or n.startswith("cl_net"):
        return "network"
    elif n.startswith("bot_") or n.startswith("sv_grenade") or n.startswith("mp_"):
        return "practice"
    elif n.startswith("bind") or n.startswith("key_") or n.startswith("alias") or n.startswith("con_"):
        return "system"
        
    return "system"

def translate_new_commands(new_items, cf_token, cf_account):
    """Translates new commands via Cloudflare Workers AI."""
    import time
    
    translated = {}
    batch_size = 40
    
    for i in range(0, len(new_items), batch_size):
        batch = new_items[i:i+batch_size]
        batch_data = [
            {
                "n": item["n"],
                "default": item["d"],
                "en": item["en"],
                "constraint": item.get("value", {}).get("constraint", {}),
            }
            for item in batch
        ]
        prompt = (
            "Translate these CS2 commands/variables and categorize them. Preserve every documented "
            "number exactly. For numeric variables, explain units, special values, discrete modes, and "
            "Min/Max constraints when the input provides them; never invent a missing unit or boundary. "
            "If the English description is empty, write a brief Chinese description. Return JSON matching "
            "this format: {\"translations\": [{\"name\": \"cmd_name\", \"desc_cn\": \"中文释义\", "
            "\"category\": \"network/graphics/audio/mouse/gameplay/cheats/practice/system\"}]}:\n"
            f"{json.dumps(batch_data)}"
        )
        
        # Simple retry loop
        for attempt in range(3):
            try:
                headers = {
                    "Authorization": f"Bearer {cf_token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "messages": [
                        {"role": "system", "content": "You are a CS2 config reference editor. Translate Source 2 command descriptions into precise Chinese player terminology. Preserve numeric values, comparison signs, units, bitmasks, sentinel values, and enum meanings exactly; distinguish engine Min/Max constraints from prose examples, and state when no unit or bound is provided. Return only JSON in the requested schema, without Markdown fences."},
                        {"role": "user", "content": prompt}
                    ]
                }
                model = "@cf/meta/llama-3.1-8b-instruct-fp8"
                url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/ai/run/{model}"
                req = urllib.request.Request(url, 
                                             data=json.dumps(payload).encode('utf-8'),
                                             headers=headers, 
                                             method="POST")
                
                with urllib.request.urlopen(req, timeout=15) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                    result = res_data.get("result", {})
                    content_str = result.get("response", "").strip()
                    
                    # Strip markdown blocks if present (e.g. ```json ... ```)
                    if content_str.startswith("```"):
                        lines = content_str.split("\n")
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines[-1].startswith("```"):
                            lines = lines[:-1]
                        content_str = "\n".join(lines).strip()
                        
                    content = json.loads(content_str)
                    for trans in content.get("translations", []):
                        translated[trans["name"]] = trans
                    break
            except Exception as e:
                print(f"Error translating batch (attempt {attempt+1}): {e}")
                time.sleep(1)
                
    return translated

def get_upstream_latest_commit_sha():
    url = "https://api.github.com/repos/SteamTracking/GameTracking-CS2/commits?path=DumpSource2&per_page=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"token {token}")
        
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode('utf-8'))
            if isinstance(res, list) and len(res) > 0:
                return res[0].get("sha", "")
    except Exception as e:
        print(f"Warning: Could not fetch latest commit SHA from upstream: {e}")
    return None

def main():
    dest_path = "app/website/public/data/commands.json"
    sha_file = ".github/scripts/last_sha.txt"
    
    # 0. Check upstream commit SHA to see if there are any changes
    force = len(sys.argv) > 1 and sys.argv[1] == "--force"
    
    upstream_sha = get_upstream_latest_commit_sha()
    if upstream_sha and not force:
        local_sha = ""
        if os.path.exists(sha_file):
            try:
                with open(sha_file, "r", encoding="utf-8") as f:
                    local_sha = f.read().strip()
            except Exception as e:
                print(f"Warning: Could not read local SHA file: {e}")
                
        if upstream_sha == local_sha:
            print(f"Upstream SHA ({upstream_sha}) matches local SHA. No changes needed. Exiting.")
            sys.exit(0)
        else:
            print(f"Upstream SHA ({upstream_sha}) differs from local SHA ({local_sha}). Processing updates...")
    else:
        print("Bypassing SHA match check (either --force was used or API query failed).")
    
    # 1. Load existing translation database
    existing_commands = {}
    if os.path.exists(dest_path):
        try:
            with open(dest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    existing_commands[item["n"]] = item
            print(f"Loaded {len(existing_commands)} existing commands from cache.")
        except Exception as e:
            print(f"Warning: Could not read existing commands: {e}")
            
    # 2. Fetch and parse upstream
    commands_url = "https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/DumpSource2/commands.txt"
    convars_url = "https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/DumpSource2/convars.txt"

    print("Fetching upstream game tracking data...")
    try:
        cmds = fetch_and_parse(commands_url, is_convar=False)
        cvars = fetch_and_parse(convars_url, is_convar=True)
    except Exception as e:
        print(f"Error fetching data from GameTracking: {e}")
        sys.exit(1)
        
    all_items = cmds + cvars
    filtered_items = [
        item for item in all_items 
        if not ("developmentonly" in item["f"] or "defensive" in item["f"])
    ]
    print(f"Found {len(filtered_items)} clean items in upstream.")

    # 3. Separate existing and brand-new commands
    new_commands = []
    final_dataset = []
    
    for item in filtered_items:
        name = item["n"]
        if name in existing_commands:
            # Command already exists: reuse Chinese translation & category
            cached = existing_commands[name]
            final_dataset.append({
                "n": name,
                "d": item["d"],       # Update default value
                "f": item["f"],       # Update flags
                "en": item["en"],     # Update English description
                "t": item["t"],       # Update type
                "cn": cached.get("cn", ""),
                "c": normalize_category(cached.get("c"), name, item["f"]),
                "value": item.get("value", {}),
            })
        else:
            # New command found!
            new_commands.append(item)

    print(f"Detected {len(new_commands)} brand new commands.")

    # 4. Handle new commands translations
    if new_commands:
        cf_token = os.environ.get("CLOUDFLARE_AI_TOKEN")
        cf_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
        
        translated_new = {}
        if cf_token and cf_account:
            print("Cloudflare credentials found, auto-translating new commands via Workers AI...")
            translated_new = translate_new_commands(new_commands, cf_token, cf_account)
        else:
            print("No Cloudflare credentials found. Using heuristic fallbacks for new commands.")
            
        for item in new_commands:
            name = item["n"]
            t_info = translated_new.get(name, {})
            
            desc_cn = str(t_info.get("desc_cn", "")).strip()
            if not desc_cn:
                raise RuntimeError(f"Workers AI did not return a Chinese description for new command {name}")
            category = normalize_category(t_info.get("category"), name, item["f"])
            
            final_dataset.append({
                "n": name,
                "d": item["d"],
                "f": item["f"],
                "en": item["en"],
                "t": item["t"],
                "cn": desc_cn,
                "c": category,
                "value": item.get("value", {}),
            })

    validate_dataset(enrich_dataset(final_dataset))

    # Sort alphabetically by name
    final_dataset.sort(key=lambda x: x["n"])

    # 5. Save back to repository
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, ensure_ascii=False, indent=2)

    print(f"Successfully compiled and saved {len(final_dataset)} commands to {dest_path}")

    # 6. Save the new SHA
    if upstream_sha:
        try:
            os.makedirs(os.path.dirname(sha_file), exist_ok=True)
            with open(sha_file, "w", encoding="utf-8") as f:
                f.write(upstream_sha)
            print(f"Saved new upstream SHA ({upstream_sha}) to {sha_file}")
        except Exception as e:
            print(f"Warning: Could not save new SHA: {e}")

if __name__ == "__main__":
    main()
