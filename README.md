## Sora 2 Video Studio

Aplicativo SaaS em Next.js focado na criação de vídeos via API do Sora 2 com fluxo otimizado para equipes criativas e desenvolvedores.

### Estrutura de Diretórios

```
.
├── app
│   ├── api
│   │   └── generate-video
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── VideoRequestForm.tsx
├── docs
│   └── sample-payload.json
├── lib
│   └── sora.ts
├── next-env.d.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Executando localmente

```bash
npm install
npm run dev
```

### Variáveis de ambiente

Crie um arquivo `.env.local` com:

```
SORA_API_KEY=sua_chave_aqui
```

### Fluxo da API

1. O formulário escolhe entre Sora 2 Standard e Sora 2 Pro e define a duração do vídeo (10s, 15s, 25s).
2. O payload é montado automaticamente a partir da UI ou manualmente via Modo Desenvolvedor / JSON.
3. A rota `POST /api/generate-video` valida os dados, garante que modelo e duração sejam respeitados e chama o endpoint do Sora 2.
4. A resposta retorna `videoUrl`, `jobId` e `message` para renderização no player.

### Exemplo de Payload JSON (Modo Desenvolvedor)

```json
{
  "model": "sora-2-pro",
  "input": {
    "prompt": "cinematic aerial shot of a futuristic city at sunrise",
    "negative_prompt": "low resolution, text overlays, jitter"
  },
  "video": {
    "duration_seconds": 15,
    "output_format": "mp4"
  },
  "render": {
    "camera": {
      "path": "smooth_orbit",
      "speed": 0.85,
      "height": 35
    },
    "color": {
      "temperature": "warm",
      "lut": "teal_orange_cinematic"
    }
  },
  "metadata": {
    "source": "sora-video-studio",
    "ui_version": "v1.0.0"
  }
}
```

> A aplicação aplica automaticamente o modelo e a duração selecionados na interface mesmo quando o payload é customizado.
