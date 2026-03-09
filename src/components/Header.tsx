import { Car, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (!isHome) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            WhichCar
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scrollTo("how-it-works")}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            How it works
          </button>
          <button
            onClick={() => scrollTo("faq")}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            FAQ
          </button>
          <ThemeToggle />
          <Button
            size="sm"
            onClick={() => navigate("/quiz")}
            className="ml-2"
          >
            Find my car
          </Button>
        </nav>

        {/* Mobile nav toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-2 animate-fade-in">
          <button
            onClick={() => scrollTo("how-it-works")}
            className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            How it works
          </button>
          <button
            onClick={() => scrollTo("faq")}
            className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
          >
            FAQ
          </button>
          <Button
            size="sm"
            onClick={() => { setMobileOpen(false); navigate("/quiz"); }}
            className="w-full mt-1"
          >
            Find my car
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
