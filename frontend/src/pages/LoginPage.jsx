import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useToast } from '../context/ToastContext';
import { useLoginMutation } from '../hooks';
import { loginSchema } from '../lib/schemas/forms';

export default function LoginPage() {
  const { success } = useToast();
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const session = await loginMutation.mutateAsync(values);
    success(`${session.user.name} sifatida tizimga kirildi.`);
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center px-6 py-12">
      <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-900 p-8 text-white lg:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-indigo-200">React Hook Form</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            Designora’ga qaytganingdan xursandmiz.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
            Email va parol orqali tizimga xavfsiz kiring, keyin o‘qish yo‘lingiz, bildirishnomalar va progress panelingiz davom etadi.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-indigo-100">
            <ArrowRight className="h-4 w-4" />
            RHF + Zod bilan validatsiya qilinadigan auth flow
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
              <p className="text-sm text-slate-500">Akkauntingizga kiring</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <FormField label="Email" required error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              />
            </FormField>

            <FormField label="Password" required error={errors.password?.message}>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              />
            </FormField>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn className="h-4 w-4" />
              {loginMutation.isPending ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>

          <div className="my-6 h-px bg-slate-200" />
          <GoogleAuthButton />

          <p className="mt-6 text-sm text-slate-500">
            Akkauntingiz yo‘qmi?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Ro‘yxatdan o‘ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
