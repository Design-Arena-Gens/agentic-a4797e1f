"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { json as jsonLang } from "@codemirror/lang-json";
import clsx from "clsx";
import {
  DURATIONS,
  MODEL_OPTIONS,
  type FormState,
  type ModelVariant,
  buildPayloadFromForm,
  mergePayloadWithForm
} from "@/lib/sora";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false
});

interface ApiResponse {
  videoUrl?: string;
  jobId?: string;
  message?: string;
}

export default function VideoRequestForm() {
  const [formState, setFormState] = useState<FormState>({
    modelVariant: "standard",
    duration: 15,
    prompt: "",
    negativePrompt: ""
  });

  const [useAdvancedJson, setUseAdvancedJson] = useState(false);
  const [jsonValue, setJsonValue] = useState(() =>
    JSON.stringify(buildPayloadFromForm(formState), null, 2)
  );
  const [jsonDirty, setJsonDirty] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const videoUrl = apiResponse?.videoUrl;

  useEffect(() => {
    const payload = buildPayloadFromForm(formState);
    if (!useAdvancedJson || !jsonDirty) {
      setJsonValue(JSON.stringify(payload, null, 2));
      setJsonDirty(false);
    }
  }, [formState, useAdvancedJson, jsonDirty]);

  useEffect(
    () => () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    },
    []
  );

  const handleStartProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    setProgress(10);

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          return prev;
        }
        return prev + Math.random() * 7;
      });
    }, 600);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    setTimeout(() => setProgress(0), 600);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setErrorMessage(null);
      setApiResponse(null);
      setIsLoading(true);
      handleStartProgress();

      try {
        let payload: Record<string, unknown>;

        if (useAdvancedJson) {
          try {
            const parsed = JSON.parse(jsonValue);
            payload = mergePayloadWithForm(parsed, formState);
          } catch (error) {
            throw new Error(
              "O JSON em Modo Desenvolvedor está inválido. Verifique a sintaxe antes de enviar."
            );
          }
        } else {
          payload = buildPayloadFromForm(formState);
        }

        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mode: useAdvancedJson ? "json" : "visual",
            form: formState,
            payload
          })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody?.message || "Falha ao contatar o serviço do Sora 2."
          );
        }

        const data: ApiResponse = await response.json();
        setApiResponse(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro inesperado. Tente novamente em instantes.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
        stopProgress();
      }
    },
    [
      formState,
      handleStartProgress,
      jsonValue,
      stopProgress,
      useAdvancedJson
    ]
  );

  const handleToggleMode = useCallback(() => {
    setUseAdvancedJson((current) => {
      const next = !current;
      if (!next) {
        setJsonDirty(false);
      } else {
        setJsonDirty(false);
      }
      return next;
    });
  }, []);

  const setField =
    <K extends keyof FormState>(field: K) =>
    (value: FormState[K]) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value
      }));
    };

  return (
    <div className="space-y-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-slate-900/30 backdrop-blur">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Versão do Modelo
            </label>
            <div className="grid gap-3">
              {(
                Object.entries(MODEL_OPTIONS) as [
                  ModelVariant,
                  { label: string; description: string }
                ][]
              ).map(([key, info]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setField("modelVariant")(key)}
                  className={clsx(
                    "flex items-start justify-between rounded-2xl border p-4 text-left transition",
                    "border-slate-700 bg-slate-900/70 hover:border-accent hover:bg-slate-900",
                    formState.modelVariant === key &&
                      "border-accent bg-slate-900/90 shadow-lg shadow-accent/20"
                  )}
                >
                  <span>
                    <span className="block text-base font-semibold">
                      {info.label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {info.description}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "mt-1 h-4 w-4 rounded-full border-2",
                      formState.modelVariant === key
                        ? "border-accent bg-accent"
                        : "border-slate-600"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Duração do Vídeo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((duration) => {
                const isSelected = formState.duration === duration;
                return (
                  <button
                    type="button"
                    key={duration}
                    onClick={() => setField("duration")(duration)}
                    className={clsx(
                      "rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-6 text-center transition hover:border-accent hover:bg-slate-900",
                      isSelected && "border-accent bg-slate-900/90 shadow-accent/30"
                    )}
                  >
                    <span className="text-xl font-bold">{duration}s</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      Ideal para {duration === 25 ? "campanhas" : "preview"}{" "}
                      ágil
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Prompt Principal
            </label>
            <textarea
              required
              rows={7}
              placeholder="Descreva a cena, mood, ambiente, personagens..."
              value={formState.prompt}
              onChange={(event) => setField("prompt")(event.target.value)}
              className="h-full resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Prompt Negativo (Opcional)
            </label>
            <textarea
              rows={7}
              placeholder="Defina o que deve ser evitado — ruídos, estilos, erros."
              value={formState.negativePrompt}
              onChange={(event) => setField("negativePrompt")(event.target.value)}
              className="h-full resize-none placeholder:text-slate-500"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Modo Desenvolvedor / JSON
              </p>
              <p className="text-sm text-slate-400">
                Ajuste manualmente parâmetros experimentais. O modelo e a duração
                sempre seguirão a configuração visual.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMode}
              className={clsx(
                "relative inline-flex h-10 w-20 items-center rounded-full border border-slate-700 transition",
                useAdvancedJson
                  ? "bg-accent shadow-lg shadow-accent/40"
                  : "bg-slate-900"
              )}
              aria-pressed={useAdvancedJson}
            >
              <span
                className={clsx(
                  "absolute left-1 top-1 h-8 w-8 rounded-full bg-white transition",
                  useAdvancedJson && "translate-x-10"
                )}
              />
            </button>
          </div>

          {useAdvancedJson && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                Corpo da Requisição (JSON)
              </label>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
                <CodeMirror
                  value={jsonValue}
                  height="300px"
                  theme="dark"
                  extensions={[jsonLang()]}
                  onChange={(value) => {
                    setJsonValue(value);
                    setJsonDirty(true);
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Dica: inclua seeds, configuração de câmera, LUTs ou parâmetros
                avançados suportados pelo Sora 2.
              </p>
            </div>
          )}
        </section>

        {isLoading && (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Gerando vídeo...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${Math.min(progress, 100)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-accent to-accentMuted transition-all duration-300"
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        <footer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-500">
            Duração selecionada: {formState.duration}s · Modelo:{" "}
            {MODEL_OPTIONS[formState.modelVariant].label}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              "group flex items-center justify-center gap-2 rounded-full border border-accent bg-accent px-6 py-3 font-semibold text-white transition",
              "hover:bg-accentMuted hover:shadow-lg hover:shadow-accent/30",
              isLoading && "cursor-not-allowed opacity-70"
            )}
          >
            <span>{isLoading ? "Processando..." : "Gerar Vídeo com Sora 2"}</span>
            {!isLoading && (
              <span className="transition group-hover:translate-x-1">→</span>
            )}
          </button>
        </footer>
      </form>

      {apiResponse && (
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Entrega do Sora 2
              </h2>
              <p className="text-xs text-slate-500">
                Revisite o vídeo e compartilhe com seu time imediatamente.
              </p>
            </div>
            {apiResponse.jobId && (
              <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs text-slate-400">
                Job ID • {apiResponse.jobId}
              </span>
            )}
          </header>

          {videoUrl ? (
            <video
              controls
              className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black"
              src={videoUrl}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
              {apiResponse.message ||
                "O vídeo está sendo processado. Você receberá um link final em instantes."}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
