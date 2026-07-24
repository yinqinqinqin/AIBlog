import ShinyText from "@/components/ShinyText";

type SectionBadgeProps = {
  text: string;
};

export default function SectionBadge({ text }: SectionBadgeProps) {
  return (
    <span className="section-label section-label--shape">
      <ShinyText
        className="section-label__shape-text"
        color="var(--section-shiny-base)"
        delay={0.15}
        shineColor="var(--section-shiny-highlight)"
        speed={2.6}
        spread={132}
        text={text}
      />
    </span>
  );
}
