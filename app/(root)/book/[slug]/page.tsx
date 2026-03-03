import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.action";
import VapiControls from "@/components/VapiControls";

const BookPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) redirect("/");

  return (
    <main className="book-page-container">
      {/* Floating back button */}
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="icon-sm" />
      </Link>

      <div className="vapi-main-container space-y-6">
        <VapiControls book={result.data as any} />
      </div>
    </main>
  );
};

export default BookPage;
