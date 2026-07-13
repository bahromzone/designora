import { z } from 'zod';

export const instructorApplicationSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta belgidan iborat bo‘lsin.'),
  email: z.string().email('Email manzil noto‘g‘ri.'),
  expertise: z.string().min(2, 'Yo‘nalishni kiriting.'),
  portfolioUrl: z.string().url('Portfolio uchun to‘liq havola kiriting.'),
  bio: z.string().min(30, 'Qisqa bio kamida 30 ta belgidan iborat bo‘lsin.'),
});

export const checkoutSchema = z.object({
  fullName: z.string().min(3, 'To‘liq ism kiriting.'),
  email: z.string().email('Email manzil noto‘g‘ri.'),
  plan: z.enum(['monthly', 'yearly', 'lifetime']),
  paymentMethod: z.enum(['card', 'paypal', 'bank']),
  notes: z.string().max(240, 'Izoh 240 belgidan oshmasin.').optional().or(z.literal('')),
});

export const profileSchema = z.object({
  firstName: z.string().min(2, 'Ism kiriting.'),
  lastName: z.string().min(2, 'Familiya kiriting.'),
  email: z.string().email('Email manzil noto‘g‘ri.'),
  headline: z.string().min(4, 'Sarlavha kiriting.'),
  bio: z.string().min(20, 'Bio kamida 20 ta belgidan iborat bo‘lsin.'),
});

export const forumThreadSchema = z.object({
  title: z.string().min(6, 'Mavzu sarlavhasi kamida 6 ta belgidan iborat bo‘lsin.'),
  category: z.enum(['community', 'portfolio', 'career', 'feedback']),
  body: z.string().min(30, 'Matn kamida 30 ta belgidan iborat bo‘lsin.'),
});

export const courseEditorSchema = z.object({
  title: z.string().min(6, 'Kurs nomini kiriting.'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  durationWeeks: z.coerce.number().min(1, 'Kamida 1 hafta bo‘lishi kerak.'),
  price: z.coerce.number().min(0, 'Narx manfiy bo‘lishi mumkin emas.'),
  summary: z.string().min(30, 'Qisqa tavsif kamida 30 ta belgidan iborat bo‘lsin.'),
  outcomes: z.string().min(20, 'Natijalar bo‘limini to‘ldiring.'),
});
