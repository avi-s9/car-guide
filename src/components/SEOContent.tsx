import { Car, MapPin, Fuel, Users, DollarSign, Shield } from "lucide-react";

interface SEOContentProps {
  locationContext?: string;
}

export function SEOContent({ locationContext }: SEOContentProps) {
  const areaText = locationContext || "your area";
  
  return (
    <section 
      className="mt-16 pt-12 border-t border-border"
      aria-labelledby="how-it-works-heading"
    >
      {/* How It Works */}
      <article className="mb-12">
        <h2 
          id="how-it-works-heading"
          className="text-2xl font-bold mb-6 text-foreground"
        >
          How Our Car Recommendation Tool Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
              Share Your Needs
            </h3>
            <p className="text-sm leading-relaxed">
              Tell us about your daily driving habits, budget range, family size, and must-have features. 
              Whether you need a fuel-efficient commuter car or a spacious family SUV, we listen.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
              AI-Powered Matching
            </h3>
            <p className="text-sm leading-relaxed">
              Our intelligent algorithm analyzes thousands of vehicles across safety ratings, fuel economy, 
              reliability scores, and real-world owner reviews to find your best matches.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
              Get Personalized Picks
            </h3>
            <p className="text-sm leading-relaxed">
              Receive your top 3 car recommendations with detailed explanations of why each vehicle 
              suits your lifestyle, complete with price ranges and key specifications.
            </p>
          </div>
        </div>
      </article>

      {/* What We Help With */}
      <article className="mb-12">
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
                Compact cars for parking and commuting in {areaText}
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

      {/* FAQ Section with Schema-ready structure */}
      <article className="mb-8" itemScope itemType="https://schema.org/FAQPage">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg bg-muted/30"
            itemScope 
            itemProp="mainEntity" 
            itemType="https://schema.org/Question"
          >
            <h3 className="font-medium text-foreground" itemProp="name">
              What car should I buy for my budget?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-sm text-muted-foreground mt-2" itemProp="text">
                The best car for your budget depends on your specific needs. Our recommendation tool analyzes 
                your driving habits, family size, and must-have features to suggest vehicles that offer the 
                best value within your price range, whether that's under $15,000 for a reliable used car or 
                up to $50,000 for a fully-loaded new vehicle.
              </p>
            </div>
          </div>
          <div 
            className="p-4 rounded-lg bg-muted/30"
            itemScope 
            itemProp="mainEntity" 
            itemType="https://schema.org/Question"
          >
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
          <div 
            className="p-4 rounded-lg bg-muted/30"
            itemScope 
            itemProp="mainEntity" 
            itemType="https://schema.org/Question"
          >
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
