import base64
import os
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    safe_pw = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(safe_pw, hashed_password)

def get_password_hash(password: str) -> str:
    safe_pw = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(safe_pw)

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
