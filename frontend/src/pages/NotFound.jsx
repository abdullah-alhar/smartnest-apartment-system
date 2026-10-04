import { useNavigate } from "react-router-dom";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "../components/ui";

export function NotFoundView({ title = "Page not found", message = "The page you're looking for doesn't exist or may have moved.", primaryTo = "/", primaryLabel = "Back to home" }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="font-serif text-7xl font-bold text-accent/30 mb-2">404</p>
      <span className="w-16 h-16 rounded-2xl bg-white shadow-[var(--shadow-card)] text-accent flex items-center justify-center mb-5">
        <Compass size={30} strokeWidth={1.5} />
      </span>
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">{title}</h1>
      <p className="text-grey-400 max-w-sm mb-8">{message}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Go back</Button>
        <Button to={primaryTo} icon={Home}>{primaryLabel}</Button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return <NotFoundView />;
}
