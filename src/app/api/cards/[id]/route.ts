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
    const title = body?.title?.trim() as string | undefined;
    const description =
      (body?.description as string | undefined) ?? undefined;

    if (!title && description === undefined) {
      return NextResponse.json(
        { ok: false, message: "Nothing to update" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const _id = new ObjectId(id);

    const set: any = { updatedAt: new Date() };
    if (title !== undefined) set.title = title;
    if (description !== undefined) set.description = description;

    const updateResult = await db
      .collection("cards")
      .updateOne({ _id }, { $set: set });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Card not found" },
        { status: 404 }
      );
    }

    const updated = await db.collection("cards").findOne({ _id });

    return NextResponse.json({ ok: true, card: updated });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to update card", error: error.message },
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

    const result = await db.collection("cards").deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "Failed to delete card", error: error.message },
      { status: 500 }
    );
  }
}
