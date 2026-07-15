import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import { useToast } from '../context/ToastContext';
import { useSubmitInstructorApplication } from '../hooks/useInstructor';
import { instructorApplicationSchema } from '../lib/schemas/forms';

export default function InstructorApplyPage() {
  const { success } = useToast();
  const submitApplication = useSubmitInstructorApplication();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      expertise: '',
      portfolioUrl: '',
      bio: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await submitApplication.mutateAsync(values);
    success('Instructor ariza muvaffaqiyatli yuborildi.');
    reset();
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">React Hook Form + Zod</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Instructor application</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Full name" required error={errors.fullName?.message}>
            <input {...register('fullName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-indigo-400" />
          </FormField>
          <FormField label="Email" required error={errors.email?.message}>
            <input type="email" {...register('email')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
        </div>

        <FormField label="Expertise" required error={errors.expertise?.message}>
          <input {...register('expertise')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <FormField label="Portfolio URL" required error={errors.portfolioUrl?.message}>
          <input {...register('portfolioUrl')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <FormField label="Short bio" required error={errors.bio?.message}>
          <textarea {...register('bio')} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <button
          type="submit"
          disabled={submitApplication.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-4 w-4" />
          {submitApplication.isPending ? 'Yuborilmoqda...' : 'Arizani yuborish'}
        </button>
      </form>
    </div>
  );
}
