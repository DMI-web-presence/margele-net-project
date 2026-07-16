'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const inquiryTopics = [
  'Intrebare produs',
  'Comanda mai mare',
  'Disponibilitate stoc',
  'Colaborare',
  'Alt subiect',
];

function encodeMailto(value: string) {
  return encodeURIComponent(value);
}

export default function ContactPageContent() {
  const [name, setName] = useState('');
  const [contactDetail, setContactDetail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedContact = contactDetail.trim();
    const trimmedMessage = message.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedName || !trimmedContact || !trimmedMessage) {
      setError('Completeaza numele, un mod de contact si mesajul.');
      return;
    }

    setError('');

    const subject = trimmedTopic ? `Margele.net - ${trimmedTopic}` : 'Margele.net - Mesaj nou';
    const body = [
      `Nume: ${trimmedName}`,
      `Email sau telefon: ${trimmedContact}`,
      trimmedTopic ? `Subiect: ${trimmedTopic}` : null,
      '',
      trimmedMessage,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.href = `mailto:degetarmargele@gmail.com?subject=${encodeMailto(subject)}&body=${encodeMailto(body)}`;
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f7f4ff] via-white to-[#eef7ff] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(84,67,241,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(33,150,243,0.10),transparent_36%)]" />
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
                    pur si simplu o recomandare rapida, scrie-ne aici si pregatim mesajul pentru
                    email.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
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

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                Formular
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Mesajul tau
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Completeaza cateva campuri simple, iar butonul va deschide emailul pregatit cu toate
                detaliile completate.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Nume"
                  id="contact-name"
                  placeholder="Ex. Maria Popescu"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label="Email sau telefon"
                  id="contact-detail"
                  placeholder="exemplu@email.com sau 07xx xxx xxx"
                  value={contactDetail}
                  onChange={setContactDetail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-topic">Subiect</Label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <option value="">Alege un subiect</option>
                  {inquiryTopics.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Mesaj</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Scrie-ne ce produs te intereseaza sau cu ce te putem ajuta."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Trimite mesaj</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setName('');
                    setContactDetail('');
                    setTopic('');
                    setMessage('');
                    setError('');
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
}: {
  label: string;
  id: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
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
