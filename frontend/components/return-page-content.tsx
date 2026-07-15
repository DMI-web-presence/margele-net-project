import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function ReturnPageContent() {
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

            <form className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nume complet" id="full-name" placeholder="Ex. Maria Popescu" />
                <Field label="Email" id="email" type="email" placeholder="exemplu@email.com" />
                <Field label="Telefon" id="phone" type="tel" placeholder="07xx xxx xxx" />
                <Field label="Numar comanda" id="order-number" placeholder="Ex. 12345" />
                <Field label="Produs returnat" id="product-name" placeholder="Ex. Margele de nisip mate 4mm" />
                <Field label="SKU produs" id="sku" placeholder="Ex. rou-4mm-01" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivul returului</Label>
                  <select
                    id="reason"
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    defaultValue=""
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
                    defaultValue=""
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
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Trimite cererea</Button>
                <Button type="button" variant="secondary">
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
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} />
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
