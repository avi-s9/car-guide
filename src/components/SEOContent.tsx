import { Car, MapPin, Fuel, Users, DollarSign, Shield } from "lucide-react";

export function SEOContent() {
  return (
    <section className="mt-16 pt-12 border-t border-border">
      {/* How It Works */}
      <article id="how-it-works" className="mb-16 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          How Our Car Recommendation Tool Works
        </h2>
        <p className="text-muted-foreground mb-8 max-w-3xl leading-relaxed">
          We turn a few quick answers into practical car matches you can actually buy. The tool weighs your budget, daily driving needs, and ownership priorities to shortlist vehicles that fit your life—not generic "best car" lists.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
              Answer a few questions
            </h3>
            <p className="text-sm leading-relaxed">
              Set your budget, pick a vehicle type, choose your driving mix, and tell us what matters most — comfort, price, sportiness, or fuel economy.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
              We crunch the numbers
            </h3>
            <p className="text-sm leading-relaxed">
              Our algorithm scores every 2025 vehicle on price, MPG, comfort, and sportiness — weighted to your priorities — and narrows the field to your best matches.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
              Get your shortlist
            </h3>
            <p className="text-sm leading-relaxed">
              See your top-ranked cars with clear reasons for each pick, key specs, and pricing — ready to take to a dealership.
            </p>
          </div>
        </div>
      </article>

      {/* What We Help With */}
      <article className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Find the Best Car for Your Lifestyle
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">Budget-Friendly Options</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Best cars under $20k, $30k, or $40k that don't compromise on quality
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">Family-Friendly Vehicles</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Safest SUVs and minivans for families with kids, car seats, and cargo
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Fuel className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">Fuel-Efficient Cars</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Hybrids, EVs, and gas-sippers that save money at the pump
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">City & Suburban Driving</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Compact cars for parking and commuting in your area
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">Top Safety Picks</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vehicles with highest IIHS and NHTSA safety ratings
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Car className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-foreground text-sm">First Car Recommendations</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Reliable, affordable vehicles perfect for new drivers
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* FAQ Section */}
      <article id="faq" className="mb-8 scroll-mt-24" itemScope itemType="https://schema.org/FAQPage">
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">
          Get clear answers to common car-buying decisions, from setting the right budget to choosing the best vehicle type for your routine. These FAQs help you balance cost, efficiency, and long-term ownership value.
        </p>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 className="font-medium text-foreground" itemProp="name">
              What car should I buy for my budget?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-sm text-muted-foreground mt-2" itemProp="text">
                The best car for your budget depends on your specific needs. Our recommendation tool analyzes
                your driving habits and must-have features to suggest vehicles that offer the
                best value within your price range, whether that's under $20,000 or up to $80,000+.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 className="font-medium text-foreground" itemProp="name">
              How do I choose between an SUV, sedan, or truck?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-sm text-muted-foreground mt-2" itemProp="text">
                Choose based on your primary use case: Sedans are ideal for commuting and fuel efficiency.
                SUVs offer more cargo space and often better visibility, making them popular for families.
                Trucks provide towing capacity and utility for work or outdoor activities. Our tool helps
                you identify which body style matches your actual driving patterns.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 className="font-medium text-foreground" itemProp="name">
              Should I buy a hybrid or electric car?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-sm text-muted-foreground mt-2" itemProp="text">
                Hybrids are great if you want fuel savings without range anxiety — they work like regular cars
                but use less gas. Electric vehicles (EVs) are best if you have home charging and drive under
                250 miles daily. Consider local charging infrastructure, electricity costs, and available
                tax incentives in your region when deciding.
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Trust signals */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        <p>
          Our car recommendation engine is designed to help you make informed decisions.
          We don't sell cars or receive dealer commissions — just unbiased advice tailored to you.
        </p>
      </div>
    </section>
  );
}
