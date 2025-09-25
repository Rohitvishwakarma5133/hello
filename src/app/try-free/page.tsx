import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Check, ArrowRight, FileText, Zap, Shield } from 'lucide-react';

export default function TryFreePage() {
  const features = [
    'Transform AI text into human-like content',
    'Bypass AI detection tools',
    'Maintain original meaning and context',
    'Support for 20+ languages',
    'Plagiarism-free results',
    'No credit card required to start'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="bg-caribbean-green text-white mb-4 px-6 py-2 text-sm">
            Limited Time Offer
          </Badge>
          
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Try AI Humanizer
            <span className="block text-caribbean-green">Completely Free!</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform your AI-generated content into natural, human-like text that bypasses 
            detection tools. Start your free trial today - no strings attached!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-caribbean-green hover:bg-caribbean-green/90 text-white px-8 py-4 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
          <div className="text-sm text-muted-foreground">
            No credit card required • Cancel anytime
          </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <Card className="mb-12 bg-caribbean-green/5 border-caribbean-green/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              What You Get With Your Free Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-caribbean-green" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Free Trial Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-caribbean-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-caribbean-green" />
              </div>
              <CardTitle className="text-lg">1,000 Free Words</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Test our humanization engine with 1,000 words completely free. Perfect for trying out the service.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-dodger-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-dodger-blue" />
              </div>
              <CardTitle className="text-lg">Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get your humanized content in seconds. No waiting, no queues - just instant transformation.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-royal-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-royal-purple" />
              </div>
              <CardTitle className="text-lg">Undetectable AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our advanced algorithms ensure your content passes all major AI detection tools.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Social Proof */}
        <Card className="mb-12 bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Trusted by 10,000+ Content Creators
              </h3>
              <p className="text-muted-foreground">
                Join thousands of writers, students, and professionals who use AI Humanizer daily
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-caribbean-green">98.5%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-dodger-blue">2.1M+</div>
                <p className="text-sm text-muted-foreground">Words Processed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-royal-purple">24/7</div>
                <p className="text-sm text-muted-foreground">Support Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-caribbean-green/10 to-dodger-blue/10 border-caribbean-green/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Transform Your AI Content?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Join thousands of satisfied users who trust AI Humanizer to make their 
                AI-generated content sound perfectly human.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-caribbean-green hover:bg-caribbean-green/90 text-white px-8 py-4 text-lg font-semibold"
                  >
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="px-8 py-4">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                No spam, no hidden fees. Start transforming your content today.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Testimonials Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">
            What Our Users Say
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  AI Humanizer saved me hours of manual editing. The results are incredible - 
                  my content sounds completely natural now!
                </p>
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-caribbean-green/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-caribbean-green">SJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">Content Creator</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  Finally, a tool that actually works! My essays now pass every AI detector 
                  while maintaining perfect quality.
                </p>
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-dodger-blue/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-dodger-blue">MC</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Mike Chen</p>
                    <p className="text-xs text-muted-foreground">Graduate Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}