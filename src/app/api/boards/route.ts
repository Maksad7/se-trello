import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../lib/mongodb"; // ВАЖНО: ровно 4 ../

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const boards = await db
      .collection("boards")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const boardsForClient = boards.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
    }));

    return NextResponse.json({ ok: true, boards: boardsForClient });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch boards", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = body?.title?.trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Title is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const result = await db.collection("boards").insertOne({
      title,
      createdAt: now,
      updatedAt: now,
    });

    const board = {
      _id: (result.insertedId as ObjectId).toString(),
      title,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ ok: true, board });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to create board", error: error.message },
      { status: 500 }
    );
  }
}
