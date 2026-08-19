'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Reveal from '@/components/reveal';
import { Textarea } from '@/components/ui/textarea';
import { createFormSpamState } from '@/lib/form-spam-protection';
import { z } from 'zod';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const inquiryTopics = [
  'Intrebare produs',
  'Comanda mai mare',
  'Disponibilitate stoc',
  'Colaborare',
  'Alt subiect',
];

const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Numele complet trebuie sa aiba cel putin 2 caractere')
    .max(100, 'Numele complet nu poate depasi 100 de caractere'),
  contactDetail: z
    .string()
    .min(5, 'Emailul sau telefonul este prea scurt')
    .max(100, 'Emailul sau telefonul este prea lung')
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if (isEmail) return true;
        const clean = val.replace(/\s+/g, '').replace(/[-\(\)\.]/g, '');
        return /^(?:\+40|0040|40)?(0?[237][0-9]{8})$/.test(clean);
      },
      { message: 'Introdu o adresa de email valida sau un numar de telefon valid (ex: 07xx xxx xxx)' }
    ),
  topic: z.string().optional().or(z.literal('')),
  message: z
    .string()
    .min(10, 'Mesajul trebuie sa aiba cel putin 10 caractere')
    .max(3000, 'Mesajul nu poate depasi 3000 de caractere'),
});

