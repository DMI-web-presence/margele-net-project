'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function ReturnPageContent() {
  const [form, setForm] = useState<ReturnFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitAnimationVisible, setIsSubmitAnimationVisible] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
    };

    if (!payload.fullName || !payload.email || !payload.phone || !payload.orderNumber || !payload.productName) {
      setSuccess('');
      setError('Completeaza toate campurile obligatorii din formular.');
      return;
    }

    if (!payload.reason || !payload.outcome) {
      setSuccess('');
      setError('Selecteaza motivul returului si ce iti doresti mai departe.');
      return;
    }

    setIsSubmitting(true);
    setIsSubmitAnimationVisible(true);
    setError('');
    setSuccess('');

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
    setError('');
    setIsSubmitAnimationVisible(false);
    setSuccess('');
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f4f7ff] via-white to-[#fff3f3] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(84,67,241,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(106,60,101,0.10),transparent_36%)]" />
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <Badge className="bg-indigo-100 text-indigo-700">Retur produse</Badge>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Cerere asistata
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Formular pentru retur
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    Foloseste acest formular pentru a ne trimite rapid detaliile returului. Cu cat
                    adaugi mai exact informatiile comenzii si ale produsului, cu atat solutionarea
                    va fi mai rapida.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
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

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                Formular
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Datele returului
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Completeaza campurile de mai jos si noi preluam cererea de retur in cel mai scurt
                timp.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Nume complet"
                  id="full-name"
                  placeholder="Ex. Maria Popescu"
                  value={form.fullName}
                  onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
                />
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  placeholder="exemplu@email.com"
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                />
                <Field
                  label="Telefon"
                  id="phone"
                  type="tel"
                  placeholder="07xx xxx xxx"
                  value={form.phone}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                />
                <Field
                  label="Numar comanda"
                  id="order-number"
                  placeholder="Ex. 12345"
                  value={form.orderNumber}
                  onChange={(value) => setForm((current) => ({ ...current, orderNumber: value }))}
                />
                <Field
                  label="Produs returnat"
                  id="product-name"
                  placeholder="Ex. Margele de nisip mate 4mm"
                  value={form.productName}
                  onChange={(value) => setForm((current) => ({ ...current, productName: value }))}
                />
                <Field
                  label="SKU produs"
                  id="sku"
                  placeholder="Ex. rou-4mm-01"
                  value={form.sku}
                  onChange={(value) => setForm((current) => ({ ...current, sku: value }))}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivul returului</Label>
                  <select
                    id="reason"
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome">Ce iti doresti mai departe?</Label>
                  <select
                    id="outcome"
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    value={form.outcome}
                    onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))}
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Detalii suplimentare</Label>
                <Textarea
                  id="details"
                  placeholder="Spune-ne daca produsul a fost deteriorat, daca lipseste ceva din colet sau orice detaliu util."
                  value={form.details}
                  onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                />
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
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
