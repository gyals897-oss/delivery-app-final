import { NextResponse } from "next/server";
import { getClient, query } from "../../../lib/db";
import { requireUser } from "../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();

    const ordersResult = await query(
      `SELECT id, total_price, status, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY id DESC`,
      [user.id]
    );

    const orderIds = ordersResult.rows.map((order) => order.id);

    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const itemsResult = await query(
      `SELECT id, order_id, menu_id, menu_name, price, quantity
       FROM order_items
       WHERE order_id = ANY($1::int[])
       ORDER BY id`,
      [orderIds]
    );

    const orders = ordersResult.rows.map((order) => ({
      ...order,
      items: itemsResult.rows.filter((item) => item.order_id === order.id),
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function POST() {
  const client = await getClient();

  try {
    const user = await requireUser();

    await client.query("BEGIN");

    const cartResult = await client.query(
      `SELECT
          c.id,
          c.quantity,
          m.id AS menu_id,
          m.name AS menu_name,
          m.price
       FROM cart_items c
       JOIN menus m ON c.menu_id = m.id
       WHERE c.user_id = $1
       ORDER BY c.id`,
      [user.id]
    );

    const cartItems = cartResult.rows;

    if (cartItems.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "장바구니가 비어 있습니다." },
        { status: 400 }
      );
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price, status)
       VALUES ($1, $2, $3)
       RETURNING id, total_price, status, created_at`,
      [user.id, totalPrice, "주문완료"]
    );

    const order = orderResult.rows[0];

    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items
           (order_id, menu_id, menu_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_id, item.menu_name, item.price, item.quantity]
      );
    }

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [user.id]);
    await client.query("COMMIT");

    return NextResponse.json({ order });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  } finally {
    client.release();
  }
}
