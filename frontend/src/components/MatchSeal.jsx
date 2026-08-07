export default function MatchSeal({ score, size = 64 }) {
  const color = score >= 75 ? 'text-leaf-600 border-leaf-500' : score >= 50 ? 'text-navy-700 border-navy-500' : 'text-saffron-600 border-saffron-500';
  return (
    <div
      className={`seal ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      title={`${score}% match`}
    >
      {score}
      <span style={{ fontSize: size * 0.16 }} className="ml-0.5 opacity-70">%</span>
    </div>
  );
}
