const apiKeyInput = document.getElementById("apiKey");
const gameSelect = document.getElementById("gameSelect");
const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const form = document.getElementById("form");

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

const askToAi = async (question, game, apiKey) => {
  const model = "gemini-2.5-flash";
  const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const pergunta = `
    Como um especialista em ${game}, gere **builds PVE otimizadas**. A pergunta do usuário: "${question}".

    Considere: **escalabilidade de atributos** (Força, Destreza, Fé, Inteligência, etc. — adapte conforme o jogo), **sinergia de equipamentos** (armas, armaduras, acessórios), e **habilidades/magias/itens consumíveis complementares**. Inclua o **local de obtenção de cada item**.

    Objetivo: **viabilidade em endgame** e **progressão eficiente** (jogo base/DLCs). Inclua **distribuição de pontos por nível** (Nvl 50, 100, 150 ou equivalentes) e **estratégias de obtenção de itens**. Evite exploits.

    ---

    **Regras:**
    - Responda apenas se souber, com base em **pesquisas atualizadas (data: ${new Date().toLocaleDateString()})**.
    - Se incerto sobre um item no patch atual, não inclua.
    - Se não souber a resposta: "Não sei".
    - Se a pergunta não for sobre o jogo: "Essa pergunta não está relacionada ao jogo".
    - Resposta em **markdown**, direta, sem saudações/despedidas, máx. 500 caracteres.
    `;

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: pergunta,
        },
      ],
    },
  ];

  const tools = [
    {
      google_search: {},
    },
  ];

  // chamada API
  const response = await fetch(baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      tools
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const submitForm = async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value;
  const game = gameSelect.value;
  const question = questionInput.value;

  console.log(apiKey, game, question);

  if (!apiKey || !game || !question) {
    alert("Por favor, preencha todos os campos!");
    return;
  }
  askButton.disabled = true;
  askButton.textContent = "Perguntando...";
  askButton.classList.add("loading");

  try {
    const text = await askToAi(question, game, apiKey);
    aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(text);
    aiResponse.classList.remove('hidden')
  } catch (error) {
    console.error("Erro: ", error);
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
  }
};

form.addEventListener("submit", submitForm);
