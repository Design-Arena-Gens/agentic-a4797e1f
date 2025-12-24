import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_DURATIONS,
  MODEL_MAP,
  mergePayloadWithForm,
  type FormPayload
} from "@/lib/sora";

function ensureObject<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object") return fallback;
  return value as T;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const form = ensureObject<FormPayload>(body?.form, {} as FormPayload);
    const payload = ensureObject<Record<string, unknown>>(body?.payload, {});

    if (!form.modelVariant || !MODEL_MAP[form.modelVariant]) {
      return NextResponse.json(
        { message: "Modelo inválido." },
        { status: 400 }
      );
    }

    if (!ALLOWED_DURATIONS.has(form.duration)) {
      return NextResponse.json(
        {
          message: "Duração não suportada. Utilize 10, 15 ou 25 segundos."
        },
        { status: 400 }
      );
    }

    if (!form.prompt && !payload?.input) {
      return NextResponse.json(
        {
          message:
            "Informe um prompt na interface ou dentro do JSON personalizado."
        },
        { status: 400 }
      );
    }

    const soraApiKey = process.env.SORA_API_KEY;
    if (!soraApiKey) {
      return NextResponse.json(
        {
          message:
            "Configuração ausente. Defina a variável SORA_API_KEY no ambiente servidor."
        },
        { status: 500 }
      );
    }

    const requestBody = mergePayloadWithForm(payload, form);

    const soraResponse = await fetch("https://api.sora.com/v2/video/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${soraApiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(1000 * 60)
    });

    if (!soraResponse.ok) {
      const errorPayload = await soraResponse.json().catch(() => null);
      return NextResponse.json(
        {
          message:
            errorPayload?.message ||
            "Falha ao gerar vídeo com o modelo Sora 2."
        },
        { status: soraResponse.status }
      );
    }

    const data = await soraResponse.json().catch(() => ({}));
    return NextResponse.json(
      {
        videoUrl: data?.assets?.video_url ?? data?.video_url,
        jobId: data?.id ?? data?.job_id,
        message:
          data?.message ||
          "Processamento em andamento. Você receberá o vídeo em instantes."
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar vídeo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
