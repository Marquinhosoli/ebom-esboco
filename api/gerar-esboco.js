import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Agora ele recebe "imagensBase64" (no plural, como um array/lista)
    const { tema, textoBase, rascunho, imagensBase64 } = req.body;

    let promptText = `Atue como um teólogo e pastor experiente de linha pentecostal assembleiana. Crie um esboço bíblico bem estruturado com Introdução, Tópicos principais (com base bíblica), Aplicação Prática e Conclusão.\n`;
    if (tema) promptText += `Tema: ${tema}\n`;
    if (textoBase) promptText += `Texto Base: ${textoBase}\n`;
    if (rascunho) promptText += `Anotações do rascunho: ${rascunho}\n`;
    if (imagensBase64 && imagensBase64.length > 0) {
      promptText += `Extraia as ideias escritas nas ${imagensBase64.length} imagens anexadas (que são páginas de anotações) e integre tudo em um único esboço contínuo.\n`;
    }

    let contentArray = [{ type: "text", text: promptText }];

    // Se houver imagens, adiciona TODAS elas na requisição para a IA ler
    if (imagensBase64 && imagensBase64.length > 0) {
      imagensBase64.forEach(img => {
        contentArray.push({
          type: "image_url",
          image_url: { url: img }
        });
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente especialista em homilética e criação de esboços para pregações cristãs." },
        { role: "user", content: contentArray }
      ],
      temperature: 0.7,
    });

    const esbocoGerado = response.choices[0].message.content;

    res.status(200).json({ esboco: esbocoGerado, textoExtraido: "Leitura de múltiplas imagens concluída." });

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: error.message || "Erro ao comunicar com a inteligência artificial." });
  }
}
