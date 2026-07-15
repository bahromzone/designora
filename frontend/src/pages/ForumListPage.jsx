import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquarePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import { useToast } from '../context/ToastContext';
import { useCreateForumThread, useForumThreads } from '../hooks/useForum';
import { forumThreadSchema } from '../lib/schemas/forms';

export default function ForumListPage() {
  const { success } = useToast();
  const threadsQuery = useForumThreads();
  const createThread = useCreateForumThread();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forumThreadSchema),
    defaultValues: {
      title: '',
      category: 'community',
      body: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createThread.mutateAsync(values);
    success('Yangi thread yaratildi.');
    reset();
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Optimistic forum flow</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Forum threads</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormField label="Thread title" required error={errors.title?.message}>
            <input {...register('title')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>

          <FormField label="Category" required error={errors.category?.message}>
            <select {...register('category')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400">
              <option value="community">Community</option>
              <option value="portfolio">Portfolio</option>
              <option value="career">Career</option>
              <option value="feedback">Feedback</option>
            </select>
          </FormField>

          <FormField label="Body" required error={errors.body?.message}>
            <textarea {...register('body')} rows={6} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>

          <button
            type="submit"
            disabled={createThread.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {createThread.isPending ? 'Posting...' : 'Create thread'}
          </button>
        </form>

        <div className="space-y-4">
          {(threadsQuery.data ?? []).map((threadItem) => (
            <article key={threadItem.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                    {threadItem.category}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{threadItem.title}</h2>
                </div>
                <div className="text-sm text-slate-500">{threadItem.replies} replies</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{threadItem.body}</p>
              <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{threadItem.author}</span>
                <span>{threadItem.createdAt}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
