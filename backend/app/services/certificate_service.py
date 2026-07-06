"""Sertifikat xizmati — verifikatsiya kodi + PDF generatsiyasi (BOSQICH 3)."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from pathlib import Path

# app/services/certificate_service.py -> app/
BASE_DIR = Path(__file__).resolve().parent.parent
CERT_DIR = BASE_DIR / "static" / "certificates"


def generate_verification_code() -> str:
    """URL-xavfsiz noyob tekshirish kodi."""
    return secrets.token_urlsafe(12)


def generate_serial() -> str:
    """Inson o'qiy oladigan seriya raqami: DSG-YYYY-XXXXXXXX."""
    year = datetime.now(UTC).strftime("%Y")
    return f"DSG-{year}-{secrets.token_hex(4).upper()}"


def _ensure_dir() -> None:
    CERT_DIR.mkdir(parents=True, exist_ok=True)


def generate_certificate_pdf(
    *,
    verification_code: str,
    serial: str,
    student_name: str,
    course_title: str,
    issued_at: datetime,
    grade: str | None = None,
    verify_url: str | None = None,
) -> str:
    """Sertifikat PDF faylini yaratadi va nisbiy URL (/static/...) qaytaradi.

    `reportlab` o'rnatilmagan bo'lsa RuntimeError ko'tariladi — chaqiruvchi
    buni ushlab, PDF'siz (lekin baribir verifikatsiya qilinadigan) sertifikat
    berishi mumkin.
    """
    _ensure_dir()
    out_path = CERT_DIR / f"{verification_code}.pdf"

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "PDF generatsiyasi uchun 'reportlab' kutubxonasi kerak"
        ) from exc

    width, height = landscape(A4)
    c = canvas.Canvas(str(out_path), pagesize=landscape(A4))

    # Ramka
    c.setStrokeColor(colors.HexColor("#6C4CF1"))
    c.setLineWidth(6)
    c.rect(15 * mm, 15 * mm, width - 30 * mm, height - 30 * mm)

    c.setFillColor(colors.HexColor("#6C4CF1"))
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(width / 2, height - 55 * mm, "SERTIFIKAT")

    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(
        width / 2, height - 75 * mm, "Ushbu sertifikat quyidagi shaxsga beriladi:"
    )

    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(width / 2, height - 95 * mm, student_name)

    c.setFont("Helvetica", 16)
    c.drawCentredString(
        width / 2,
        height - 112 * mm,
        "quyidagi kursni muvaffaqiyatli tamomlagani uchun:",
    )

    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 128 * mm, course_title)

    if grade:
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#333333"))
        c.drawCentredString(width / 2, height - 142 * mm, f"Baho: {grade}")

    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(25 * mm, 25 * mm, f"Sana: {issued_at.strftime('%Y-%m-%d')}")
    c.drawString(25 * mm, 20 * mm, f"Seriya: {serial}")
    c.drawRightString(
        width - 25 * mm, 25 * mm, f"Tekshirish kodi: {verification_code}"
    )
    if verify_url:
        c.drawRightString(width - 25 * mm, 20 * mm, verify_url)

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor("#6C4CF1"))
    c.drawCentredString(
        width / 2, 32 * mm, "Designora — Dizayn ta'limi platformasi"
    )

    c.showPage()
    c.save()

    return f"/static/certificates/{verification_code}.pdf"
