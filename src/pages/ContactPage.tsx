import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

export default function ContactPage() {
  const { t } = useSiteSettings();
  const { data: storeSettings, isLoading } = useStoreSettings();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent!', {
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const storePhone = storeSettings?.store_phone || '';
  const storeEmail = storeSettings?.store_email || '';
  const storeAddress = storeSettings?.store_address || '';
  const storeCity = storeSettings?.store_city || '';
  const whatsappNumber = storeSettings?.whatsapp_number || '';
  const contactSubtitle = storeSettings?.contact_subtitle || 'Have a question or need help? We\'re here for you. Reach out and we\'ll get back to you as soon as possible.';
  const contactHours = storeSettings?.contact_hours || 'Sat–Thu: 10am–8pm';
  const contactMapEmbed = storeSettings?.contact_map_embed || '';

  const fullAddress = [storeAddress, storeCity].filter(Boolean).join(', ');

  return (
    <Layout>
      <div className="container-shop section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('nav.contact')}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {contactSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('checkout.phone')}</h3>
              {storePhone ? (
                <a href={`tel:${storePhone}`} className="text-muted-foreground hover:text-foreground">
                  {storePhone}
                </a>
              ) : (
                <p className="text-muted-foreground/50 italic">Not configured</p>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('checkout.email')}</h3>
              {storeEmail ? (
                <a href={`mailto:${storeEmail}`} className="text-muted-foreground hover:text-foreground">
                  {storeEmail}
                </a>
              ) : (
                <p className="text-muted-foreground/50 italic">Not configured</p>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Hours</h3>
              <p className="text-muted-foreground">{contactHours}</p>
            </div>
          </div>

          {/* WhatsApp CTA */}
          {whatsappNumber && (
            <div className="mb-8">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat with us on WhatsApp
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('checkout.name')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('checkout.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="input-shop min-h-[150px]"
                    required
                  />
                </div>
                <Button type="submit" className="btn-accent w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Map/Address */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {contactMapEmbed && (
                <div className="h-64 bg-secondary">
                  <iframe
                    src={contactMapEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Our Location</h3>
                    {fullAddress ? (
                      <p className="text-muted-foreground">{fullAddress}</p>
                    ) : (
                      <p className="text-muted-foreground/50 italic">Address not configured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}