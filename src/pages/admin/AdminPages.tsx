import { useState, useEffect } from 'react';
import { Save, FileText, Info, Phone, Shield, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminPages() {
  const { data: storeSettings, isLoading } = useStoreSettings();
  const updateStoreSettings = useUpdateStoreSettings();

  const [aboutData, setAboutData] = useState({
    about_hero_title: '',
    about_hero_image: '',
    about_story_title: '',
    about_story_p1: '',
    about_story_p2: '',
    about_value_1_title: '',
    about_value_1_text: '',
    about_value_2_title: '',
    about_value_2_text: '',
    about_value_3_title: '',
    about_value_3_text: '',
    about_value_4_title: '',
    about_value_4_text: '',
    about_stat_1_value: '',
    about_stat_1_label: '',
    about_stat_2_value: '',
    about_stat_2_label: '',
    about_stat_3_value: '',
    about_stat_3_label: '',
    about_stat_4_value: '',
    about_stat_4_label: '',
  });

  const [contactData, setContactData] = useState({
    contact_subtitle: '',
    contact_hours: '',
    contact_map_embed: '',
  });

  const [privacyData, setPrivacyData] = useState({
    privacy_title: '',
    privacy_content: '',
  });

  const [termsData, setTermsData] = useState({
    terms_title: '',
    terms_content: '',
  });

  useEffect(() => {
    if (storeSettings) {
      setAboutData({
        about_hero_title: storeSettings.about_hero_title || '',
        about_hero_image: storeSettings.about_hero_image || '',
        about_story_title: storeSettings.about_story_title || '',
        about_story_p1: storeSettings.about_story_p1 || '',
        about_story_p2: storeSettings.about_story_p2 || '',
        about_value_1_title: storeSettings.about_value_1_title || '',
        about_value_1_text: storeSettings.about_value_1_text || '',
        about_value_2_title: storeSettings.about_value_2_title || '',
        about_value_2_text: storeSettings.about_value_2_text || '',
        about_value_3_title: storeSettings.about_value_3_title || '',
        about_value_3_text: storeSettings.about_value_3_text || '',
        about_value_4_title: storeSettings.about_value_4_title || '',
        about_value_4_text: storeSettings.about_value_4_text || '',
        about_stat_1_value: storeSettings.about_stat_1_value || '',
        about_stat_1_label: storeSettings.about_stat_1_label || '',
        about_stat_2_value: storeSettings.about_stat_2_value || '',
        about_stat_2_label: storeSettings.about_stat_2_label || '',
        about_stat_3_value: storeSettings.about_stat_3_value || '',
        about_stat_3_label: storeSettings.about_stat_3_label || '',
        about_stat_4_value: storeSettings.about_stat_4_value || '',
        about_stat_4_label: storeSettings.about_stat_4_label || '',
      });
      setContactData({
        contact_subtitle: storeSettings.contact_subtitle || '',
        contact_hours: storeSettings.contact_hours || '',
        contact_map_embed: storeSettings.contact_map_embed || '',
      });
      setPrivacyData({
        privacy_title: storeSettings.privacy_title || 'Privacy Policy',
        privacy_content: storeSettings.privacy_content || '',
      });
      setTermsData({
        terms_title: storeSettings.terms_title || 'Terms & Conditions',
        terms_content: storeSettings.terms_content || '',
      });
    }
  }, [storeSettings]);

  const handleAboutSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings.mutateAsync(aboutData);
      toast.success('About page saved successfully');
    } catch {
      toast.error('Failed to save about page');
    }
  };

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings.mutateAsync(contactData);
      toast.success('Contact page saved successfully');
    } catch {
      toast.error('Failed to save contact page');
    }
  };

  const handlePrivacySave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings.mutateAsync(privacyData);
      toast.success('Privacy policy saved successfully');
    } catch {
      toast.error('Failed to save privacy policy');
    }
  };

  const handleTermsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings.mutateAsync(termsData);
      toast.success('Terms & conditions saved successfully');
    } catch {
      toast.error('Failed to save terms & conditions');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Page Content</h1>

      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            About Us
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Terms
          </TabsTrigger>
        </TabsList>

        {/* About Page Tab */}
        <TabsContent value="about">
          <form onSubmit={handleAboutSave} className="space-y-6">
            {/* Hero Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Hero Section</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Title</label>
                  <input
                    type="text"
                    value={aboutData.about_hero_title}
                    onChange={(e) => setAboutData({ ...aboutData, about_hero_title: e.target.value })}
                    className="input-shop"
                    placeholder="About Us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Image</label>
                  <ImageUpload
                    value={aboutData.about_hero_image}
                    onChange={(url) => setAboutData({ ...aboutData, about_hero_image: url })}
                    folder="pages"
                  />
                </div>
              </div>
            </div>

            {/* Story Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Our Story</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Section Title</label>
                  <input
                    type="text"
                    value={aboutData.about_story_title}
                    onChange={(e) => setAboutData({ ...aboutData, about_story_title: e.target.value })}
                    className="input-shop"
                    placeholder="Our Story"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Paragraph 1</label>
                  <textarea
                    value={aboutData.about_story_p1}
                    onChange={(e) => setAboutData({ ...aboutData, about_story_p1: e.target.value })}
                    className="input-shop min-h-[100px]"
                    placeholder="First paragraph..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Paragraph 2</label>
                  <textarea
                    value={aboutData.about_story_p2}
                    onChange={(e) => setAboutData({ ...aboutData, about_story_p2: e.target.value })}
                    className="input-shop min-h-[100px]"
                    placeholder="Second paragraph..."
                  />
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Values (4 Cards)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 p-4 border border-border rounded-lg">
                    <label className="block text-sm font-medium">Value {i} Title</label>
                    <input
                      type="text"
                      value={(aboutData as any)[`about_value_${i}_title`]}
                      onChange={(e) => setAboutData({ ...aboutData, [`about_value_${i}_title`]: e.target.value })}
                      className="input-shop"
                    />
                    <label className="block text-sm font-medium">Value {i} Text</label>
                    <input
                      type="text"
                      value={(aboutData as any)[`about_value_${i}_text`]}
                      onChange={(e) => setAboutData({ ...aboutData, [`about_value_${i}_text`]: e.target.value })}
                      className="input-shop"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Stats (4 Numbers)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 p-4 border border-border rounded-lg">
                    <label className="block text-sm font-medium">Stat {i} Value</label>
                    <input
                      type="text"
                      value={(aboutData as any)[`about_stat_${i}_value`]}
                      onChange={(e) => setAboutData({ ...aboutData, [`about_stat_${i}_value`]: e.target.value })}
                      className="input-shop"
                      placeholder="e.g. 5K+"
                    />
                    <label className="block text-sm font-medium">Stat {i} Label</label>
                    <input
                      type="text"
                      value={(aboutData as any)[`about_stat_${i}_label`]}
                      onChange={(e) => setAboutData({ ...aboutData, [`about_stat_${i}_label`]: e.target.value })}
                      className="input-shop"
                      placeholder="e.g. Happy Customers"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="btn-accent" disabled={updateStoreSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateStoreSettings.isPending ? 'Saving...' : 'Save About Page'}
            </Button>
          </form>
        </TabsContent>

        {/* Contact Page Tab */}
        <TabsContent value="contact">
          <form onSubmit={handleContactSave} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Page Settings</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Phone, email, address and WhatsApp are managed in Settings → Store Info.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitle Text</label>
                  <textarea
                    value={contactData.contact_subtitle}
                    onChange={(e) => setContactData({ ...contactData, contact_subtitle: e.target.value })}
                    className="input-shop min-h-[80px]"
                    placeholder="Have a question or need help?..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Hours</label>
                  <input
                    type="text"
                    value={contactData.contact_hours}
                    onChange={(e) => setContactData({ ...contactData, contact_hours: e.target.value })}
                    className="input-shop"
                    placeholder="Sat–Thu: 10am–8pm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Google Maps Embed URL</label>
                  <input
                    type="text"
                    value={contactData.contact_map_embed}
                    onChange={(e) => setContactData({ ...contactData, contact_map_embed: e.target.value })}
                    className="input-shop"
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the embed URL from Google Maps (Share → Embed a map → copy src URL)
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-accent" disabled={updateStoreSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateStoreSettings.isPending ? 'Saving...' : 'Save Contact Page'}
            </Button>
          </form>
        </TabsContent>

        {/* Privacy Policy Tab */}
        <TabsContent value="privacy">
          <form onSubmit={handlePrivacySave} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Privacy Policy</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Title</label>
                  <input
                    type="text"
                    value={privacyData.privacy_title}
                    onChange={(e) => setPrivacyData({ ...privacyData, privacy_title: e.target.value })}
                    className="input-shop"
                    placeholder="Privacy Policy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={privacyData.privacy_content}
                    onChange={(e) => setPrivacyData({ ...privacyData, privacy_content: e.target.value })}
                    className="input-shop min-h-[400px] font-mono text-sm"
                    placeholder="Write your privacy policy content here. You can use line breaks for formatting."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Line breaks will be preserved. You can use basic HTML tags for formatting (e.g., &lt;b&gt;, &lt;h2&gt;, &lt;ul&gt;).
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-accent" disabled={updateStoreSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateStoreSettings.isPending ? 'Saving...' : 'Save Privacy Policy'}
            </Button>
          </form>
        </TabsContent>

        {/* Terms & Conditions Tab */}
        <TabsContent value="terms">
          <form onSubmit={handleTermsSave} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Title</label>
                  <input
                    type="text"
                    value={termsData.terms_title}
                    onChange={(e) => setTermsData({ ...termsData, terms_title: e.target.value })}
                    className="input-shop"
                    placeholder="Terms & Conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={termsData.terms_content}
                    onChange={(e) => setTermsData({ ...termsData, terms_content: e.target.value })}
                    className="input-shop min-h-[400px] font-mono text-sm"
                    placeholder="Write your terms & conditions content here. You can use line breaks for formatting."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Line breaks will be preserved. You can use basic HTML tags for formatting (e.g., &lt;b&gt;, &lt;h2&gt;, &lt;ul&gt;).
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-accent" disabled={updateStoreSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateStoreSettings.isPending ? 'Saving...' : 'Save Terms & Conditions'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}