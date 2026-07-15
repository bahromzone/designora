import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormField } from '../components/form/FormField';
import { useToast } from '../context/ToastContext';
import { useSubmitCheckout } from '../hooks/usePayments';
import { checkoutSchema } from '../lib/schemas/forms';

export default function CheckoutPage() {
  const { success } = useToast();
  const submitCheckout = useSubmitCheckout();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: '',
      plan: 'yearly',
      paymentMethod: 'card',
      notes: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitCheckout.mutateAsync(values);
    success(`Checkout yaratildi: ${result.id}`);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Validated checkout</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Checkout</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Full name" required error={errors.fullName?.message}>
            <input {...register('fullName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
          <FormField label="Email" required error={errors.email?.message}>
            <input type="email" {...register('email')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
          </FormField>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Plan" required error={errors.plan?.message}>
            <select {...register('plan')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </FormField>
          <FormField label="Payment method" required error={errors.paymentMethod?.message}>
            <select {...register('paymentMethod')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400">
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank">Bank transfer</option>
            </select>
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400" />
        </FormField>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" />
            Secure checkout flow
          </div>
          <p className="mt-1">Forma RHF + Zod bilan validatsiya qilinadi, submit esa mutation orqali boshqariladi.</p>
        </div>

        <button
          type="submit"
          disabled={submitCheckout.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <CreditCard className="h-4 w-4" />
          {submitCheckout.isPending ? 'Processing...' : 'Proceed to pay'}
        </button>
      </form>
    </div>
  );
}
