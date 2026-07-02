'use client';

import { useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';

type FaqItem = {
  question: string;
  answer: string;
};

const supportCards = [
  {
    title: 'Comenzi',
    description: 'Vezi statusul comenzilor, produsele comandate si totalurile din istoricul tau.',
  },
  {
    title: 'Livrare',
    description: 'Comenzile sunt pregatite pentru expediere dupa confirmare si sunt livrate in 1-3 zile lucratoare.',
  },
  {
    title: 'Retur',
    description: 'Daca ai nevoie de retur, pastreaza produsele si ambalajul pana primesti instructiunile.',
  },
] as const;

const faqItems: FaqItem[] = [
  {
    question: 'Unde pot vedea comenzile mele?',
    answer:
      'Intra in Contul tau, apoi in sectiunea Comenzi. Acolo vezi istoricul comenzilor, statusul, totalul si produsele din fiecare comanda.',
  },
  {
    question: 'Cum modific adresa de livrare?',
    answer:
      'Mergi la Adresele mele, adauga o adresa noua sau modifica una existenta, apoi seteaz-o ca adresa implicita pentru livrare.',
  },
  {
    question: 'Pot schimba datele personale dupa creare cont?',
    answer:
      'Da. In Date personale poti actualiza numele, telefonul, tipul de client, data nasterii si datele de firma daca alegi Persoana juridica.',
  },
  {
    question: 'Cat dureaza livrarea?',
    answer:
      'Livrarea estimata este de 1-3 zile lucratoare dupa pregatirea comenzii. Durata poate varia in functie de curier si perioada aglomerata.',
  },
  {
    question: 'Cum returnez un produs?',
    answer:
      'Intra in sectiunea Comenzi si foloseste optiunea Returneaza un articol. Pentru moment, poti contacta echipa de suport cu numarul comenzii si produsul pe care vrei sa il returnezi.',
  },
  {
    question: 'De ce trebuie sa introduc parola actuala cand o schimb?',
    answer:
      'Este o masura de securitate. Parola actuala nu este salvata ca text, ci ca hash, deci nu poate fi afisata automat.',
  },
] as const;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-5 w-5 fill-none stroke-current stroke-2 transition ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="m4 7 6 6 6-6" />
    </svg>
  );
}

export default function AjutorFaqPage() {
  const [openQuestions, setOpenQuestions] = useState<number[]>([0]);

  const toggleQuestion = (index: number) => {
    setOpenQuestions((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[18rem_1fr]">
        <AccountSidebar activePath="/cont/ajutor-faq" />

        <section className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Ajutor & FAQ
          </h1>
          <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
            Gaseste rapid raspunsuri despre cont, comenzi, livrare si retururi.
          </p>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-8">
            <div className="grid gap-4 md:grid-cols-3">
              {supportCards.map((card) => (
                <section
                  key={card.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </section>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Intrebari frecvente
              </h2>

              <div className="mt-4 divide-y divide-slate-200 rounded-[1.5rem] border border-slate-200">
                {faqItems.map((item, index) => {
                  const isOpen = openQuestions.includes(index);

                  return (
                    <section key={item.question}>
                      <button
                        type="button"
                        onClick={() => toggleQuestion(index)}
                        aria-expanded={isOpen}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-base font-semibold text-slate-900">
                          {item.question}
                        </span>
                        <span className="shrink-0 text-slate-700">
                          <ChevronIcon open={isOpen} />
                        </span>
                      </button>

                      {isOpen ? (
                        <p className="px-5 pb-5 text-sm leading-6 text-slate-600">
                          {item.answer}
                        </p>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>

            <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Ai nevoie de ajutor?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pregateste numarul comenzii si adresa de email folosita in cont, apoi contacteaza
                echipa Margele.net pentru verificari mai rapide.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
