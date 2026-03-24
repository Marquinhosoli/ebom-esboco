    export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { rascunho, tema, textoBase } = req.body;

    const prompt = `
Crie um esboço bíblico forte, claro e pregável.

Tema: ${tema || "Extraído automaticamente"}
Texto base: ${textoBase || "Definir"}

Anotações:
${rascunho}

Monte com:
- Tema
- Texto base
- Introdução
- 3 a 5 tópicos com explicação
- Aplicação prática
- Conclusão espiritual forte
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const esboco = data.choices?.[0]?.message?.content || "Erro ao gerar";

    res.status(200).json({ esboco });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
