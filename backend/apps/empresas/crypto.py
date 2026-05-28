from cryptography.fernet import Fernet
from django.conf import settings

def get_fernet():
    return Fernet(settings.CERTIFICADO_FERNET_KEY)

def criptografar_senha(senha: str) -> bytes:
    return get_fernet().encrypt(senha.encode())

def descriptografar_senha(senha_criptografada: bytes) -> str:
    return get_fernet().decrypt(bytes(senha_criptografada)).decode()