import smtplib
from email.mime.text import MIMEText

from fastapi import HTTPException

from app.core.config import settings


def send_email(to: str, subject: str, body: str):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to

    try:
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.ehlo()  # ✅ ESMTP handshake
        server.starttls()  # ✅ TLS
        server.ehlo()  # ✅ TLS dan keyin qayta handshake
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        # Log error, don't expose to user
        print(f"Email sending failed: {e}")
        raise HTTPException(status_code=500, detail="Email yuborishda xatolik")
