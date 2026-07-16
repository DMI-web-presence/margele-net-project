import Link from 'next/link';

const beadCategories = [
  'margele de sticla',
  'margele din plastic',
  'folie din argint',
  'Cernit',
  'Murano',
  'Toho',
  'pietre semipretioase',
  'pandantive',
  'accesorii bijuterii',
  'materiale pentru decoupage',
  'Fimo',
];

const polystyreneApplications = [
  'elemente de arhitectura interioare si exterioare',
  'cornise, plinte, scafe, baghete tavan',
  'capace de stalp si de gard',
  'mulaje pentru turnat beton',
  'logouri si litere de mari dimensiuni',
  'decoratiuni pentru ocazii speciale',
  'decoratiuni pentru spatii comerciale',
  'decoratiuni pentru nunta',
  'forme de tort',
];

const mapAddress = 'Str. Sovata 5, bl PC26, ap2, Oradea, Bihor, Romania';
const encodedMapAddress = encodeURIComponent(mapAddress);
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapAddress}`;
const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodedMapAddress}&output=embed`;

export default function AboutUsPageContent() {
  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 bg-gradient-to-br from-white via-slate-50 to-rose-50 p-6 sm:p-8 lg:p-10">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Despre noi
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  S.C. PAMIL S.R.L.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Magazin online de margele si accesorii, cu produse pentru bijuterii, decoratiuni
                  creative si proiecte handmade care cer atentie la detaliu.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCard title="CIF" value="RO63653" />
                <DetailCard title="Reg. com" value="J05/1012/1992" />
                <DetailCard title="Adresa" value="Str. Sovata 5, Oradea, Jud. Bihor" />
                <DetailCard title="Banca / IBAN" value="OTP BANK / RO94OTPV220001140453RO01" />
              </div>

              <div className="rounded-[1.75rem] border border-rose-200 bg-white/90 p-5 shadow-sm">
                <p className="text-base font-semibold text-slate-950">
                  Eleganta unei femei consta in atitudine si in ceea ce poarta.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Fiind femeie, iubesti foarte mult cumparaturile, iar bucuria cumpararii de bijuterii
                  este cu totul speciala. Cu ele iti poti pune in evidenta un gat lung, o mana delicata
                  sau o imbracaminte. Ce mai, purtandu-le atragi foarte multe priviri.
                </p>
              </div>
            </div>

            <aside className="space-y-4 border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Identitate
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Informatii oficiale</h2>
              <div className="space-y-3 text-sm leading-6 text-white/80">
                <p>
                  S.C. PAMIL S.R.L. comercializeaza o gama larga de margele si accesorii pentru
                  bijuterii, materiale pentru decoupage si produse pentru proiecte creative.
                </p>
                <p>
                  Compania noastra comercializeaza margele de sticla, de plastic, cu folie din
                  argint, Cernit, Murano, Toho, pietre semipretioase, pandantive, accesorii bijuterii,
                  materiale pentru decoupage, Fimo etc.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Contact rapid</p>
                <div className="mt-3 space-y-2 text-sm text-white/75">
                  <p>Str. Sovata 5, Oradea, Jud. Bihor</p>
                  <p>0259 267 109</p>
                  <p>degetarmargele@gmail.com</p>
                </div>
              </div>

              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-rose-50"
              >
                Vezi catalogul
              </Link>
            </aside>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
                Locatie
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Ne gasesti in Oradea
              </h2>
              <p className="text-sm leading-6 text-slate-600">{mapAddress}</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Deschide in Google Maps
              </a>
            </div>
            <iframe
              title="Harta Google Maps pentru S.C. PAMIL S.R.L."
              src={googleMapsEmbedUrl}
              className="h-[320px] w-full border-0 lg:h-full lg:min-h-[360px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
              Magazin online de margele si accesorii
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Selectie larga pentru bijuterii si decoratiuni
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Compania noastra comercializeaza o gama larga de produse pentru handmade, de la
              margele clasice si moderne pana la accesorii pentru bijuterii, elemente decorative si
              materiale tehnice.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {beadCategories.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-[#6a3c65] p-6 text-white shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Polistiren expandat / extrudat
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Solutii usoare pentru aplicatii creative si arhitecturale
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/80">
              Polistirenul expandat/extrudat este o alegere foarte buna pentru diverse aplicatii
              creative cu greutate redusa si pentru forme arhitecturale speciale.
            </p>
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Capacitate de debitare</p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Putem debita, cu echipamentul nostru, proiecte voluminoase de pana la 2 metri cubi,
                cu o precizie de cativa mm.
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Aplicatii
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Elemente realizate din polistiren
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Putem produce elemente dupa mostre existente sau desene trimise de client.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {polystyreneApplications.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-800"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}
