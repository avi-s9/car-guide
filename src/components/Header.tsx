import { Car } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const scrollTo = (id: string) => {
    if (!isHome) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            WhichCar
          </span>
        </button>

        <nav className="flex items-center gap-1">
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
            className="ml-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Start quiz
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
