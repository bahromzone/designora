import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import { useToast } from '../context/ToastContext';
import { useProfile, useUpdateProfile } from '../hooks/useAuth';
import { profileSchema } from '../lib/schemas/forms';

export default function ProfilePage() {
  const { success } = useToast();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      headline: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset(profileQuery.data);
    }
  }, [profileQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync(values);
    success('Profil ma’lumotlari yangilandi.');
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Profile form migration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Profile settings</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="First name" required error={errors.firstName?.message}>
            <input {...register('firstName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            <input {...register('lastName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
        </div>

        <FormField label="Email" required error={errors.email?.message}>
          <input type="email" {...register('email')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <FormField label="Headline" required error={errors.headline?.message}>
          <input {...register('headline')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <FormField label="Bio" required error={errors.bio?.message}>
          <textarea {...register('bio')} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <button
          type="submit"
          disabled={profileQuery.isLoading || updateProfile.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          {updateProfile.isPending ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
