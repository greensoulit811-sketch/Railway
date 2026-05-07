import { Layout } from '@/components/layout/Layout';
import { Users, Award, Truck, Shield } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const VALUE_ICONS = [Award, Users, Truck, Shield];

export default function AboutPage() {
  const { data: s, isLoading } = useStoreSettings();

  const heroTitle = s?.about_hero_title || 'About Us';
  const heroImage = s?.about_hero_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80';
  const storyTitle = s?.about_story_title || 'Our Story';
  const storyP1 = s?.about_story_p1 || '';
  const storyP2 = s?.about_story_p2 || '';

  const values = [1, 2, 3, 4].map((i) => ({
    title: (s as any)?.[`about_value_${i}_title`] || '',
    text: (s as any)?.[`about_value_${i}_text`] || '',
    Icon: VALUE_ICONS[i - 1],
  }));

  const stats = [1, 2, 3, 4].map((i) => ({
    value: (s as any)?.[`about_stat_${i}_value`] || '',
    label: (s as any)?.[`about_stat_${i}_label`] || '',
  }));

  const hasValues = values.some((v) => v.title || v.text);
  const hasStats = stats.some((st) => st.value || st.label);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={heroImage}
          alt={heroTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">{heroTitle}</h1>
        </div>
      </section>

      <div className="container-shop section-padding">
        {/* Story */}
        {(storyP1 || storyP2) && (
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{storyTitle}</h2>
            {storyP1 && <p className="text-muted-foreground leading-relaxed mb-4">{storyP1}</p>}
            {storyP2 && <p className="text-muted-foreground leading-relaxed">{storyP2}</p>}
          </div>
        )}

        {/* Values */}
        {hasValues && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((v, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <v.Icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {hasStats && (
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((st, idx) => (
                <div key={idx}>
                  <p className="text-3xl md:text-4xl font-bold mb-2">{st.value}</p>
                  <p className="text-primary-foreground/70">{st.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}