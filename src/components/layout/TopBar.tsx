import { useStoreSettings } from '@/hooks/useStoreSettings';

export function TopBar() {
  const { data: storeSettings } = useStoreSettings();

  const text = storeSettings?.topbar_text || '';
  const enabled = storeSettings?.topbar_enabled !== 'false';

  if (!enabled || !text) return null;

  return (
    <div className="w-full bg-primary text-primary-foreground text-center text-xs sm:text-sm py-2 px-4">
      <p className="font-medium truncate">{text}</p>
    </div>
  );
}
