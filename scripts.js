const apiKeyInput = document.getElementById("apiKey");
const gameSelect = document.getElementById("gameSelect");
const questionInput = document.getElementById("question");
const useSearchInput = document.getElementById("useSearch");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const form = document.getElementById("form");

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

const askToAi = async (question, game, apiKey, useSearch) => {
  const model = "gemini-3.8-flash";
  const baseURL = "https://generativelanguage.googleapis.com/v1beta/interactions";

  const regraFonte = useSearch
    ? `- Baseie a resposta em **pesquisas atualizadas na web (data: ${new Date().toLocaleDateString()})**. Se um item não estiver confirmado no patch atual, não o inclua.`
    : `- Baseie a resposta no seu conhecimento geral e consolidado sobre o jogo. Responda com confiança mesmo sem busca em tempo real; só ressalte incerteza se a dúvida depender de um patch muito recente.`;

  const pergunta = `
    Como um especialista em ${game}, gere **builds PVE otimizadas**. A pergunta do usuário: "${question}".

    Considere: **escalabilidade de atributos** (Força, Destreza, Fé, Inteligência, etc. — adapte conforme o jogo), **sinergia de equipamentos** (armas, armaduras, acessórios), e **habilidades/magias/itens consumíveis complementares**. Inclua o **local de obtenção de cada item** de forma detalhada.

    Objetivo: **viabilidade em endgame** e **progressão eficiente** (jogo base/DLCs). Inclua **distribuição de pontos por nível** (Nvl 50, 100, 150 ou equivalentes) e **estratégias de obtenção de itens**. Evite exploits.

    ---

    **Regras:**
    - Para solicitações de builds, forneça **uma build completa** (atributos, equipamentos, habilidades, magias, consumíveis) e **uma build alternativa** (focada em um estilo de jogo diferente).
    - Forneça **estratégias de obtenção de itens** (farm, chefes, NPCs, eventos) e **localizações detalhadas**.
    ${regraFonte}
    - Se não souber a resposta: "Não sei".
    - Se a pergunta não for sobre o jogo: "Essa pergunta não está relacionada ao jogo".
    - Resposta em **markdown**, direta, sem saudações/despedidas, máx. 3000 caracteres.
    `;

  const body = { model, input: pergunta };

  if (useSearch) {
    body.tools = [{ type: "google_search" }];
  }

  // chamada API (Interactions API)
  const response = await fetch(baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Erro na API (${response.status})`);
  }

  const modelOutput = data.steps?.find((step) => step.type === "model_output");
  const text = modelOutput?.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("A IA não retornou nenhuma resposta. Tente reformular sua pergunta.");
  }

  return text;
};

const submitForm = async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value;
  const game = gameSelect.value;
  const question = questionInput.value;
  const useSearch = useSearchInput.checked;

  console.log(apiKey, game, question);

  if (!apiKey || !game || !question) {
    alert("Por favor, preencha todos os campos!");
    return;
  }
  askButton.disabled = true;
  askButton.textContent = "Decifrando Runas...";
  askButton.classList.add("loading");

  try {
    const text = await askToAi(question, game, apiKey, useSearch);
    aiResponse.classList.remove("error");
    aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(text);
    aiResponse.classList.remove('hidden')
  } catch (error) {
    console.error("Erro: ", error);
    aiResponse.classList.add("error");
    aiResponse.querySelector(".response-content").textContent =
      error.message || "Ocorreu um erro ao consultar a IA. Verifique sua chave e tente novamente.";
    aiResponse.classList.remove("hidden");
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
  }
};

form.addEventListener("submit", submitForm);
