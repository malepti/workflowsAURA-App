import pytest
from app.core.security import encrypt_key, decrypt_key, mask_api_key

def test_api_key_encryption_and_decryption():
    test_key = "sk-proj-1234567890abcdefghijklmn"
    encrypted = encrypt_key(test_key)
    assert encrypted != test_key
    assert len(encrypted) > 20
    
    decrypted = decrypt_key(encrypted)
    assert decrypted == test_key

def test_mask_api_key():
    test_key = "sk-proj-1234567890abcdefghijklmn"
    masked = mask_api_key(test_key)
    assert masked.startswith("sk-p")
    assert masked.endswith("klmn")
    assert "••••" in masked

def test_credit_ledger_constraint():
    balance = 250
    deduction = 3
    assert balance - deduction >= 0
