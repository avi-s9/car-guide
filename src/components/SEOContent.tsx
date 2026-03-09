import { Car, MapPin, Fuel, Users, DollarSign, Shield } from "lucide-react";

export function SEOContent() {
  return (
    <section className="space-y-20">
      {/* How It Works */}
      <article id="how-it-works" className="scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We turn a few quick answers into practical car matches you can actually buy. The tool weighs your budget, daily driving needs, and ownership priorities to shortlist vehicles that fit your life—not generic "best car" lists.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Answer a few questions",
              desc: "Set your budget, pick a vehicle type, choose your driving mix, and tell us what matters most.",
            },
            {
              step: "2",
              title: "We crunch the numbers",
              desc: "Our algorithm scores every 2025 vehicle on price, MPG, comfort, and sportiness — weighted to your priorities.",
            },
            {
              step: "3",
              title: "Get your shortlist",
              desc: "See your top-ranked cars with clear reasons for each pick, key specs, and pricing — ready to research further.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="relative p-6 rounded-2xl border border-border bg-card">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </article>

      {/* What We Help With */}
      <article>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
            Find the best car for your lifestyle
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: DollarSign, title: "Budget-Friendly Options", desc: "Best cars under $20k, $30k, or $40k that don't compromise on quality" },
            { icon: Users, title: "Family-Friendly Vehicles", desc: "Safest SUVs and minivans for families with kids, car seats, and cargo" },
            { icon: Fuel, title: "Fuel-Efficient Cars", desc: "Hybrids, EVs, and gas-sippers that save money at the pump" },
            { icon: MapPin, title: "City & Suburban Driving", desc: "Compact cars for parking and commuting in your area" },
            { icon: Shield, title: "Top Safety Picks", desc: "Vehicles with highest IIHS and NHTSA safety ratings" },
            { icon: Car, title: "First Car Recommendations", desc: "Reliable, affordable vehicles perfect for new drivers" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-medium text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* FAQ Section */}
      <article id="faq" className="scroll-mt-24" itemScope itemType="https://schema.org/FAQPage">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get clear answers to common car-buying decisions, from setting the right budget to choosing the best vehicle type for your routine. These FAQs help you balance cost, efficiency, and long-term ownership value.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              q: "What car should I buy for my budget?",
              a: "The best car for your budget depends on your specific needs. Our recommendation tool analyzes your driving habits and must-have features to suggest vehicles that offer the best value within your price range, whether that's under $20,000 or up to $80,000+.",
            },
            {
              q: "How do I choose between an SUV, sedan, or truck?",
              a: "Choose based on your primary use case: Sedans are ideal for commuting and fuel efficiency. SUVs offer more cargo space and often better visibility, making them popular for families. Trucks provide towing capacity and utility for work or outdoor activities. Our tool helps you identify which body style matches your actual driving patterns.",
            },
            {
              q: "Should I buy a hybrid or electric car?",
              a: "Hybrids are great if you want fuel savings without range anxiety — they work like regular cars but use less gas. Electric vehicles (EVs) are best if you have home charging and drive under 250 miles daily. Consider local charging infrastructure, electricity costs, and available tax incentives in your region when deciding.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              className="p-5 rounded-xl border border-border bg-card"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h3 className="font-medium text-foreground" itemProp="name">{q}</h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed" itemProp="text">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Trust */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        <p>We don't sell cars or receive dealer commissions — just unbiased, data-driven advice.</p>
      </div>
    </section>
  );
}
