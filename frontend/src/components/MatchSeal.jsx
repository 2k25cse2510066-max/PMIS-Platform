export default function MatchSeal({ score, size = 60 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let ringColor = '#10B981'; // Green
  let bgGlow = 'rgba(16, 185, 129, 0.1)';
  let label = 'Exceptional';

  if (score >= 80) {
    ringColor = '#10B981'; // Green
    bgGlow = 'rgba(16, 185, 129, 0.1)';
    label = 'Strong';
  } else if (score >= 60) {
    ringColor = '#173C6D'; // Navy
    bgGlow = 'rgba(23, 60, 109, 0.1)';
    label = 'Good';
  } else {
    ringColor = '#E8912A'; // Saffron
    bgGlow = 'rgba(232, 145, 42, 0.1)';
    label = 'Stretch';
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0 rounded-full shadow-sm transition-transform hover:scale-105"
      style={{ width: size, height: size, backgroundColor: bgGlow }}
      title={`${score}% overall match (${label})`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono font-bold text-navy-800" style={{ fontSize: size * 0.28 }}>
          {score}%
        </span>
      </div>
    </div>
  );
}
