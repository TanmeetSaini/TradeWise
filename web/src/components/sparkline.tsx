// small 7 day price line chart
export default function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 32;

  const min = Math.min(...data);
  const max = Math.max(...data);
  let range = max - min;
  if (range === 0) {
    range = 1;
  }

  // turn each price into an x,y point (y is flipped so higher prices sit higher)
  const points = data.map((price, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((price - min) / range) * height;
    return `${x},${y}`;
  });

  const line = points.join(" ");
  // add bottom corners so we can shade under the line
  const area = `0,${height} ${line} ${width},${height}`;
  let colorClass: string;
  if (data[data.length - 1] >= data[0]) {
    colorClass = "text-up";
  } else {
    colorClass = "text-down";
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className={colorClass}
    >
      <polygon points={area} fill="currentColor" opacity={0.08} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
