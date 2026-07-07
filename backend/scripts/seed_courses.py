"""Namunaviy kurslar bilan bazani to'ldirish (seed).

Bo'sh bazaga kurslar, modullar va darslar qo'shadi, shunda katalog,
qidiruv/filtr va kurs detali sahifalarini sinash mumkin bo'ladi.

Ishga tushirish (backend/ papkasida, venv yoqilgan holda):
    python -m scripts.seed_courses
    python -m scripts.seed_courses --force   # mavjud kurslarni o'chirib qayta yozadi

Eslatma: darajalar (level) frontend filtrlariga mos — beginner/intermediate/advanced.
Kategoriyalar kichik harfda (backend qidiruvi category.lower() bilan solishtiradi).
"""

import argparse
import sys

from app.core.database import SessionLocal
from app.models import Course, Lesson, Module

# ── Namunaviy kurslar ────────────────────────────────────────────────────────
# Har bir kurs: asosiy maydonlar + modullar (modules), har modulda darslar.
COURSES = [
    {
        "title": "Noldan Fashion Dizayn",
        "slug": "noldan-fashion-dizayn",
        "subtitle": "Eskizdan tayyor kolleksiyagacha bo'lgan to'liq yo'l",
        "description": (
            "Moda dizayni asoslari: siluet, rang, mato tanlash va professional "
            "eskiz chizish. Kurs oxirida o'z mini-kolleksiyangizni yaratasiz."
        ),
        "price": 490000,
        "category": "fashion",
        "level": "beginner",
        "language": "uz",
        "duration_minutes": 640,
        "rating_avg": 4.8,
        "rating_count": 124,
        "students_count": 1320,
        "thumbnail_url": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
        "learning_outcomes": [
            "Professional moda eskizlari chizish",
            "Rang va mato kombinatsiyalarini tanlash",
            "Mini-kolleksiya g'oyasini ishlab chiqish",
        ],
        "requirements": ["Qalam va qog'oz", "Oldindan tajriba shart emas"],
        "modules": [
            {
                "title": "Kirish va asoslar",
                "lessons": [
                    ("Kursga xush kelibsiz", 240, True),
                    ("Moda dizayni nima?", 620, True),
                    ("Kerakli jihozlar", 410, False),
                ],
            },
            {
                "title": "Eskiz chizish",
                "lessons": [
                    ("Siluet asoslari", 900, False),
                    ("Figura proporsiyalari", 1080, False),
                    ("Detallarni chizish", 950, False),
                ],
            },
        ],
    },
    {
        "title": "Pattern Making Mahorati",
        "slug": "pattern-making-mahorati",
        "subtitle": "O'lchov olishdan lekalo qurishgacha",
        "description": (
            "Kiyim uchun aniq lekalolar (pattern) qurish san'ati. O'lchov olish, "
            "asosiy bloklar va ularni modelga moslashtirish."
        ),
        "price": 620000,
        "category": "pattern",
        "level": "intermediate",
        "language": "uz",
        "duration_minutes": 720,
        "rating_avg": 4.6,
        "rating_count": 88,
        "students_count": 640,
        "thumbnail_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
        "learning_outcomes": [
            "Tana o'lchovlarini to'g'ri olish",
            "Asosiy lekalo bloklarini qurish",
            "Lekaloni modelga moslashtirish",
        ],
        "requirements": ["Santimetr lenta", "Fashion dizayn asoslari tavsiya etiladi"],
        "modules": [
            {
                "title": "O'lchov olish",
                "lessons": [
                    ("Kirish", 300, True),
                    ("Asosiy o'lchovlar", 780, False),
                ],
            },
            {
                "title": "Lekalo qurish",
                "lessons": [
                    ("Yubka bloki", 1200, False),
                    ("Korsaj bloki", 1350, False),
                ],
            },
        ],
    },
    {
        "title": "Matolar Dunyosi (Textile)",
        "slug": "matolar-dunyosi-textile",
        "subtitle": "Tola turlaridan parvarishgacha",
        "description": (
            "Tabiiy va sun'iy tolalar, mato to'qish usullari, sifatni aniqlash "
            "va matoni to'g'ri tanlash bo'yicha amaliy bilimlar."
        ),
        "price": 0,
        "category": "textile",
        "level": "beginner",
        "language": "uz",
        "duration_minutes": 320,
        "rating_avg": 4.9,
        "rating_count": 210,
        "students_count": 2510,
        "thumbnail_url": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&q=80",
        "learning_outcomes": [
            "Tola turlarini farqlash",
            "Mato sifatini baholash",
            "Loyihaga mos mato tanlash",
        ],
        "requirements": ["Hech qanday tayyorgarlik shart emas"],
        "modules": [
            {
                "title": "Tolalar",
                "lessons": [
                    ("Tabiiy tolalar", 520, True),
                    ("Sun'iy tolalar", 480, False),
                ],
            },
        ],
    },
    {
        "title": "Premium Brend Yaratish",
        "slug": "premium-brend-yaratish",
        "subtitle": "Kiyim brendini noldan qurish strategiyasi",
        "description": (
            "O'z moda brendingizni yaratish: nomlash, vizual identifikatsiya, "
            "narxlash va birinchi kolleksiyani bozorga chiqarish."
        ),
        "price": 890000,
        "category": "fashion",
        "level": "advanced",
        "language": "uz",
        "duration_minutes": 540,
        "rating_avg": 4.7,
        "rating_count": 56,
        "students_count": 410,
        "thumbnail_url": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
        "learning_outcomes": [
            "Brend pozitsiyasini aniqlash",
            "Vizual identifikatsiya yaratish",
            "Birinchi kolleksiyani rejalashtirish",
        ],
        "requirements": ["Fashion dizayn tajribasi", "Biznesga qiziqish"],
        "modules": [
            {
                "title": "Brend asoslari",
                "lessons": [
                    ("Brend nima?", 360, True),
                    ("Pozitsiyalash", 900, False),
                ],
            },
        ],
    },
    {
        "title": "Digital Fashion va CLO 3D",
        "slug": "digital-fashion-clo-3d",
        "subtitle": "3D kiyim modellashtirish asoslari",
        "description": (
            "CLO 3D dasturida raqamli kiyim yaratish: lekaloni 3D ga o'tkazish, "
            "mato simulyatsiyasi va render."
        ),
        "price": 750000,
        "category": "fashion",
        "level": "intermediate",
        "language": "uz",
        "duration_minutes": 480,
        "rating_avg": 4.5,
        "rating_count": 42,
        "students_count": 300,
        "thumbnail_url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
        "learning_outcomes": [
            "CLO 3D interfeysini o'zlashtirish",
            "Lekaloni 3D kiyimga aylantirish",
            "Mato simulyatsiyasi sozlash",
        ],
        "requirements": ["Kompyuter (8GB+ RAM)", "Pattern making asoslari"],
        "modules": [
            {
                "title": "CLO 3D bilan tanishuv",
                "lessons": [
                    ("O'rnatish va interfeys", 600, True),
                    ("Birinchi kiyim", 1100, False),
                ],
            },
        ],
    },
    {
        "title": "Moda Illyustratsiyasi",
        "slug": "moda-illyustratsiyasi",
        "subtitle": "Raqamli va an'anaviy fashion illustration",
        "description": (
            "Procreate va akvarel yordamida ta'sirchan moda illyustratsiyalari "
            "yaratish. Uslub, kompozitsiya va ranglar."
        ),
        "price": 390000,
        "category": "fashion",
        "level": "beginner",
        "language": "uz",
        "duration_minutes": 300,
        "rating_avg": 4.8,
        "rating_count": 97,
        "students_count": 880,
        "thumbnail_url": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        "learning_outcomes": [
            "Fashion figura chizish",
            "Procreate asboblari",
            "O'z uslubingizni topish",
        ],
        "requirements": ["iPad + Procreate (ixtiyoriy)", "Chizishga qiziqish"],
        "modules": [
            {
                "title": "Asoslar",
                "lessons": [
                    ("Materiallar", 300, True),
                    ("Fashion figura", 820, False),
                ],
            },
        ],
    },
]


