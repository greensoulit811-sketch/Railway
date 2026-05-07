import { Layout } from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Simply browse our products, add items to your cart, and proceed to checkout. Fill in your shipping details, select your preferred payment method, and confirm your order. You\'ll receive an order confirmation via SMS/email.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We currently accept Cash on Delivery (COD) for all orders. We\'re working on adding online payment options including credit/debit cards and mobile banking solutions.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'For orders within Dhaka, delivery typically takes 2-3 business days. For orders outside Dhaka, it usually takes 5-7 business days. You\'ll receive tracking updates along the way.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 7-day return policy for unused items in original packaging. If you\'re not satisfied with your purchase, please contact our support team to initiate a return.',
  },
  {
    question: 'How can I track my order?',
    answer:
      'Once your order is shipped, you\'ll receive a tracking number via SMS/email. You can use this to track your package on the courier\'s website.',
  },
  {
    question: 'Do you offer international shipping?',
    answer:
      'Currently, we only ship within Bangladesh. We\'re planning to expand our shipping options in the future.',
  },
  {
    question: 'How can I contact customer support?',
    answer:
      'You can reach us via phone at +880 1234 567890, email at hello@store.com, or through our Contact page. Our support team is available Saturday through Thursday, 10am to 8pm.',
  },
  {
    question: 'Can I modify or cancel my order?',
    answer:
      'You can request modifications or cancellations within 2 hours of placing your order. Please contact our support team immediately. Once the order is processed or shipped, changes cannot be made.',
  },
];

export default function FAQPage() {
  return (
    <Layout>
      <div className="container-shop section-padding">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about orders, shipping, and more.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-8 bg-secondary/50 rounded-2xl">
            <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help.
            </p>
            <a href="/contact" className="btn-accent px-6 py-3 rounded-lg font-medium inline-block">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
