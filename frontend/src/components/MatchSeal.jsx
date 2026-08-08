export default function MatchSeal({ score, size = 60 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let ringColor = '#10B981'; // Green
  let bgGlow = 'rgba(16, 185, 129, 0.15)';
  let label = 'Strong';

  if (score >= 80) {
    ringColor = '#10B981'; // Emerald Green
    bgGlow = 'rgba(16, 185, 129, 0.15)';
    label = 'Strong';
  } else if (score >= 60) {
    ringColor = '#3B82F6'; // Bright Blue
    bgGlow = 'rgba(59, 130, 246, 0.15)';
    label = 'Good';
  } else {
    ringColor = '#F59E0B'; // Saffron/Amber
    bgGlow = 'rgba(245, 158, 11, 0.15)';
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
          stroke="rgba(148, 163, 184, 0.25)"
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
        <span className="font-mono font-bold text-navy-800 dark:text-white" style={{ fontSize: Math.max(size * 0.26, 10) }}>
          {score}%
        </span>
      </div>
    </div>
  );
}
