import { formatBigValue } from '../game/format';

interface ResourceCardProps {
  label: string;
  value: string;
}

export function ResourceCard(props: Readonly<ResourceCardProps>) {
  return (
    <article className="resource-card">
      <p className="resource-label">{props.label}</p>
      <p className="resource-value">{formatBigValue(props.value)}</p>
    </article>
  );
}
