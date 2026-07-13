import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import { useToast } from '../context/ToastContext';
import { useCourseDraft, useSaveCourseDraft } from '../hooks/useCourses';
import { courseEditorSchema } from '../lib/schemas/forms';

export default function InstructorCourseEditPage() {
  const { success } = useToast();
  const courseDraftQuery = useCourseDraft();
  const saveCourseDraft = useSaveCourseDraft();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseEditorSchema),
    defaultValues: {
      title: '',
      level: 'intermediate',
      durationWeeks: 4,
      price: 0,
      summary: '',
      outcomes: '',
    },
  });

  useEffect(() => {
    if (courseDraftQuery.data) {
      reset(courseDraftQuery.data);
    }
  }, [courseDraftQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await saveCourseDraft.mutateAsync(values);
    success('Kurs draft yangilandi.');
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Course edit migration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Instructor course editor</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormField label="Course title" required error={errors.title?.message}>
          <input {...register('title')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Level" required error={errors.level?.message}>
            <select {...register('level')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </FormField>
          <FormField label="Duration (weeks)" required error={errors.durationWeeks?.message}>
            <input type="number" {...register('durationWeeks')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
          <FormField label="Price" required error={errors.price?.message}>
            <input type="number" {...register('price')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
        </div>

        <FormField label="Summary" required error={errors.summary?.message}>
          <textarea {...register('summary')} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <FormField label="Learning outcomes" required error={errors.outcomes?.message}>
          <textarea {...register('outcomes')} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <button
          type="submit"
          disabled={courseDraftQuery.isLoading || saveCourseDraft.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          {saveCourseDraft.isPending ? 'Saving...' : 'Save draft'}
        </button>
      </form>
    </div>
  );
}
