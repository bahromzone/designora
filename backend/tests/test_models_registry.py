"""`app.models` barcha model modullarini ro'yxatga olishini tekshiradi.

Nega muhim: `scripts/prepare_migrations.py` yangi bazada sxemani
`Base.metadata` dan quradi va SO'NG Alembic head'ni stamp qiladi. Metadata
to'liq bo'lmasa, ro'yxatga olinmagan jadvallar umuman yaratilmaydi va
migratsiyalar ham ularni qaytarib bermaydi.

Tekshiruv alohida jarayonda bajariladi: shu test jarayonida boshqa testlar
allaqachon `app.main` ni (demak barcha modellarni) import qilib bo'lgan
bo'lishi mumkin va natija yolg'on yashil bo'lardi.
"""

import subprocess
import sys
from pathlib import Path

import app.models

_CHECK = """
import sys
from pathlib import Path

import app.models

package_dir = Path(app.models.__file__).parent
expected = {p.stem for p in package_dir.glob("*.py")} - {"__init__"}
missing = sorted(m for m in expected if f"app.models.{m}" not in sys.modules)
print(",".join(missing))
"""


def test_models_package_registers_every_module():
    backend_dir = Path(app.models.__file__).parents[2]
    result = subprocess.run(
        [sys.executable, "-c", _CHECK],
        capture_output=True,
        text=True,
        check=True,
        cwd=backend_dir,
    )
    missing = [name for name in result.stdout.strip().split(",") if name]
    assert not missing, (
        "Bu model modullari app/models/__init__.py da import qilinmagan, "
        f"ya'ni jadvallari yangi bazada yaratilmaydi: {missing}"
    )
