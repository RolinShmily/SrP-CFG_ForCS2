import os
import sys
import json
import urllib.request

def test_cf_ai():
    # 1. Read credentials
    cf_token = os.environ.get("CLOUDFLARE_AI_TOKEN")
    cf_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
    
    if not cf_token or not cf_account:
        print("❌ Error: Missing credentials in environment!")
        print("Please set CLOUDFLARE_AI_TOKEN and CLOUDFLARE_ACCOUNT_ID before running.")
        sys.exit(1)
        
    print(f"Checking Cloudflare Workers AI availability...")
    print(f"Account ID: {cf_account[:6]}...{cf_account[-6:] if len(cf_account) > 12 else ''}")
    print(f"API Token: {cf_token[:6]}...{cf_token[-6:] if len(cf_token) > 12 else ''}")
    
    # 2. Prepare test payload
    model = "@cf/meta/llama-3.1-8b-instruct"
    url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/ai/run/{model}"
    
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Answer briefly in Chinese."},
            {"role": "user", "content": "Translate 'hello' to Chinese."}
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {cf_token}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method="POST"
    )
    
    # 3. Send request
    try:
        print(f"Sending test request to model '{model}'...")
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.getcode()
            res_data = json.loads(resp.read().decode('utf-8'))
            
            if status == 200 and res_data.get("success", False):
                result = res_data.get("result", {})
                response_text = result.get("response", "").strip()
                print("\n✅ API Call Successful!")
                print(f"AI Response: \"{response_text}\"")
                print("\n🎉 Congratulations! Cloudflare Workers AI is fully active and available for your account.")
            else:
                print("\n❌ API Call failed or returned unexpected success state.")
                print("Response payload:", json.dumps(res_data, indent=2))
    except Exception as e:
        print("\n❌ API Connection Failed!")
        print("Error details:", e)
        print("\nPlease check:")
        print("1. Are your Account ID and API Token correct?")
        print("2. Does your API Token have 'Workers AI: Edit' (or Read) permissions enabled?")
        print("3. Does your Cloudflare account have Workers AI enabled (usually on by default)?")

if __name__ == "__main__":
    test_cf_ai()
