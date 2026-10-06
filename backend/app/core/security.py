import base64
import os
import hashlib
import secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def get_password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return "pbkdf2_sha256$100000$" + salt.hex() + "$" + hashed.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith("pbkdf2_sha256$"):
            parts = hashed_password.split("$")
            if len(parts) != 4:
                return False
            iterations = int(parts[1])
            salt = bytes.fromhex(parts[2])
            expected_hash = bytes.fromhex(parts[3])
            computed_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
            return secrets.compare_digest(computed_hash, expected_hash)
        else:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return pwd_context.verify(plain_password[:72], hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def encrypt_key(raw_key: str) -> str:
    """Encrypt user API keys with AES-256-GCM before saving to database."""
    key = settings.ENCRYPTION_MASTER_KEY.encode()[:32].ljust(32, b'0')
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, raw_key.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_key(encrypted_payload: str) -> str:
    """Decrypt user API keys for backend provider inference."""
    key = settings.ENCRYPTION_MASTER_KEY.encode()[:32].ljust(32, b'0')
    raw_data = base64.b64decode(encrypted_payload.encode('utf-8'))
    nonce = raw_data[:12]
    ciphertext = raw_data[12:]
    aesgcm = AESGCM(key)
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted.decode('utf-8')

def mask_api_key(raw_key: str) -> str:
    if len(raw_key) <= 8:
        return "••••••••"
    return f"{raw_key[:4]}••••••••••••••••{raw_key[-4:]}"
