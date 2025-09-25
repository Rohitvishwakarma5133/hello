import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const monthlyPlans = [
  {
    name: 'Basic',
    price: '$8.99',
    period: 'month',
    wordLimit: '5,000 words per month',
    features: [
      '5,000 words per month',
      '500 words per request',
      'Basic Humanization Engine',
      'Plagiarism-free results',
      'Error-free rewriting',
      'Undetectable AI results',
      'Unlimited AI detection',
      'Supports 20+ languages',
      'Email support'
    ]
  },
  {
    name: 'Pro',
    price: '$24.99',
    period: 'month',
    wordLimit: '15,000 words per month',
    popular: true,
    features: [
      '15,000 words per month',
      '1,500 words per request',
      'My Writing Style personalization',
      'Advanced Humanization Engine',
      'Plagiarism-free results',
      'Error-free rewriting',
      'Undetectable AI results',
      'Unlimited AI detection',
      '50+ languages supported',
      'Advanced Turnitin Bypass Engine',
      'Human-like writing results',
      'Unlimited grammar checks',
      'Fast mode',
      'Priority email support'
    ]
  },
  {
    name: 'Ultra',
    price: '$49.99',
    period: 'month',
    wordLimit: '30,000 words per month',
    features: [
      '30,000 words per month',
      '3,000 words per request',
      'My Writing Style personalization',
      'Advanced Humanization Engine',
      'Plagiarism-free results',
      'Error-free rewriting',
      'Undetectable AI results',
      'Unlimited AI detection',
      '50+ languages supported',
      'Advanced Turnitin Bypass Engine',
      'Human-like writing results',
      'Unlimited grammar checks',
      'Fast mode',
      'Ultra-human writing output',
      'Priority support (chat + email)'
    ]
  }
];

const annualPlans = [
  {
    name: 'Basic',
    price: '$43.15',
    monthlyEquivalent: '$3.59',
    period: 'year',
    wordLimit: '5,000 words per month',
    features: ['All Basic features above']
  },
  {
    name: 'Pro',
    price: '$119.95',
    monthlyEquivalent: '$9.99',
    period: 'year',
    wordLimit: '15,000 words per month',
    popular: true,
    features: ['All Pro features above']
  },
  {
    name: 'Ultra',
    price: '$239.95',
    monthlyEquivalent: '$19.99',
    period: 'year',
    wordLimit: '30,000 words per month',
    features: ['All Ultra features above']
  }
];

interface Plan {
  name: string;
  price: string;
  period: string;
  wordLimit: string;
  popular?: boolean;
  features: string[];
  monthlyEquivalent?: string;
}

function PricingCard({ plan, isAnnual = false }: { plan: Plan, isAnnual?: boolean }) {
  return (
    <Card className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
        <div className="text-caribbean-green font-semibold text-sm mt-2">
          {plan.wordLimit}
        </div>
        <div className="mt-4">
          <span className="text-4xl font-bold text-foreground">{plan.price}</span>
          <span className="text-muted-foreground text-lg">/{plan.period}</span>
          {isAnnual && (
            <div className="text-sm text-muted-foreground mt-1">
              ({plan.monthlyEquivalent}/month)
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center space-x-3">
              <Check className="h-4 w-4 text-caribbean-green flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full mt-6 bg-caribbean-green hover:bg-caribbean-green/90 text-white py-3"
          size="lg"
        >
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your AI-generated content with our powerful humanization tools.
            Choose the plan that fits your needs.
          </p>
        </div>

        {/* Monthly Pricing */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mr-4">Monthly Pricing</h2>
            <Badge variant="outline" className="text-xs">Competitive</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {monthlyPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>

        {/* Annual Pricing */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mr-4">Annual Pricing</h2>
            <Badge className="bg-buttercup text-black">Save 60%</Badge>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              Billed annually, equivalent monthly shown for clarity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {annualPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} isAnnual={true} />
            ))}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center bg-muted/30 rounded-lg p-8">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Need Help Choosing?
          </h3>
          <p className="text-muted-foreground mb-6">
            All plans come with a 30-day money-back guarantee. Start with any plan and upgrade anytime.
          </p>
          <Button variant="outline" size="lg">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}