import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="retail-card p-8 max-w-md mx-auto mt-12 text-center space-y-4">
      <h1 className="text-xl font-semibold text-ink-primary">Page Not Found</h1>
      <p className="text-sm text-ink-secondary">
        The page you are looking for does not exist in Retail IQ.
      </p>
      <Link href="/" className="retail-btn-primary inline-flex">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}
