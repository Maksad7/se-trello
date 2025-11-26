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
    const lists = await db
      .collection("lists")
      .find({ boardId: new ObjectId(boardId) })
      .sort({ createdAt: 1 })
      .toArray();

    const listsForClient = lists.map((l: any) => ({
      ...l,
      _id: l._id.toString(),
      boardId: l.boardId.toString(),
    }));

    return NextResponse.json({ ok: true, lists: listsForClient });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch lists", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const boardId = body?.boardId as string;
    const title = body?.title?.trim() as string;

    if (!boardId || !ObjectId.isValid(boardId)) {
      return NextResponse.json(
        { ok: false, message: "Invalid boardId" },
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

    const result = await db.collection("lists").insertOne({
      boardId: new ObjectId(boardId),
      title,
      createdAt: now,
      updatedAt: now,
    });

    const list = {
      _id: result.insertedId.toString(),
      boardId,
      title,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ ok: true, list });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to create list", error: error.message },
      { status: 500 }
    );
  }
}
