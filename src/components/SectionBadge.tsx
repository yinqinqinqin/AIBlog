import ShinyText from "@/components/ShinyText";

type SectionBadgeProps = {
  text: string;
};

export default function SectionBadge({ text }: SectionBadgeProps) {
  return (
    <span className="section-label section-label--shape">
      <ShinyText
        className="section-label__shape-text"
        color="#8f96ab"
        delay={0.15}
        shineColor="#ffffff"
        speed={2.6}
        spread={132}
        text={text}
      />
    </span>
  );
}