export default function ContactPageContent() {
  const [name, setName] = useState('');
  const [contactDetail, setContactDetail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<Record<'name' | 'contactDetail' | 'topic' | 'message', string>>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitAnimationVisible, setIsSubmitAnimationVisible] = useState(false);
  const [spamState, setSpamState] = useState(() => createFormSpamState());

  const handleFieldChange = (key: 'name' | 'contactDetail' | 'topic' | 'message', value: string) => {
    let finalValue = value;
    if (key === 'contactDetail') {
      const isPhoneLike = /^[+\d\s\-(\)\.]*$/.test(value) && !/[a-zA-Z]/.test(value);
      if (isPhoneLike) {
        finalValue = formatRomanianPhone(value);
      }
    }
    if (key === 'name') setName(finalValue);
    if (key === 'contactDetail') setContactDetail(finalValue);
    if (key === 'topic') setTopic(finalValue);
    if (key === 'message') setMessage(finalValue);

    if (validationErrors[key]) {
      setValidationErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      contactDetail: contactDetail.trim(),
      topic: topic.trim(),
      message: message.trim(),
      websiteUrl: spamState.websiteUrl,
      formStartedAt: spamState.formStartedAt,
    };

    setValidationErrors({});
    setError('');
    setSuccess('');

    const validation = contactFormSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Partial<Record<'name' | 'contactDetail' | 'topic' | 'message', string>> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as 'name' | 'contactDetail' | 'topic' | 'message';
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
      const response = await fetch(`${backendUrl}/contact-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message || 'Nu am putut trimite mesajul.');
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });

      setName('');
      setContactDetail('');
      setTopic('');
      setMessage('');
      setSpamState(createFormSpamState());
      setSuccess(result?.message || 'Mesajul a fost trimis cu succes.');
    } catch (submitError) {
      setSuccess('');
      setError(submitError instanceof Error ? submitError.message : 'Nu am putut trimite mesajul.');
    } finally {
      setIsSubmitting(false);
      setIsSubmitAnimationVisible(false);
    }
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="animate-hero-item overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f7f4ff] via-white to-[#eef7ff] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,32,72,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(33,150,243,0.10),transparent_36%)]" />
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Contact
                  </p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Trimite-ne un mesaj
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Daca ai intrebari despre produse, comenzi mai mari, disponibilitate sau vrei
                    pur si simplu o recomandare rapida, scrie-ne aici si ne ocupam noi de restul.
                  </p>
                </div>

                <div className="home-stagger grid gap-4 md:grid-cols-3">
                  <InfoCard
                    title="Raspuns rapid"
                    body="Mesajele ajung direct in emailul nostru si pot fi preluate usor."
                  />
                  <InfoCard
                    title="Pentru produse"
                    body="E util sa mentionezi produsul sau categoria care te intereseaza."
                  />
                  <InfoCard
                    title="Pentru comenzi mari"
                    body="Putem discuta loturi mai mari, stoc si recomandari potrivite."
                  />
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Date contact
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ne gasesti usor</h2>

              <div className="mt-6 space-y-4 text-sm leading-6 text-white/80">
                <div>
                  <p className="font-semibold text-white">Adresa</p>
                  <p>Str. Sovata 5, bl PC26, ap2, Oradea, Bihor, Romania</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Telefon</p>
                  <a href="tel:+40259267109" className="transition hover:text-white">
                    0259 267 109
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <a href="mailto:degetarmargele@gmail.com" className="transition hover:text-white">
                    degetarmargele@gmail.com
                  </a>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Cand e util formularul</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Pentru intrebari rapide despre produse, stoc, recomandari sau comenzi mai mari.
                </p>
              </div>

              <Link
                href="/despre-noi"
                className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Vezi pagina Despre noi
              </Link>
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
                Mesajul tau
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Completeaza cateva campuri simple si trimite mesajul direct catre echipa noastra.
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
                  label="Nume"
                  id="contact-name"
                  placeholder="Ex. Maria Popescu"
                  value={name}
                  onChange={(value) => handleFieldChange('name', value)}
                  error={validationErrors.name}
                  maxLength={100}
                />
                <Field
                  label="Email sau telefon"
                  id="contact-detail"
                  placeholder="exemplu@email.com sau 07xx xxx xxx"
                  value={contactDetail}
                  onChange={(value) => handleFieldChange('contactDetail', value)}
                  error={validationErrors.contactDetail}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-topic">Subiect (optional)</Label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(event) => handleFieldChange('topic', event.target.value)}
                  className={`flex h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${validationErrors.topic ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
                >
                  <option value="">Alege un subiect</option>
                  {inquiryTopics.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {validationErrors.topic ? (
                  <p className="text-xs font-semibold text-red-500">{validationErrors.topic}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="contact-message">Mesaj</Label>
                  <span className="text-[10px] text-slate-400">
                    {message.length}/3000
                  </span>
                </div>
                <Textarea
                  id="contact-message"
                  placeholder="Scrie-ne ce produs te intereseaza sau cu ce te putem ajuta."
                  value={message}
                  onChange={(event) => handleFieldChange('message', event.target.value)}
                  maxLength={3000}
                  className={validationErrors.message ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {validationErrors.message ? (
                  <p className="text-xs font-semibold text-red-500">{validationErrors.message}</p>
                ) : null}
              </div>

              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              {isSubmitAnimationVisible ? (
                <div className="flex items-center gap-3 text-sm font-semibold text-indigo-700">
                  <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  <span>Trimitem mesajul...</span>
                </div>
              ) : null}
              {success && !isSubmitAnimationVisible ? (
                <p className="text-sm font-semibold text-emerald-700">{success}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>Trimite mesaj</Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setName('');
                    setContactDetail('');
                    setTopic('');
                    setMessage('');
                    setValidationErrors({});
                    setSpamState(createFormSpamState());
                    setError('');
                    setSuccess('');
                    setIsSubmitAnimationVisible(false);
                  }}
                >
                  Reseteaza
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Recomandari
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Cum sa ne scrii mai eficient
            </h2>

            <div className="mt-6 space-y-4">
              <InfoCard
                title="Mentioneaza produsul"
                body="Daca stii deja produsul sau categoria, include numele lui pentru raspuns mai rapid."
              />
              <InfoCard
                title="Spune ce iti doresti"
                body="E util sa stim daca intrebi despre stoc, o recomandare, o colaborare sau o comanda mai mare."
              />
              <InfoCard
                title="Lasa un contact usor"
                body="Emailul sau telefonul sunt suficiente. Alege varianta pe care o verifici cel mai des."
              />
            </div>
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
  placeholder,
  value,
  onChange,
  error,
  maxLength,
}: {
  label: string;
  id: string;
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

function InfoCard({ title, body }: { title: string; body: string }) {
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
