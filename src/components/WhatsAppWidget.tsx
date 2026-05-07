import { MessageCircle } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export function WhatsAppWidget() {
  const { data: settings } = useStoreSettings();
  const whatsappNumber = settings?.whatsapp_number;

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanNumber}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
