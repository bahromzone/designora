# Cloudinary video upload

Designora instructor builder local video faylni brauzerdan Cloudinary'ga to'g'ridan-to'g'ri yuklaydi. Yuklangandan keyin `secure_url` avtomatik ravishda darsning `video_url` maydoniga saqlanadi.

## 1. Cloudinary sozlash

1. Cloudinary Console'ni oching.
2. **Settings → Upload → Upload presets → Add upload preset** ni tanlang.
3. Preset nomini `designora_videos` qiling.
4. Signing mode'ni **Unsigned** qiling.
5. Resource type'ni `Video` yoki `Auto` qiling.
6. Allowed formats'ni `mp4,mov,webm,m4v` bilan cheklang.
7. Folder uchun `designora/courses` ishlating.
8. Presetni saqlang va Cloudinary **Cloud name** qiymatini oling.

Unsigned preset secret talab qilmaydi, lekin u public upload endpoint bo'lgani uchun format, size va folder cheklovlarini presetda qattiq belgilang.

## 2. Frontend env

`frontend/.env.local` fayliga:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=designora_videos
```

Vite env o'zgargandan keyin dev serverni qayta ishga tushiring.

## 3. Ishlash tartibi

Instructor Builder → kurs → modul → dars → **Video yuklash**. Local fayl tanlanadi, progress ko'rinadi, Cloudinary `secure_url` qaytargach darsga biriktiriladi. **Ko'rish** havolasi orqali yuklangan videoni tekshirish mumkin.

Production uchun unsigned presetni faqat kerakli format va hajmga cheklang. Keyingi bosqichda uploadni signed preset yoki backend-generated signature bilan kuchaytirish mumkin.
