import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../../lib/mongodb";

function getIdFromRequest(req: Request): string | null {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  try {
    const id = getIdFromRequest(req);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const title = body?.title?.trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Title is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const _id = new ObjectId(id);

    const updateResult = await db
      .collection("lists")
      .updateOne({ _id }, { $set: { title, updatedAt: new Date() } });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "List not found" },
        { status: 404 }
      );
    }

    const updated = await db.collection("lists").findOne({ _id });

    return NextResponse.json({ ok: true, list: updated });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to update list", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const id = getIdFromRequest(req);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const _id = new ObjectId(id);

    const result = await db.collection("lists").deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "List not found" },
        { status: 404 }
      );
    }

    // удаляем все карточки этого списка
    await db.collection("cards").deleteMany({ listId: _id });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to delete list", error: error.message },
      { status: 500 }
    );
  }
}
