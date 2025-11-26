import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const boardId = url.searchParams.get("boardId");

    if (!boardId || !ObjectId.isValid(boardId)) {
      return NextResponse.json(
        { ok: false, message: "Invalid boardId" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const cards = await db
      .collection("cards")
      .find({ boardId: new ObjectId(boardId) })
      .sort({ createdAt: 1 })
      .toArray();

    const cardsForClient = cards.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
      boardId: c.boardId.toString(),
      listId: c.listId.toString(),
    }));

    return NextResponse.json({ ok: true, cards: cardsForClient });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch cards", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const boardId = body?.boardId as string;
    const listId = body?.listId as string;
    const title = body?.title?.trim() as string;
    const description = (body?.description as string) || "";

    if (!boardId || !ObjectId.isValid(boardId)) {
      return NextResponse.json(
        { ok: false, message: "Invalid boardId" },
        { status: 400 }
      );
    }
    if (!listId || !ObjectId.isValid(listId)) {
      return NextResponse.json(
        { ok: false, message: "Invalid listId" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Title is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const result = await db.collection("cards").insertOne({
      boardId: new ObjectId(boardId),
      listId: new ObjectId(listId),
      title,
      description,
      createdAt: now,
      updatedAt: now,
    });

    const card = {
      _id: result.insertedId.toString(),
      boardId,
      listId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ ok: true, card });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to create card", error: error.message },
      { status: 500 }
    );
  }
}
