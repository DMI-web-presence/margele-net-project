'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Reveal from '@/components/reveal';
import { Textarea } from '@/components/ui/textarea';
import { createFormSpamState } from '@/lib/form-spam-protection';
import { z } from 'zod';

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  const limited = clean.slice(0, 10);
  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 4)} ${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
  }
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const returnSteps = [
  {
    title: 'Completeaza datele comenzii',
    body: 'Avem nevoie de numele tau, numarul comenzii si un mod rapid de contact pentru a procesa cererea.',
  },
  {
    title: 'Spune ce produs revii',
    body: 'Adauga produsul, SKU-ul daca il ai si motivul returului pentru o identificare mai rapida.',
  },
  {
    title: 'Trimite solicitarea',
    body: 'Dupa trimitere, echipa noastra revine cu pasii urmatori si eventuale clarificari.',
  },
];

const returnReasons = [
  'Produs gresit comandat',
  'Produs deteriorat',
  'Nu se potriveste',
  'Produs lipsa din colet',
  'Alt motiv',
];

const returnOutcomes = ['Rambursare', 'Schimb produs', 'Vreau sa discut cu echipa'];

const officialWithdrawalDetails = [
  {
    label: 'Operator',
    value: 'S.C. PAMIL S.R.L.',
  },
  {
    label: 'Adresa pentru notificare',
    value: 'Str. Sovata 5, bl PC26, ap. 2, Oradea, Bihor, Romania',
  },
  {
    label: 'E-mail',
    value: 'degetarmargele@gmail.com',
  },
  {
    label: 'Telefon',
    value: '0259 267 109',
  },
];

const legalHighlights = [
  'Pentru comenzile online, dreptul de retragere este de 14 zile calendaristice de la primirea produsului, conform art. 9 din OUG nr. 34/2014.',
  'Retragerea se poate face prin acest formular sau prin orice declaratie neechivoca transmisa inainte de expirarea termenului, conform art. 11.',
  'Produsele trebuie trimise inapoi in maximum 14 zile de la comunicarea retragerii, conform art. 14 alin. (1).',
  'Consumatorul suporta costurile directe de returnare, cu exceptia situatiilor in care comerciantul a acceptat altfel sau nu a informat consumatorul despre aceste costuri, conform art. 14 alin. (2).',
  'Pot exista exceptii de la dreptul de retragere pentru anumite categorii de produse, conform art. 16 din OUG nr. 34/2014.',
];

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  orderNumber: '',
  productName: '',
  sku: '',
  reason: '',
  outcome: '',
  details: '',
};

type ReturnFormState = typeof initialFormState;

const returnFormSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Numele complet trebuie sa aiba cel putin 3 caractere')
    .max(100, 'Numele complet nu poate depasi 100 de caractere'),
  email: z
    .string()
    .email('Adresa de email nu este valida')
    .max(100, 'Emailul nu poate depasi 100 de caractere'),
  phone: z
    .string()
    .min(10, 'Numarul de telefon este prea scurt')
    .max(15, 'Numarul de telefon este prea lung')
    .refine(
      (val) => {
        const clean = val.replace(/\s+/g, '').replace(/[-\(\)\.]/g, '');
        return /^(?:\+40|0040|40)?(0?[237][0-9]{8})$/.test(clean);
      },
      { message: 'Numarul de telefon nu este un numar valid din Romania (ex: 07xx xxx xxx)' }
    ),
  orderNumber: z
    .string()
    .min(1, 'Numarul comenzii este obligatoriu')
    .max(30, 'Numarul comenzii nu poate depasi 30 de caractere'),
  productName: z
    .string()
    .min(3, 'Numele produsului trebuie sa aiba cel putin 3 caractere')
    .max(200, 'Numele produsului nu poate depasi 200 de caractere'),
  sku: z
    .string()
    .max(50, 'SKU-ul nu poate depasi 50 de caractere')
    .optional()
    .or(z.literal('')),
  reason: z.string().min(1, 'Selecteaza motivul returului'),
  outcome: z.string().min(1, 'Selecteaza ce iti doresti mai departe'),
  details: z
    .string()
    .max(2000, 'Detaliile nu pot depasi 2000 de caractere')
    .optional()
    .or(z.literal('')),
});

