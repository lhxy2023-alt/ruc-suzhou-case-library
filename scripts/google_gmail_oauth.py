#!/usr/bin/env python3
import argparse
import base64
import hashlib
import json
import os
import secrets
import sys
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
]

CLIENT_PATH = Path('.credentials/google/gmail-oauth-client.json')
STATE_PATH = Path('.credentials/google/gmail-oauth-state.json')
TOKEN_PATH = Path('.credentials/google/gmail-token.json')


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def load_client():
    obj = json.loads(CLIENT_PATH.read_text())
    client = obj.get('installed') or obj.get('web')
    if not client:
        raise SystemExit('OAuth client file must contain installed or web config')
    return client


def generate_auth_url(scopes):
    client = load_client()
    verifier = b64url(secrets.token_bytes(48))
    challenge = b64url(hashlib.sha256(verifier.encode()).digest())
    state = secrets.token_urlsafe(24)
    redirect_uri = client['redirect_uris'][0]
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps({
        'state': state,
        'code_verifier': verifier,
        'scopes': scopes,
        'redirect_uri': redirect_uri,
    }, indent=2))
    params = {
        'client_id': client['client_id'],
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(scopes),
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
    }
    return client['auth_uri'] + '?' + urllib.parse.urlencode(params)


def parse_code(value: str):
    value = value.strip()
    if value.startswith('http://') or value.startswith('https://'):
        parsed = urllib.parse.urlparse(value)
        qs = urllib.parse.parse_qs(parsed.query)
        if 'error' in qs:
            raise SystemExit('Google returned error: ' + qs['error'][0])
        if 'code' not in qs:
            raise SystemExit('No code found in callback URL')
        return qs['code'][0], qs.get('state', [None])[0]
    return value, None


def exchange(code_input: str):
    client = load_client()
    state_obj = json.loads(STATE_PATH.read_text())
    code, returned_state = parse_code(code_input)
    if returned_state and returned_state != state_obj['state']:
        raise SystemExit('State mismatch; aborting')
    payload = urllib.parse.urlencode({
        'client_id': client['client_id'],
        'client_secret': client['client_secret'],
        'code': code,
        'code_verifier': state_obj['code_verifier'],
        'grant_type': 'authorization_code',
        'redirect_uri': state_obj['redirect_uri'],
    }).encode()
    req = urllib.request.Request(
        client['token_uri'],
        data=payload,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )
    with urllib.request.urlopen(req) as resp:
        token_data = json.loads(resp.read().decode())
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    token_data['scope'] = state_obj['scopes']
    token_data['client_id'] = client['client_id']
    token_data['token_uri'] = client['token_uri']
    TOKEN_PATH.write_text(json.dumps(token_data, indent=2))
    print('Saved token to', TOKEN_PATH)
    print('Scopes:', ', '.join(state_obj['scopes']))
    print('Refresh token present:', 'refresh_token' in token_data)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)

    p1 = sub.add_parser('auth-url')
    p1.add_argument('--scope', action='append', dest='scopes')

    p2 = sub.add_parser('exchange')
    p2.add_argument('code_or_url')

    args = ap.parse_args()
    if args.cmd == 'auth-url':
        scopes = args.scopes or DEFAULT_SCOPES
        print(generate_auth_url(scopes))
    elif args.cmd == 'exchange':
        exchange(args.code_or_url)


if __name__ == '__main__':
    main()
