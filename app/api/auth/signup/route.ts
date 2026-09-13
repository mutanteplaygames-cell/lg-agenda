import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios.", source: "validation" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 6 caracteres.", source: "validation" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "SUPABASE_URL ausente.", source: "environment" },
        { status: 500 }
      );
    }

    if (!publishableKey) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.", source: "environment" },
        { status: 500 }
      );
    }

    const url = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/signup`;

    console.log("[signup-debug] URL:", url);
    console.log("[signup-debug] email:", email);
    console.log("[signup-debug] key prefix:", publishableKey.slice(0, 15));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({
        email,
        password,
      }),
      cache: "no-store",
    });

    const raw = await response.text();

    console.log("[signup-debug] Supabase status:", response.status);
    console.log("[signup-debug] Supabase response:", raw);

    let data: any = null;

    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.msg ||
            data?.message ||
            data?.error_description ||
            data?.error ||
            `Supabase respondeu HTTP ${response.status}`,
          supabaseStatus: response.status,
          supabaseResponse: data,
          source: "supabase",
        },
        { status: 400 }
      );
    }

    const userId =
      data?.user?.id ||
      data?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Supabase respondeu, mas não retornou ID de usuário.",
          supabaseResponse: data,
          source: "signup-response",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId,
    });
  } catch (error: any) {
    console.error("[signup-debug] ERRO COMPLETO:", error);
    console.error("[signup-debug] CAUSE:", error?.cause);

    return NextResponse.json(
      {
        error: error?.message || "Erro desconhecido no cadastro.",
        cause: error?.cause
          ? {
              message: error.cause?.message,
              code: error.cause?.code,
              errno: error.cause?.errno,
              syscall: error.cause?.syscall,
              hostname: error.cause?.hostname,
            }
          : null,
        source: "server-catch",
      },
      { status: 500 }
    );
  }
}