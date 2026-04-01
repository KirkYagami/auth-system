from passlib.context import CryptContext
import hashlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# def hash_password(plain: str) -> str:
#     return pwd_context.hash(plain)


# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    sha256_hash = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.hash(sha256_hash)

def verify_password(password: str, hashed: str) -> bool:
    password_bytes = password.encode("utf-8")
    sha256_hash = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.verify(sha256_hash, hashed)