type BrandLogoProps = {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
};

const BrandLogo = ({ className = '', inverted = false, compact = false }: BrandLogoProps) => {
  const mainColor = inverted ? 'text-white' : 'text-slate-950 dark:text-white';
  const subColor = inverted ? 'text-white/55' : 'text-slate-500 dark:text-neutral-400';

  return (
    <span className={`inline-flex items-baseline whitespace-nowrap font-black tracking-tight ${className}`}>
      <span className={mainColor}>cinema</span>
      {!compact && <span className={subColor}>booking</span>}
      <span className="ml-0.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[0.72em] leading-none text-slate-950">
        .vn
      </span>
    </span>
  );
};

export default BrandLogo;
