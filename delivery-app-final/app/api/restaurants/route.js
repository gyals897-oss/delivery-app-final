import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const restaurantResult = await query(
      "SELECT id, name, category, description FROM restaurants ORDER BY id"
    );

    const menuResult = await query(
      "SELECT id, restaurant_id, name, price, description FROM menus ORDER BY id"
    );

    const restaurants = restaurantResult.rows.map((restaurant) => ({
      ...restaurant,
      menus: menuResult.rows.filter(
        (menu) => menu.restaurant_id === restaurant.id
      ),
    }));

    return NextResponse.json({ restaurants });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
