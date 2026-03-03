import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.action";

const BookPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) redirect("/");

  const { title, author, coverURL, persona } = result.data as any;

  return (
    <main className="book-page-container">
      {/* Floating back button */}
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="icon-sm" />
      </Link>

      <div className="vapi-main-container space-y-6">
        {/* Header card */}
        <section className="vapi-header-card w-full">
          {/* Cover + mic button */}
          <div className="vapi-cover-wrapper">
            <Image
              src={coverURL || "/assets/no-cover.png"}
              alt={`Cover of ${title}`}
              width={130}
              height={195}
              className="vapi-cover-image"
            />
            <div className="vapi-mic-wrapper">
              <button className="vapi-mic-btn" aria-label="Toggle microphone">
                <MicOff className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Book info */}
          <div className="flex flex-col justify-center gap-3">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#212a3b]">
                {title}
              </h1>
              <p className="text-[#3d485e] text-base mt-1">by {author}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="vapi-status-indicator">
                <span className="vapi-status-dot vapi-status-dot-ready" />
                <span className="vapi-status-text">Ready</span>
              </span>

              <span className="vapi-status-indicator">
                <span className="vapi-status-text">Voice: {persona || "Daniel"}</span>
              </span>

              <span className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
              </span>
            </div>
          </div>
        </section>

        {/* Transcript area */}
        <section className="transcript-container min-h-100">
          <div className="transcript-empty">
            <Mic className="w-12 h-12 text-gray-400 mb-3" />
            <p className="transcript-empty-text">No conversation yet</p>
            <p className="transcript-empty-hint">
              Click the mic button above to start talking
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default BookPage;
