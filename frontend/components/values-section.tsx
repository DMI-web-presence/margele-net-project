const values = [
  {
    title: 'Pasiune',
    description: 'Suntem pasionati de creatie si credem ca fiecare proiect spune o poveste unica.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12">
        <path
          d="M12 20s-7.5-4.7-9.3-9A5.1 5.1 0 0 1 12 6a5.1 5.1 0 0 1 9.3 5c-1.8 4.3-9.3 9-9.3 9Z"
          className="fill-none stroke-current stroke-[1.6]"
        />
      </svg>
    ),
  },
  {
    title: 'Calitate',
    description: 'Selectam cu grija fiecare produs pentru a oferi calitate si durabilitate in timp.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12">
        <path d="M12 3 3.8 9.2 12 21l8.2-11.8L12 3Z" className="fill-none stroke-current stroke-[1.6]" />
        <path d="M3.8 9.2h16.4M8.5 9.2 12 21l3.5-11.8M8.5 9.2 12 3l3.5 6.2" className="fill-none stroke-current stroke-[1.6]" />
      </svg>
    ),
  },
  {
    title: 'Comunitate',
    description: 'Sustinem creatorii si construim o comunitate unde ideile se impartasesc si prind viata.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12">
        <path d="M16.5 18.5v-1.2c0-2.2-1.9-3.8-4.5-3.8s-4.5 1.6-4.5 3.8v1.2h9Z" className="fill-none stroke-current stroke-[1.6]" />
        <circle cx="12" cy="8" r="3" className="fill-none stroke-current stroke-[1.6]" />
        <path d="M18 11.5c1.9.3 3 1.6 3 3.4v1.1h-2.8M6 11.5c-1.9.3-3 1.6-3 3.4v1.1h2.8" className="fill-none stroke-current stroke-[1.6]" />
        <path d="M17.1 5.8a2.4 2.4 0 0 1 0 4.4M6.9 5.8a2.4 2.4 0 0 0 0 4.4" className="fill-none stroke-current stroke-[1.6]" />
      </svg>
    ),
  },
];

export default function ValuesSection() {
  return (
    <section className="bg-white mb-14">
      <div className="mx-auto max-w-[1370px] overflow-hidden rounded-[1.35rem] bg-[linear-gradient(105deg,#02081f_0%,#11103a_48%,#3a1470_100%)] px-8 py-7 text-white shadow-[0_18px_45px_rgba(17,16,58,0.22)] sm:px-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.38em] text-white/65">
            Valorile noastre
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Creativitatea incepe cu materialele potrivite.
          </h2>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-3 lg:gap-0">
          {values.map((value, index) => (
            <div
              key={value.title}
              className={`flex gap-5 lg:px-8 ${index > 0 ? 'lg:border-l lg:border-white/30' : ''}`}
            >
              <div className="shrink-0 text-[#9b62ff]">{value.icon}</div>
              <div>
                <h3 className="text-base font-bold text-white">{value.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/82">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
