import { Eye, Target } from 'lucide-react';

const companyStatements = [
  {
    title: 'Company Vision',
    description:
      "To become Tanzania's most reliable and technology-driven logistics partner, connecting businesses and people through efficient, affordable, and secure delivery solutions.",
    icon: Eye,
    accent: 'bg-accent/10 text-accent',
  },
  {
    title: 'Company Mission',
    description:
      'To simplify movement of goods and documents across Tanzania and beyond by combining innovation, local expertise, and customer-focused service - ensuring every delivery is fast, safe, and traceable.',
    icon: Target,
    accent: 'bg-primary/10 text-primary',
  },
];

export default function MissionVisionSection() {
  return (
    <section className="bg-gradient-to-br from-white via-gray-50 to-primary/5 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Our Direction
          </p>
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Built on a clear mission and vision
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Every delivery is guided by long-term reliability, practical innovation, and
            service people can trust.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {companyStatements.map((statement) => {
            const Icon = statement.icon;

            return (
              <article
                key={statement.title}
                className="h-full rounded-3xl bg-white p-8 shadow-lg shadow-gray-200/60 ring-1 ring-gray-100"
              >
                <div className={`mb-6 inline-flex rounded-2xl p-3 ${statement.accent}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">{statement.title}</h3>
                <p className="text-lg leading-8 text-gray-600">{statement.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
