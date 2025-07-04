import express, { Request, Response} from "express";
import { Borrow } from "../models/borrow.model";
import { Book, BookDocument } from "../models/book.model";

export const borrowRoutes = express.Router();

borrowRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const { book: booId, quantity, dueDate } = req.body;
    const book = (await Book.findById(booId)) as BookDocument;
    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if(book.copies < quantity){
      res.status(400).json({
        success: false,
        message: "Not enough copies available"
      })
    }

    // use instance method
    await book.deccreaseCopies(quantity);

    const borrow = await Borrow.create({ book, quantity, dueDate });
    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: borrow,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    res.status(400).json({
      
      success: false,
      message: "Borrow failed",
      error: error.message,
    });
  }
});

borrowRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const borrow = await Borrow.aggregate([
      {
        $group: {
          _id: "$book",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      {
        $unwind: "$bookDetails",
      },
      {
        $project: {
          _id: 0,
          book: {
            title: "$bookDetails.title",
            isbn: "$bookDetails.isbn",
          },
          totalQuantity: 1,
        },
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Borrowed books summary retrieved successfully",
      data: borrow,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});
