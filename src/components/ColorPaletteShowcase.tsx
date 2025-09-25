import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ColorPaletteShowcase() {
  return (
    <div className="p-8 space-y-8 bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">AI Humanizer</h1>
        <p className="text-xl text-muted-foreground">
          Showcase of the new color palette using shadcn/ui
        </p>
      </div>

      {/* Primary Action Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Primary Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default Primary</Button>
          <Button variant="caribbean-green">Caribbean Green</Button>
          <Button variant="dodger-blue">Dodger Blue</Button>
        </div>
      </section>

      {/* Secondary Action Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Secondary Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary">Secondary</Button>
          <Button variant="royal-purple">Royal Purple</Button>
          <Button variant="buttercup">Buttercup</Button>
          <Button variant="muddy-waters">Muddy Waters</Button>
          <Button variant="viking">Viking</Button>
        </div>
      </section>

      {/* Neutral Elements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Neutral Elements</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards & Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>
                This card uses the default background and foreground colors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge>Default Badge</Badge>
                <p className="text-sm text-muted-foreground">
                  Using Silver (#bdbdbd) for muted elements and Emperor Gray (#4f4f4f) for text.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground">
            <CardHeader>
              <CardTitle>Accent Card</CardTitle>
              <CardDescription className="text-accent-foreground/80">
                This card uses Muddy Waters as the accent color.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary">Muddy Waters</Badge>
                <Button size="sm" className="bg-caribbean-green text-white hover:bg-caribbean-green/90">
                  Action
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Primary Border</CardTitle>
              <CardDescription>
                Card with Caribbean Green border styling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className="bg-royal-purple text-white">Royal Purple</Badge>
                <div className="w-full h-2 bg-gradient-to-r from-caribbean-green via-dodger-blue to-royal-purple rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Color Swatches */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-caribbean-green rounded-lg"></div>
            <p className="text-sm font-medium">Caribbean Green</p>
            <p className="text-xs text-muted-foreground">#02bb86</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-dodger-blue rounded-lg"></div>
            <p className="text-sm font-medium">Dodger Blue</p>
            <p className="text-xs text-muted-foreground">#3486f3</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-royal-purple rounded-lg"></div>
            <p className="text-sm font-medium">Royal Purple</p>
            <p className="text-xs text-muted-foreground">#8645a5</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-buttercup rounded-lg"></div>
            <p className="text-sm font-medium">Buttercup</p>
            <p className="text-xs text-muted-foreground">#f4a40f</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-muddy-waters rounded-lg"></div>
            <p className="text-sm font-medium">Muddy Waters</p>
            <p className="text-xs text-muted-foreground">#bb855f</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-full h-20 bg-viking rounded-lg"></div>
            <p className="text-sm font-medium">Viking</p>
            <p className="text-xs text-muted-foreground">#5d8bb</p>
          </div>
        </div>
      </section>

      {/* Border and Divider Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Borders & Dividers</h2>
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm">Default border using Silver (#bdbdbd)</p>
          </div>
          <hr className="border-muted" />
          <div className="p-4 border-2 border-muted-foreground rounded-lg">
            <p className="text-sm">Emphasized border using Emperor Gray (#4f4f4f)</p>
          </div>
        </div>
      </section>

      {/* Dark Mode Toggle Hint */}
      <section className="text-center p-6 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          Toggle your system&apos;s dark mode to see how the colors adapt automatically
        </p>
      </section>
    </div>
  )
}