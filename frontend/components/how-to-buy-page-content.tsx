const purchaseSteps = [
  {
    title: 'Fa-ti contul',
    body: 'In momentul cand ati intrat in magazinul nostru trebuie sa va faceti cont si astfel nu veti plati taxa de ambalare in valoare de 3.00 lei. Acest lucru se poate efectua folosindu-va de sectiunea Inregistrare si completand campurile cerute.',
  },
  {
    title: 'Autentifica-te la fiecare vizita',
    body: 'De fiecare data cand intrati in magazinul nostru trebuie sa va autentificati. Din acest moment puteti comanda produsele dorite navigand in paginile site-ului nostru.',
  },
  {
    title: 'Controleaza cosul',
    body: 'Pe toata durata vizitei in meniul Produse aveti control asupra comenzii: puteti adauga produse sau puteti renunta la un produs apasand butonul din dreptul lui: STERGE.',
  },
];

const orderNotes = [
  'Daca dintr-o comanda vor lipsi 1, 2, 3 produse, coletul va fi expediat fara acele produse, fara o notificare in prealabil.',
  'Daca din comanda exista mai mult de 25% lipsa din valoarea totala a comenzii, veti fi contactat ca sa stim cum procedam.',
  'Daca doriti sa achitati cu Op Bancar, va rugam sa asteptati confirmarea produselor de catre noi, pe urma se realizeaza plata.',
];

const chooseProductSteps = [
  'Daca cunoasteti deja codul produsului il introduceti in campul CAUTA si se va afisa automat acel produs.',
  'In alte situatii se merge direct la produsele din grupele mari precum Andrele, Crosete s.a.m.d si se cauta produsul dorit.',
  'Va puteti folosi pentru alegerea produsului de informatiile tehnice si comerciale incluse in acest site.',
];

const howToOrderSteps = [
  'In momentul cand ati gasit produsul care corespunde nevoilor dvs tot ce va mai ramane de facut e sa tastati cantitatea dorita in bucati si sa apasati link-ul COMANDA.',
  'Imediat vi se va afisa cosul personal de cumparaturi. Dupa ce ati adaugat produsul, puteti sa va intoarceti sa continuati cumparaturile.',
  'In momentul in care v-ati umplut cosul trimiteti comanda folosind butonul Trimite comanda.',
  'Daca nu aveti cont la noi cand apasati butonul TRIMITE COMANDA, va aparea automat o alta pagina in care se cer datele dvs personale pentru a va putea procesa comanda colegii nostri.',
  'Cand trimiteti comanda veti primi automat in adresa dvs de e-mail un mesaj intitulat Confirmare primire comanda.',
  'Cand coletul dvs este pus la Posta Romana sau trimis prin curierat veti primi un alt mesaj intitulat Confirmare expediere colet.',
];

const legalTexts = [
  'Legea comertului electronic - 365/2002',
  'Regulament nr. 4/2002 al BNR privind tranzactiile efectuate prin intermediul instrumentelor de plata electronica si relatiile dintre participantii la aceste tranzactii',
  'Legea semnaturii electronice - 429 / 2001',
  'Norme tehnice si metodologice din 13 decembrie 2001 pentru aplicarea Legii nr. 455/2001 privind semnatura electronica',
  'Legea 51/2003 pentru aprobarea Ordonantei Guvernului nr. 130/2000 privind regimul juridic al contractelor la distanta',
  'Ordonanta nr. 130/2000 privind regimul juridic al contractelor la distanta',
  'Hotarirea Guvernului nr. 1308 din 11/20/2002 privind aprobarea Normelor metodologice pentru aplicarea Legii 365/2002 privind comertul electronic',
  'Legea privind clauzele abuzive incheiate intre comercianti si consumatori, nr. 193/2000',
  'Legea pentru protectia persoanelor cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestor date - 677 / 2001',
  'Ordin nr. 1453 din 1 martie 2001 privind ocupatia de Designer pagini web',
  'Legea nr 8/1996 privind dreptul de autor si drepturile conexe',
  'Dispozitii privind Prevenirea si combaterea criminalitatii informatice',
  'Legea privind prevenirea si combaterea pornografiei - 196/2003',
];

export default function HowToBuyPageContent() {
  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 sm:p-8 lg:p-10">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Cum cumpar
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Ghid simplu pentru comenzi
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Urmatorii pasi te ajuta sa intri rapid in cont, sa alegi produsele dorite si sa
                  finalizezi comanda in cele mai bune conditii.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {purchaseSteps.map((step, index) => (
                  <article
                    key={step.title}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                      Pasul {index + 1}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
                  </article>
                ))}
              </div>

              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                  Foarte important
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-800">
                  VA RUGAM SA COMPLETATI NUMELE SI PRENUMELE COMPLET INAINTE DE A TRIMITE COMANDA
                  CATRE NOI, IAR ADRESA DVS MENTIONATA IN COMANDA SA CORESPUNDA CU CEA DIN BULETIN.
                  IN CAZUL IN CARE DOMICILIUL DVS ESTE ALTUL DECAT CEL DIN BULETIN, SPECIFICATI CAND
                  NE TRIMITETI COMANDA CA DORITI SA FIE POST RESTANT O.P DE CARE APARTINETI + NUMELE
                  SI PRENUMELE DVS.
                </p>
              </div>
            </div>

            <aside className="space-y-4 border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Conditii
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Ce trebuie sa stii</h2>

              <div className="space-y-3">
                {orderNotes.map((note) => (
                  <div key={note} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm leading-6 text-white/80">{note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Cum aleg un produs?</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-white/75">
                  {chooseProductSteps.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
              Cum comand
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Pasii pentru finalizarea comenzii
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
              {howToOrderSteps.map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-[#6a3c65] p-6 text-white shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
              Legislatia romana in domeniul comertului electronic
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Referinte si acte normative
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {legalTexts.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-6 text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Explicatie
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Cum aleg un produs si cum comand
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                E foarte simplu. In cazul in care cunoasteti deja codul produsului il introduceti in
                campul CAUTA si se va afisa automat acel produs. In alte situatii se merge direct la
                produsele din grupele mari precum Andrele, Crosete s.a.m.d si se cauta produsul
                dorit.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MiniNote title="Mesaje automate" body="Veti primi confirmarea primirii comenzii si, la expediere, confirmarea coletului." />
              <MiniNote title="Plata" body="Pentru Op Bancar asteptati confirmarea produselor de catre noi, apoi se realizeaza plata." />
              <MiniNote title="Cosul" body="Puteti adauga sau sterge produse oricand, folosind butonul STERGE." />
              <MiniNote title="Contact" body="Daca avem nevoie de clarificari despre o comanda, va vom contacta direct." />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
