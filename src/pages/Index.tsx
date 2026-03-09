import { useEffect } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Shield, Target, Gauge, ListChecks, Sparkles, ChevronRight } from "lucide-react";
import { SEOContent } from "@/components/SEOContent";
import { StructuredData } from "@/components/StructuredData";

const Index = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  useEffect(() => {
    const scrollTarget = (routerLocation.state as { scrollTo?: string })?.scrollTo;
    if (scrollTarget) {
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [routerLocation.state]);

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 md:px-6 max-w-5xl" role="main">

          {/* Hero */}
          <section className="pt-24 pb-20 md:pt-32 md:pb-28 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Smart car matching for 2025 models
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight text-foreground text-balance">
              Find the right car
              <br />
              <span className="text-primary">in under a minute.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Answer a few quick questions about your budget, driving habits, and priorities — we'll show you the cars that actually fit.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/quiz")}
                size="lg"
                className="text-base px-8 py-6 rounded-xl shadow-elevated hover:shadow-card-hover transition-all"
              >
                Find my car
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                See how it works
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-8">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> ~60 seconds
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> No signup needed
              </span>
            </div>
          </section>

          {/* Trust / Benefits */}
          <section className="pb-24 md:pb-32" aria-labelledby="benefits-heading">
            <h2 id="benefits-heading" className="sr-only">What you'll get</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: Target,
                  title: "Shortlist that fits your budget",
                  desc: "Only cars you can actually afford, ranked by how well they match.",
                },
                {
                  icon: Gauge,
                  title: "Matched to how you drive",
                  desc: "City, highway, or both — we weigh the right fuel economy metric for you.",
                },
                {
                  icon: ListChecks,
                  title: "Clear reasons for each pick",
                  desc: "Every recommendation comes with a plain-English explanation of why it fits.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group p-6 rounded-2xl border border-border bg-card shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SEO Content: How it works + FAQ */}
          <SEOContent />

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground py-10 border-t border-border">
            <p>© {new Date().getFullYear()} WhichCar — Unbiased, data-driven car recommendations.</p>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;
