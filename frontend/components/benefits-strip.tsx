const benefits = [
  {
    title: 'Calitate',
    description: 'Produse selectate atent pentru bijuterii si decoratiuni handmade.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M7 11.5 11 3a2.2 2.2 0 0 1 2.2 2.7l-.8 3.1h5.1a2 2 0 0 1 1.9 2.6l-1.9 6.2A3 3 0 0 1 14.7 20H7V11.5Z" />
        <path d="M3.5 11.5H7V20H3.5V11.5Z" />
      </svg>
    ),
  },
  {
    title: 'Suport rapid',
    description: 'Ajutor pentru cont, comenzi si alegerea materialelor potrivite.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M8 5.5 6.4 3.9a1.8 1.8 0 0 0-2.8.4 5.4 5.4 0 0 0-.5 3.3c.8 5.4 5.9 10.5 11.3 11.3a5.4 5.4 0 0 0 3.3-.5 1.8 1.8 0 0 0 .4-2.8L16.5 14a1.9 1.9 0 0 0-2.2-.3l-1.4.8a10.4 10.4 0 0 1-3.4-3.4l.8-1.4A1.9 1.9 0 0 0 10 7.5Z" />
        <path d="M15.5 3.5a5 5 0 0 1 5 5" />
        <path d="M15.5 7a1.5 1.5 0 0 1 1.5 1.5" />
      </svg>
    ),
  },
  {
    title: 'Transport',
    description: 'Livrare estimata in 1-3 zile lucratoare pentru produsele disponibile.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M3 6h11v10H3V6Z" />
        <path d="M14 10h3.5l3 3v3H14v-6Z" />
        <path d="M6.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    ),
  },
  {
    title: 'Retur 14 zile',
    description: 'Poti returna produsele comandate timp de 14 zile.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M4 9a8 8 0 1 1 2.4 5.7" />
        <path d="M4 4v5h5" />
      </svg>
    ),
  },
  {
    title: 'Plata sigura',
    description: 'Comenzile pot fi pregatite pentru plata online si confirmare rapida.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    ),
  },
  {
    title: 'Stoc actualizat',
    description: 'Produsele din catalog pot fi sincronizate cu baza de date PostgreSQL.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
        <path d="M4 12.5 12 17l8-4.5" />
        <path d="M4 17.5 12 22l8-4.5" />
      </svg>
    ),
  },
] as const;

export default function BenefitsStrip() {
  return (
    <section className="bg-[#f7f1f5]">
      <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-6 py-7 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-16 xl:grid-cols-6">
        {benefits.map((benefit, index) => (
          <div
            key={benefit.title}
            className="animate-benefit-item flex flex-col items-center text-center text-[#70416b]"
            style={{ animationDelay: `${900 + index * 150}ms` }}
          >
            <div className="mb-2">{benefit.icon}</div>
            <h2 className="text-xl font-semibold tracking-wide text-slate-950">{benefit.title}</h2>
            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-700">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
