import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { hashPassword, setLoginCookie } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력하세요." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상 입력하세요." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const result = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name || ""]
    );

    const user = result.rows[0];
    setLoginCookie(user.id);

    return NextResponse.json({ user });
  } catch (error) {
    if (String(error.message).includes("duplicate key")) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
