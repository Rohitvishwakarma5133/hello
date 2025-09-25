'use client';

import { useState } from 'react';
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


export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const plans = billing === 'monthly' ? monthlyPlans : annualPlans;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-black mb-3">
            Choose Your Plan
          </h1>
          <p className="text-base text-[#64748B] max-w-2xl mx-auto">
            Transform your AI-generated content with our powerful humanization tools. Choose the plan that fits your needs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex rounded-[10px] border border-[#64748B]/40 p-1 bg-white">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'text-[#64748B] hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                billing === 'annual'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'text-[#64748B] hover:bg-gray-100'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-2 border-green-500 shadow-lg' : 'border border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-black">{plan.name}</CardTitle>
                <div className="text-[#64748B] font-medium text-sm mt-2">
                  {plan.wordLimit}
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-black">{plan.price}</span>
                  <span className="text-[#64748B] text-base">/{plan.period}</span>
                  {billing === 'annual' && plan.monthlyEquivalent && (
                    <div className="text-sm text-[#64748B] mt-1">
                      ({plan.monthlyEquivalent}/month)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-[#64748B]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none font-semibold py-3">
                  Subscribe
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center bg-gray-50 rounded-lg p-8 mt-14">
          <h3 className="text-xl font-semibold text-black mb-3">
            Need Help Choosing?
          </h3>
          <p className="text-[#64748B] mb-6 text-sm">
            All plans come with a 30-day money-back guarantee. Start with any plan and upgrade anytime.
          </p>
          <button className="bg-white text-[#64748B] border border-gray-300 rounded-[10px] px-5 py-2 text-sm hover:bg-gray-100 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
