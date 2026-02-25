import { useEffect } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock, Shield, DollarSign, Route, ListChecks } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <main className="container mx-auto px-4 max-w-5xl" role="main">
          {/* Hero */}
          <section className="pt-20 pb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Find the right car
              <br />
              in under a minute.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Answer a few quick questions and we'll recommend practical matches.
            </p>

            <Button
              onClick={() => navigate("/quiz")}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-10 py-7 rounded-xl shadow-lg"
            >
              Start the quiz
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center gap-5 text-sm text-muted-foreground mt-5">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Takes ~60 seconds
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> No signup required
              </span>
            </div>

            <a
              href="#how-it-works"
              className="inline-block mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              How it works ↓
            </a>
          </section>

          {/* What you'll get */}
          <section className="grid md:grid-cols-3 gap-6 pb-20" aria-labelledby="benefits-heading">
            <h2 id="benefits-heading" className="sr-only">What you'll get</h2>
            <Card className="p-6 text-center border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Shortlist that fits your budget</h3>
              <p className="text-sm text-muted-foreground">Only cars you can actually afford, ranked by value.</p>
            </Card>
            <Card className="p-6 text-center border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Route className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Options that match how you drive</h3>
              <p className="text-sm text-muted-foreground">City, highway, or mixed — we weigh what matters to you.</p>
            </Card>
            <Card className="p-6 text-center border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <ListChecks className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Clear reasons for each pick</h3>
              <p className="text-sm text-muted-foreground">Every recommendation comes with a plain-English explanation.</p>
            </Card>
          </section>

          {/* SEO Content Section */}
          <SEOContent />

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground py-8">
            <p>Powered by intelligent car matching algorithms</p>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;
