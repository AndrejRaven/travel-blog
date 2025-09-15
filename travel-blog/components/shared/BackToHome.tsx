import Button from "@/components/ui/Button";

type BackToHomeProps = {
  className?: string;
};

export default function BackToHome({ className = "" }: BackToHomeProps) {
  return (
    <div className={`text-center ${className}`}>
      <Button href="/" variant="outline">
        ← Powrót do strony głównej
      </Button>
    </div>
  );
}
