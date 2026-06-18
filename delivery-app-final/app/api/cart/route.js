import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { requireUser } from "../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();

    const result = await query(
      `SELECT
          c.id,
          c.quantity,
          m.id AS menu_id,
          m.name AS menu_name,
          m.price,
          r.name AS restaurant_name
       FROM cart_items c
       JOIN menus m ON c.menu_id = m.id
       JOIN restaurants r ON m.restaurant_id = r.id
       WHERE c.user_id = $1
       ORDER BY c.id`,
      [user.id]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const { menuId, quantity = 1 } = await request.json();

    if (!menuId) {
      return NextResponse.json(
        { error: "메뉴를 선택하세요." },
        { status: 400 }
      );
    }

    const existing = await query(
      "SELECT id, quantity FROM cart_items WHERE user_id = $1 AND menu_id = $2",
      [user.id, menuId]
    );

    if (existing.rows.length > 0) {
      await query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity, existing.rows[0].id]
      );
    } else {
      await query(
        "INSERT INTO cart_items (user_id, menu_id, quantity) VALUES ($1, $2, $3)",
        [user.id, menuId, quantity]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await requireUser();
    const { cartItemId } = await request.json();

    await query("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [
      cartItemId,
      user.id,
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
