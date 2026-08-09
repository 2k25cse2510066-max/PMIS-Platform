export default function MatchSeal({ score, size = 76 }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeGradientId = "gaugeGradGreen";

  if (score >= 75) {
    strokeGradientId = "gaugeGradPurple";
  } else if (score >= 50) {
    strokeGradientId = "gaugeGradBlue";
  } else {
    strokeGradientId = "gaugeGradGreen";
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0 rounded-full shadow-sm transition-transform hover:scale-105"
      style={{ width: size, height: size }}
      title={`${score}% overall ATS & Skill match`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="gaugeGradPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="gaugeGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="gaugeGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="stroke-slate-200 dark:stroke-white/10"
        />

        {/* Dynamic Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${strokeGradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
          {score}%
        </span>
      </div>
    </div>
  );
}
