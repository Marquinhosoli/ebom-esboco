export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const {
      rascunho = "",
      tema = "",
      textoBase = "",
      imagemBase64 = "",
      modo = "pregavel"
    } = req.body || {};

    if (!rascunho.trim() && !imagemBase64) {
      return res.status(400).json({
        error: "Envie um rascunho digitado ou uma imagem."
      });
    }

    const instrucoesPorModo = {
      rapido: `
Monte um esboço objetivo, enxuto e claro.
Use:
- Tema
- Texto base
- Introdução curta
- 3 tópicos
- Aplicação
- Conclusão
`,
      pregavel: `
Monte um esboço bíblico forte, claro e pregável.
Use:
- Tema
- Texto base
- Introdução impactante
- 3 a 5 tópicos com explicação
- Aplicação prática
- Conclusão espiritual forte
`,
      aula: `
Monte um esboço em formato de aula bíblica.
Use:
- Tema
- Texto base
- Objetivo da aula
- Contexto bíblico
- 3 a 5 tópicos explicativos
- Aplicações
- Perguntas para reflexão
- Conclusão
`,
      estudo: `
Monte um esboço em formato de estudo bíblico.
Use:
- Tema
- Texto base
- Introdução
- Explicação detalhada por tópicos
- Principais lições
- Aplicação prática
- Conclusão
`
    };

    const instrucaoModo =
      instrucoesPorModo[modo] || instrucoesPorModo.pregavel;

    const promptPrincipal = `
Você é um assistente cristão especializado em transformar anotações em esboços bíblicos bem organizados.

Tarefas:
1. Se houver imagem, primeiro leia e transcreva fielmente a anotação manuscrita.
2. Se houver rascunho digitado, combine com a imagem.
3. Corrija apenas erros evidentes de leitura, sem inventar conteúdo.
4. Depois monte o esboço final.

Preferências:
- Mantenha tom bíblico, claro e edificante.
- Não floreie demais.
- Se o tema estiver implícito, identifique o melhor tema.
- Se o texto base não for informado, sugira um coerente.
- Se houver trechos ilegíveis na imagem, mencione brevemente as incertezas.

Tema informado: ${tema || "(não informado)"}
Texto base informado: ${textoBase || "(não informado)"}

Formato desejado:
${instrucaoModo}

Quero a resposta EXATAMENTE neste formato:

TEXTO EXTRAÍDO:
[coloque aqui a transcrição da imagem e/ou do rascunho]

ESBOÇO:
[coloque aqui o esboço final]
`;

    const content = [
      {
        type: "input_text",
        text: promptPrincipal
      }
    ];

    if (rascunho.trim()) {
      content.push({
        type: "input_text",
        text: `RASCUNHO DIGITADO:\n${rascunho.trim()}`
      });
    }

    if (imagemBase64) {
      content.push({
        type: "input_image",
        image_url: imagemBase64,
        detail: "high"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Erro ao consultar a OpenAI."
      });
    }

    const texto = data?.output_text?.trim();

    if (!texto) {
      return res.status(500).json({
        error: "A OpenAI respondeu, mas não retornou texto."
      });
    }

    const partes = texto.split("ESBOÇO:");
    let textoExtraido = "";
    let esboco = texto;

    if (partes.length >= 2) {
      textoExtraido = partes[0]
        .replace("TEXTO EXTRAÍDO:", "")
        .trim();
      esboco = partes.slice(1).join("ESBOÇO:").trim();
    }

    return res.status(200).json({
      esboco,
      textoExtraido,
      bruto: texto
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erro interno no servidor."
    });
  }
}
