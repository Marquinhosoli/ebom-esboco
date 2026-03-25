import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

export default async function handler(req, res) {
  // Ignora pedidos que não sejam de envio de dados (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { tema, textoBase, rascunho, imagemBase64 } = req.body;

    // Prepara as instruções teológicas
    let promptText = `Atue como um teólogo e pastor experiente de linha pentecostal assembleiana. Crie um esboço bíblico bem estruturado com Introdução, Tópicos principais (com base bíblica), Aplicação Prática e Conclusão.\n`;
    if (tema) promptText += `Tema: ${tema}\n`;
    if (textoBase) promptText += `Texto Base: ${textoBase}\n`;
    if (rascunho) promptText += `Anotações do rascunho: ${rascunho}\n`;
    if (imagemBase64) promptText += `Extraia também as ideias escritas à mão na imagem fornecida e integre ao esboço.\n`;

    let contentArray = [{ type: "text", text: promptText }];

    // Adiciona a foto se ela existir
    if (imagemBase64) {
      contentArray.push({
        type: "image_url",
        image_url: { url: imagemBase64 }
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

    // Devolve o resultado para o site
    res.status(200).json({ esboco: esbocoGerado, textoExtraido: "Leitura concluída com sucesso." });

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: error.message || "Erro ao comunicar com a inteligência artificial." });
  }
}
