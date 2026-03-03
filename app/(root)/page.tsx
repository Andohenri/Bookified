import BookCard from "@/components/BookCard";
import BookSearch from "@/components/BookSearch";
import HeroSection from "@/components/HeroSection";
import { getAllBooks } from "@/lib/actions/book.action";

const Page = async ({ searchParams }: { searchParams: Promise<{ q?: string }> }) => {
  const { q } = await searchParams;
  const bookResults = await getAllBooks(q);
  const books = (bookResults.success ? bookResults.data ?? [] : []);
  return (
    <main className="wrapper container pt-24 pb-12">
      <HeroSection />

      <div className="library-filter-bar">
        <h2 className="section-title">{q ? `Results for "${q}"` : 'Recent Books'}</h2>
        <BookSearch />
      </div>

      <div className='library-books-grid'>
        {books.length > 0 ? (
          books.map((book: any) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
          ))
        ) : (
          <p className="text-(--text-muted) col-span-full text-center py-10">
            {q ? 'No books match your search.' : 'No books yet. Upload your first book!'}
          </p>
        )}
      </div>
    </main>
  );
};

export default Page;