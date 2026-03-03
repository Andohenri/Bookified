'use server';

import { dbConnect } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { escapeRegex, generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { getUserPlanLimits } from "../server-plan";

export const checksBookExists = async (title: string) => {
  try {
    await dbConnect();
    const slug = generateSlug(title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return { success: true, exist: true, data: serializeData(existingBook) };
    }
    return { success: true, exist: false };
  } catch (error) {
    console.error("Error checking book existence:", error);
    return { success: false, exist: false, error: "Failed to check book existence" };
  }
};

export const createBook = async (bookData: CreateBook) => {
  try {
    await dbConnect();
    const slug = generateSlug(bookData.title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return { success: true, data: serializeData(existingBook), alreadyExists: true };
    }

    // Check subscription limits before creating the book
    const { plan, limits } = await getUserPlanLimits();
    console.log(`User plan: ${plan}, Book count limit: ${limits.maxBooks}`);
    const bookCount = await Book.countDocuments({ clerkId: bookData.clerkId });
    if (bookCount >= limits.maxBooks) {
      return {
        success: false,
        error: `You've reached the ${plan} plan limit of ${limits.maxBooks} book${limits.maxBooks === 1 ? '' : 's'}. Upgrade your plan to add more.`,
      };
    }

    const newBook = await Book.create({ ...bookData, slug, totalSegments: 0 });
    revalidatePath('/');
    return { success: true, data: serializeData(newBook), alreadyExists: false };
  } catch (error) {
    console.error("Error creating book:", error);
    return { success: false, error: "Failed to create book" };
  }
};

export const saveBookSegment = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
  try {
    await dbConnect();
    const segmentToInsert = segments.map(({ text, segmentIndex, wordCount, pageNumber }) => ({
      clerkId,
      bookId,
      content: text,
      segmentIndex,
      wordCount,
      pageNumber
    }));
    await BookSegment.insertMany(segmentToInsert);
    await Book.findByIdAndUpdate(bookId, { $inc: { totalSegments: segments.length } });
    return { success: true, data: { segmentCreated: segments.length } };
  } catch (error) {
    console.error("Error saving book segment:", error);
    await BookSegment.deleteMany({ bookId });
    await Book.findByIdAndDelete(bookId);
    revalidatePath('/');
    return { success: false, error: "Deleted book due to error saving segment" };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    await dbConnect();
    const book = await Book.findOne({ slug }).lean();
    if (!book) return { success: false, error: "Book not found" };
    return { success: true, data: serializeData(book) };
  } catch (error) {
    console.error("Error fetching book by slug:", error);
    return { success: false, error: "Failed to fetch book" };
  }
};

export const getAllBooks = async (query?: string) => {
  try {
    await dbConnect();
    const filter: Record<string, unknown> = {};

    if (query && query.trim().length > 0) {
      const pattern = escapeRegex(query.trim());
      filter.$or = [
        { title: { $regex: pattern, $options: 'i' } },
        { author: { $regex: pattern, $options: 'i' } },
      ];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();
    return { success: true, data: books.map(serializeData) };
  } catch (error) {
    console.error("Error fetching books:", error);
    return { success: false, error: "Failed to fetch books" };
  }
};

// Searches book segments using MongoDB text search with regex fallback
export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
  try {
    await dbConnect();

    console.log(`Searching for: "${query}" in book ${bookId}`);

    const bookObjectId = new Types.ObjectId(bookId);

    // Try MongoDB text search first (requires text index)
    let segments: Record<string, unknown>[] = [];
    try {
      segments = await BookSegment.find({
        bookId: bookObjectId,
        $text: { $search: query },
      })
        .select('_id bookId content segmentIndex pageNumber wordCount')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
    } catch {
      // Text index may not exist — fall through to regex fallback
      segments = [];
    }

    // Fallback: regex search matching ANY keyword
    if (segments.length === 0) {
      const keywords = query.split(/\s+/).filter((k) => k.length > 2);
      const pattern = keywords.map(escapeRegex).join('|');

      if (keywords.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      segments = await BookSegment.find({
        bookId: bookObjectId,
        content: { $regex: pattern, $options: 'i' },
      })
        .select('_id bookId content segmentIndex pageNumber wordCount')
        .sort({ segmentIndex: 1 })
        .limit(limit)
        .lean();
    }

    console.log(`Search complete. Found ${segments.length} results`);

    return {
      success: true,
      data: serializeData(segments),
    };
  } catch (error) {
    console.error('Error searching segments:', error);
    return {
      success: false,
      error: (error as Error).message,
      data: [],
    };
  }
};