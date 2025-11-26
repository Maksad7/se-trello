import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../../lib/mongodb"; 

// id >url
function getIdFromRequest(req: Request): string | null {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

// id ili obj
function buildIdFilter(id: string): any {
  const variants: any[] = [{ _id: id }];

  if (ObjectId.isValid(id)) {
    variants.push({ _id: new ObjectId(id) });
  }

  return variants.length === 1 ? variants[0] : { $or: variants };
}

// GET 
export async function GET(req: Request) {
  try {
    const id = getIdFromRequest(req);
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const filter = buildIdFilter(id);

    const board = await db.collection("boards").findOne(filter as any);

    if (!board) {
      return NextResponse.json(
        { ok: false, message: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      board: { ...board, _id: String(board._id) },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch board", error: error.message },
      { status: 500 }
    );
  }
}

// rename
export async function PATCH(req: Request) {
  try {
    const id = getIdFromRequest(req);
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const newTitle = body?.title?.trim();
    if (!newTitle) {
      return NextResponse.json(
        { ok: false, message: "Title is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const filter = buildIdFilter(id);

    const updateResult = await db
      .collection("boards")
      .updateOne(filter as any, {
        $set: { title: newTitle, updatedAt: new Date() },
      });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Board not found" },
        { status: 404 }
      );
    }

    const updated = await db.collection("boards").findOne(filter as any);

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      board: { ...updated, _id: String(updated._id) },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to update board", error: error.message },
      { status: 500 }
    );
  }
}

// delete
export async function DELETE(req: Request) {
  try {
    const id = getIdFromRequest(req);
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const filter = buildIdFilter(id);

    const result = await db.collection("boards").deleteOne(filter as any);

    if (!result || result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to delete board", error: error.message },
      { status: 500 }
    );
  }
}
