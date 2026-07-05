from core.config import settings
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

# Konfiguratsiya config.py dan olinadi
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,  # GMAIL APP PASSWORD
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,  # 587
    MAIL_SERVER=settings.MAIL_SERVER,  # smtp.gmail.com
    MAIL_STARTTLS=True,  # 🔴 MUHIM
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_reset_email(email_to: EmailStr, token: str):
    reset_link = f"http://127.0.0.1:8000/static/reset.html?token={token}"

    html = f"""
    <h1>Designora Platformasi</h1>
    <p>Parolni tiklash uchun bosing:</p>
    <a href="{reset_link}">Parolni tiklash</a>
    """

    message = MessageSchema(
        subject="Parolni tiklash (Designora)",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)
