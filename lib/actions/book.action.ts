'use server';

import { dbConnect } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

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

    // TODO: Check subscription limits here before creating the book

    const newBook = await Book.create({ ...bookData, slug, totalSegments: 0 });
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
    return { success: false, error: "Deleted book due to error saving segment" };
  }
};

export const getAllBooks = async () => {
  try {
    await dbConnect();
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    return { success: true, data: books.map(serializeData) };
  } catch (error) {
    console.error("Error fetching books:", error);
    return { success: false, error: "Failed to fetch books" };
  }
};