def seed(force: bool = False) -> None:
    db = SessionLocal()
    try:
        existing = db.query(Course).count()
        if existing and not force:
            print(
                f"Bazada allaqachon {existing} ta kurs bor. "
                "Qayta seed uchun --force bilan ishga tushiring."
            )
            return

        if force and existing:
            print(f"--force: mavjud {existing} ta kurs o'chirilmoqda...")
            # Modul/dars cascade bilan o'chadi; darslarni ham tozalab qo'yamiz.
            db.query(Lesson).delete()
            db.query(Module).delete()
            db.query(Course).delete()
            db.commit()

        for data in COURSES:
            modules = data.pop("modules", [])
            course = Course(status="published", is_active=True, **data)
            db.add(course)
            db.flush()  # course.id olish uchun

            for m_order, m in enumerate(modules):
                module = Module(
                    course_id=course.id, title=m["title"], order=m_order
                )
                db.add(module)
                db.flush()

                for l_order, (title, secs, free) in enumerate(m["lessons"]):
                    db.add(
                        Lesson(
                            course_id=course.id,
                            module_id=module.id,
                            title=title,
                            order=l_order,
                            duration_seconds=secs,
                            is_free_preview=free,
                            type="video",
                            video_url="",
                        )
                    )

        db.commit()
        total = db.query(Course).count()
        print(f"Tayyor! Bazada endi {total} ta kurs bor.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Namunaviy kurslar seed qilish")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Mavjud kurslarni o'chirib, qaytadan seed qiladi",
    )
    args = parser.parse_args()
    seed(force=args.force)


if __name__ == "__main__":
    sys.exit(main())
