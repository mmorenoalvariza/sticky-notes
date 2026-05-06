import type { Color } from '../../notes/types';
import styles from './ColorSwatch.module.css';

type Props = {
  color: Color;
  selected: boolean;
  onSelect: () => void;
};

export function ColorSwatch({ color, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`Color: ${color}`}
      className={`${styles.swatch} ${selected ? styles.selected : ''}`}
      style={{ background: `var(--note-${color})` }}
      onClick={onSelect}
    />
  );
}
