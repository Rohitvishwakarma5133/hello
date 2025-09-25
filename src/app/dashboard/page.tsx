import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, PenTool, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock user data - replace with real data later
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Pro',
    wordsUsed: 8500,
    wordsLimit: 15000,
    recentActivity: [
      { id: 1, text: 'Humanized essay about climate change', words: 1250, date: '2 hours ago' },
      { id: 2, text: 'Blog post about AI technology', words: 890, date: '1 day ago' },
      { id: 3, text: 'Research paper summary', words: 670, date: '3 days ago' },
    ]
  };

  const usagePercentage = (userData.wordsUsed / userData.wordsLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {userData.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s an overview of your AI Humanizer activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Plan */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{userData.plan}</div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 mt-1">
                    Active
                  </Badge>
                </div>
                <Link href="/pricing">
                  <Button variant="outline" size="sm">Upgrade</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Words Used */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Words Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {userData.wordsUsed.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {userData.wordsLimit.toLocaleString()} this month
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Documents Processed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">24</div>
              <p className="text-sm text-muted-foreground">Processed this month</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-caribbean-green">98.5%</div>
              <p className="text-sm text-muted-foreground">Undetected by AI tools</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground truncate">{activity.text}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {activity.words} words
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">View All Activity</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/">
                  <Button className="w-full bg-caribbean-green hover:bg-caribbean-green/90 text-white">
                    Start Humanizing
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    Upgrade Plan
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full">
                  Account Settings
                </Button>
              </CardContent>
            </Card>

            {/* Usage Alert */}
            {usagePercentage > 80 && (
              <Card className="border-buttercup/50 bg-buttercup/5">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-buttercup">Usage Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-3">
                    You&apos;ve used {Math.round(usagePercentage)}% of your monthly words.
                  </p>
                  <Link href="/pricing">
                    <Button size="sm" className="bg-buttercup hover:bg-buttercup/90 text-black">
                      Upgrade Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Pro Features Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-caribbean-green/10 rounded-lg flex items-center justify-center mx-auto">
                  <Target className="h-6 w-6 text-caribbean-green" />
                </div>
                <h3 className="font-medium text-foreground">Advanced Engine</h3>
                <p className="text-sm text-muted-foreground">
                  More sophisticated humanization algorithms
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-dodger-blue/10 rounded-lg flex items-center justify-center mx-auto">
                  <PenTool className="h-6 w-6 text-dodger-blue" />
                </div>
                <h3 className="font-medium text-foreground">Writing Style</h3>
                <p className="text-sm text-muted-foreground">
                  Personalized to match your writing style
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center mx-auto">
                  <Rocket className="h-6 w-6 text-royal-purple" />
                </div>
                <h3 className="font-medium text-foreground">Priority Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get help faster with priority email support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}