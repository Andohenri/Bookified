import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { getAllBooks } from "@/lib/actions/book.action";

const Page = async () => {
  const bookResults = await getAllBooks();
  const books = (bookResults.success ? bookResults.data ?? [] : []);
  return (
    <main className="wrapper container pt-24 pb-12">
      <HeroSection />

      <div className='library-books-grid'>
        {books.map((book: any) => (
          <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
        ))}
      </div>
    </main>
  );
};

export default Page;