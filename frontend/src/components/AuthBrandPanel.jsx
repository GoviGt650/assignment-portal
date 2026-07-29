import { BookOpen, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';

const defaultFeatures = [
  'Centralized assignment hub',
  'Secure file & GitHub submissions',
  'Real-time submission tracking',
];

export default function AuthBrandPanel({
  badge = 'Built for modern training programs',
  headline = 'Submit smarter.',
  highlight = 'Track everything.',
  description = 'One professional portal for assignment distribution, submissions, and progress — no more lost PDFs in chat groups.',
  features = defaultFeatures,
  footer = 'Teachers manage · Students submit · Everyone stays organized',
}) {
  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.45),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.2),_transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 p-12">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/20 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/40">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Academy ASP</p>
            <p className="text-xs text-slate-200">Assignment Submission Portal</p>
          </div>
        </div>

        <div className="mt-16 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
            <Sparkles size={14} className="text-sky-200" />
            {badge}
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            {headline}
            <span className="mt-1 block text-sky-100 drop-shadow-[0_2px_12px_rgba(56,189,248,0.35)]">
              {highlight}
            </span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-slate-200">
            {description}
          </p>
        </div>

        <ul className="mt-12 space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-slate-100">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                <CheckCircle2 size={16} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 border-t border-white/15 p-12">
        <div className="flex items-center gap-3 text-slate-300">
          <GraduationCap size={18} className="text-sky-200" />
          <p className="text-sm">{footer}</p>
        </div>
      </div>
    </div>
  );
}
