import logging

# ✅ BUG #16 FIX: basicConfig() faqat bir marta ishlaydi — ikkinchi chaqiruv
# e'tiborga olinmaydi. Bu faylda basicConfig chaqirish main.py dagi
# RotatingFileHandler konfiguratsiyasini bekor qilishi mumkin edi
# (qaysi modul birinchi import qilinishiga bog'liq).
#
# Endi bu fayl faqat getLogger chaqiradi, konfiguratsiyani main.py ga qoldiradi.
logger = logging.getLogger(__name__)