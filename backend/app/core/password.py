from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=13)


def _truncate(password: str) -> bytes:
    """
    bcrypt 72 baytlik cheklovi bor.
    Satrni UTF-8 baytga o'tkazib, 72 baytdan qirqamiz.
    verify_password da ham xuddi shu qirqish ishlatilishi shart.
    """
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return pwd.hash(_truncate(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(_truncate(plain), hashed)