export default function ReturnPageContent() {
  const [form, setForm] = useState<ReturnFormState>(initialFormState);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ReturnFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitAnimationVisible, setIsSubmitAnimationVisible] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [spamState, setSpamState] = useState(() => createFormSpamState());

  const handleFieldChange = (key: keyof ReturnFormState, value: string) => {
    let finalValue = value;
    if (key === 'phone') {
      finalValue = formatRomanianPhone(value);
    }
    setForm((current) => ({ ...current, [key]: finalValue }));
    if (validationErrors[key]) {
      setValidationErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      orderNumber: form.orderNumber.trim(),
      productName: form.productName.trim(),
      sku: form.sku.trim(),
      reason: form.reason.trim(),
      outcome: form.outcome.trim(),
      details: form.details.trim(),
      websiteUrl: spamState.websiteUrl,
      formStartedAt: spamState.formStartedAt,
    };

    setValidationErrors({});
    setError('');
    setSuccess('');

    const validation = returnFormSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ReturnFormState, string>> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof ReturnFormState;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setValidationErrors(fieldErrors);
      setError('Te rugam sa corectezi erorile din formular.');
      return;
    }

    setIsSubmitting(true);
    setIsSubmitAnimationVisible(true);

    try {
      const response = await fetch(`${backendUrl}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message || 'Nu am putut trimite cererea de retur.');
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });
      setForm(initialFormState);
      setSpamState(createFormSpamState());
      setSuccess(result?.message || 'Cererea de retur a fost trimisa cu succes.');
    } catch (submitError) {
      setSuccess('');
      setError(
        submitError instanceof Error ? submitError.message : 'Nu am putut trimite cererea de retur.',
      );
    } finally {
      setIsSubmitting(false);
      setIsSubmitAnimationVisible(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setValidationErrors({});
    setSpamState(createFormSpamState());
    setError('');
    setIsSubmitAnimationVisible(false);
    setSuccess('');
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="animate-hero-item overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f4f7ff] via-white to-[#fff3f3] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,32,72,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(79,32,72,0.10),transparent_36%)]" />
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <Badge className="bg-indigo-100 text-indigo-700">Formular de retragere</Badge>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Cerere asistata
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Formular de retragere
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    Foloseste acest formular pentru a ne trimite rapid detaliile retragerii. Cu cat
                    adaugi mai exact informatiile comenzii si ale produsului, cu atat solutionarea
                    va fi mai rapida.
                  </p>
                </div>

                <div className="home-stagger grid gap-4 md:grid-cols-3">
                  {returnSteps.map((step, index) => (
                    <Card key={step.title} className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                        Pasul {index + 1}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Inainte de retur
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ce ne ajuta cel mai mult</h2>

              <div className="mt-5 space-y-3">
                {returnReasons.map((reason) => (
                  <div key={reason} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{reason}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Unde ajunge cererea?</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Cererea ajunge la echipa noastra de suport si poate fi corelata rapid cu
                  comanda, produsul si motivul transmis.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <Reveal>
        <section className="home-stagger grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                Formular
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Datele retragerii
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Completeaza campurile de mai jos si noi preluam cererea de retragere in cel mai scurt
                timp.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <input
                type="text"
                name="websiteUrl"
                value={spamState.websiteUrl}
                onChange={(event) => setSpamState((current) => ({ ...current, websiteUrl: event.target.value }))}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Nume complet"
                  id="full-name"
                  placeholder="Ex. Maria Popescu"
                  value={form.fullName}
                  onChange={(value) => handleFieldChange('fullName', value)}
                  error={validationErrors.fullName}
                  maxLength={100}
                />
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  placeholder="exemplu@email.com"
                  value={form.email}
                  onChange={(value) => handleFieldChange('email', value)}
                  error={validationErrors.email}
                  maxLength={100}
                />
                <Field
                  label="Telefon"
                  id="phone"
                  type="tel"
                  placeholder="07xx xxx xxx"
                  value={form.phone}
                  onChange={(value) => handleFieldChange('phone', formatPhoneNumber(value))}
                  error={validationErrors.phone}
                  maxLength={12}
                />
                <Field
                  label="Numar comanda"
                  id="order-number"
                  placeholder="Ex. 12345"
                  value={form.orderNumber}
                  onChange={(value) => handleFieldChange('orderNumber', value)}
                  error={validationErrors.orderNumber}
                  maxLength={30}
                />
                <Field
                  label="Produs returnat"
                  id="product-name"
                  placeholder="Ex. Margele de nisip mate 4mm"
                  value={form.productName}
                  onChange={(value) => handleFieldChange('productName', value)}
                  error={validationErrors.productName}
                  maxLength={200}
                />
                <Field
                  label="SKU produs (optional)"
                  id="sku"
                  placeholder="Ex. rou-4mm-01"
                  value={form.sku}
                  onChange={(value) => handleFieldChange('sku', value)}
                  error={validationErrors.sku}
                  maxLength={50}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivul returului</Label>
                  <select
                    id="reason"
                    className={`flex h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${validationErrors.reason ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
                    value={form.reason}
                    onChange={(event) => handleFieldChange('reason', event.target.value)}
                  >
                    <option value="" disabled>
                      Alege un motiv
                    </option>
                    {returnReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  {validationErrors.reason ? (
                    <p className="text-xs font-semibold text-red-500">{validationErrors.reason}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome">Ce iti doresti mai departe?</Label>
                  <select
                    id="outcome"
                    className={`flex h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${validationErrors.outcome ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
                    value={form.outcome}
                    onChange={(event) => handleFieldChange('outcome', event.target.value)}
                  >
                    <option value="" disabled>
                      Alege optiunea
                    </option>
                    {returnOutcomes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {validationErrors.outcome ? (
                    <p className="text-xs font-semibold text-red-500">{validationErrors.outcome}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="details">Detalii suplimentare (optional)</Label>
                  <span className="text-[10px] text-slate-400">
                    {form.details.length}/2000
                  </span>
                </div>
                <Textarea
                  id="details"
                  placeholder="Spune-ne daca produsul a fost deteriorat, daca lipseste ceva din colet sau orice detaliu util."
                  value={form.details}
                  onChange={(event) => handleFieldChange('details', event.target.value)}
                  maxLength={2000}
                  className={validationErrors.details ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {validationErrors.details ? (
                  <p className="text-xs font-semibold text-red-500">{validationErrors.details}</p>
                ) : null}
              </div>

              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              {isSubmitAnimationVisible ? (
                <div className="flex items-center gap-3 text-sm font-semibold text-indigo-700">
                  <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  <span>Trimitem cererea...</span>
                </div>
              ) : null}
              {success && !isSubmitAnimationVisible ? (
                <p className="text-sm font-semibold text-emerald-700">{success}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Trimitem cererea...' : 'Trimite cererea'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
                  Reseteaza formularul
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Recomandari
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Cum facem procesul mai usor
            </h2>

            <div className="mt-6 space-y-4">
              <AdviceCard
                title="Pastreaza produsul si ambalajul"
                body="Este util sa pastrezi produsul in starea in care a ajuns pana cand primesti pasii urmatori."
              />
              <AdviceCard
                title="Adauga SKU-ul daca il ai"
                body="SKU-ul ne ajuta sa identificam exact varianta comandata, mai ales cand exista dimensiuni sau culori multiple."
              />
              <AdviceCard
                title="Ataseaza informatii clare"
                body="O descriere scurta si precisa accelereaza verificarea si reduce schimbul suplimentar de mesaje."
              />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Mai ai intrebari?</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Poti vedea si sectiunea noastra de ajutor pentru informatii suplimentare despre cont,
                comenzi si retururi.
              </p>
              <Link
                href="/cont/ajutor-faq"
                className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Vezi ajutorul
              </Link>
            </div>
          </Card>
        </section>
        </Reveal>

        <Reveal>
        <section className="home-stagger grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                Date oficiale
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Informatii pentru exercitarea retragerii
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Daca doresti sa iti exerciti dreptul de retragere, poti folosi formularul de mai
                sus sau poti transmite o declaratie clara catre comerciant, folosind datele de mai
                jos.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {officialWithdrawalDetails.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Baza legala
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Ce prevede OUG nr. 34/2014
            </h2>

            <div className="mt-6 space-y-3">
              {legalHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-500">
              Informatiile de mai sus sunt prezentate in acord cu OUG nr. 34/2014 privind
              drepturile consumatorilor in cadrul contractelor incheiate cu profesionistii.
            </p>
          </Card>
        </section>
        </Reveal>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  maxLength,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <Label htmlFor={id}>{label}</Label>
        {maxLength && value.length > 0 && (
          <span className="text-[10px] text-slate-400">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error ? (
        <p className="text-xs font-semibold text-red-500">{error}</p>
      ) : null}
    </div>
  );
}

function AdviceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function formatRomanianPhone(value: string): string {
  const clean = value.replace(/[^\d+]/g, '');
  
  if (clean.startsWith('+')) {
    if (clean.startsWith('+40')) {
      const rest = clean.slice(3).replace(/\D/g, '');
      return `+40 ${formatDigits(rest, false)}`.trim();
    }
    return clean;
  }
  
  if (clean.startsWith('0040')) {
    const rest = clean.slice(4).replace(/\D/g, '');
    return `0040 ${formatDigits(rest, false)}`.trim();
  }
  
  if (clean.startsWith('40') && clean.length > 2 && clean[2] !== '0') {
    const rest = clean.slice(2).replace(/\D/g, '');
    return `40 ${formatDigits(rest, false)}`.trim();
  }
  
  return formatDigits(clean, true);
}

function formatDigits(digits: string, hasLeadingZero: boolean): string {
  if (hasLeadingZero) {
    if (digits.length <= 4) {
      return digits;
    }
    if (digits.length <= 7) {
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  } else {
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
}
