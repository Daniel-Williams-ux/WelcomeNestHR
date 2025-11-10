// src/components/ui/use-toast.ts
export const toast = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  // Simple fallback toast — replace with your fancier UI toast later.
  alert(`${title}${description ? '\n' + description : ''}`);
};