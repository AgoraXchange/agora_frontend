import Image from "next/image";

interface IconProps {
  name: string;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export function Icon({
  name,
  width = 24,
  height = 24,
  className = "",
  alt = "",
}: IconProps) {
  return (
    <Image
      src={`/assets/icons/${name}.svg`}
      width={width}
      height={height}
      className={className}
      alt={alt || name}
    />
  );
}