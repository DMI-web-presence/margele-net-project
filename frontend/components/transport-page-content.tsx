const shippingTiers = [
  {
    title: 'Posta Romana',
    price: '17 lei',
    threshold: 'Sub 150 lei',
    description: 'Livrare economica pentru comenzile mici, cu acoperire larga in toata tara.',
  },
  {
    title: 'Curier rapid',
    price: '20 lei',
    threshold: 'Sub 300 lei',
    description: 'Livrare door-to-door prin Fan Courier, Nemo, DPD, GLS si alti parteneri disponibili.',
  },
  {
    title: 'Transport gratuit',
    price: '0 lei',
    threshold: 'Peste 300 lei',
    description: 'Ai livrare gratuita door-to-door prin curier rapid, fara costuri suplimentare.',
  },
];

const highlights = [
  {
    title: 'Transport gratuit cu Posta Romana',
    body: 'Pentru comenzile care depasesc 150 de lei beneficiezi de transport gratuit prin Posta Romana.',
  },
  {
    title: 'Curier gratuit la comenzi mai mari',
    body: 'La comenzile peste 300 de lei, transportul door-to-door este gratuit prin firma de curierat.',
  },
  {
    title: 'Livrare rapida',
    body: 'Termenul de livrare este de 1-2 zile lucratoare, in functie de curierul ales si zona de destinatie.',
  },
];

export default function TransportPageContent() {
  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f7f3fb] via-white to-[#eef4ff] p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(106,60,101,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(84,67,241,0.12),transparent_38%)]" />
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6a3c65]">
                    Informatii livrare
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Costuri Transport
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    Alegem varianta de livrare care se potriveste cel mai bine comenzii tale, cu
                    praguri clare pentru transport gratuit si costuri simple atunci cand comanda este
                    sub valoarea minima.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {highlights.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur"
                    >
                      <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Tarife actuale
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Cum se calculeaza</h2>
              <div className="mt-5 space-y-3">
                {shippingTiers.map((tier) => (
                  <div key={tier.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{tier.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/55">
                          {tier.threshold}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-white">{tier.price}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/75">{tier.description}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
              Sumar rapid
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Praguri de transport
            </h2>
            <div className="mt-5 space-y-4">
              <SummaryRow label="Sub 150 lei" value="17 lei" note="Posta Romana" />
              <SummaryRow label="150 lei +" value="gratuit" note="Posta Romana" />
              <SummaryRow label="Sub 300 lei" value="20 lei" note="Curier rapid" />
              <SummaryRow label="300 lei +" value="gratuit" note="Door-to-door" />
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-[#6a3c65] p-6 text-white shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
              Termen livrare
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">1-2 zile lucratoare</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">
              Termenul de livrare variaza in functie de curierul ales, adresa de destinatie si
              disponibilitatea retelei de transport. In mod obisnuit, comenzile ajung in 1-2 zile
              lucratoare.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Fan Courier</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Potrivit pentru livrari door-to-door rapide.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Nemo / DPD / GLS</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Alte optiuni de curierat, in functie de zona si preferinta.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{note}</p>
      </div>
      <p className="text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
