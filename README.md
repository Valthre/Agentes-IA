# Agente IA

**Agente IA** é uma plataforma de inteligência artificial conversacional que fornece uma galeria de agentes especialistas. Interaja com diferentes perfis criados sob medida para necessidades específicas (mentores, desenvolvedores sêniores, consultores, personal trainers e muito mais). 

A aplicação permite ativar modos de raciocínio avançado, utilizar modelos conversacionais avançados e personalizar totalmente a sua experiência para qualquer desafio.

## 🚀 Funcionalidades Principais

*   👥 **Galeria de Agentes (Hub)**: Explore e ative diversos agentes com instruções (personas) minuciosamente desenhadas para serem especialistas em diferentes segmentos (TI, Direito, Investimentos, Bem-estar, etc).
*   💬 **Bate-papo Especializado**: Interface de chat rica, rápida, projetada com suporte total a **Markdown** e **realce de sintaxe em código**.
*   🧠 **Painel de Raciocínio**: Habilidade de extrair os blocos de pensamento interno (como as tags de *reasoning* de modelos LLM modernos) e exibi-los de forma elegante.
*   🌐 **Internacionalização (i18n)**: Interface traduzível para Português (pt-BR), Inglês (en) e Espanhol (es).
*   💾 **Privacidade e Armazenamento Local**: Todo o histórico de chat, configurações, e personas ficam guardados *exclusivamente* no LocalStorage do seu navegador. Inclui sistema de Exportação/Importação e Limpeza Geral.
*   🔑 **Segurança de API Keys (BYOK - Bring Your Own Key)**: Você provê sua própria chave de serviços (ex: Google Gemini API) nas Configurações, rodando o serviço diretamente pelo lado do cliente/servidor sem interceptação.
*   ⚙️ **Modo Avançado UI**: Controles extras sob demanda (tokens, temperatura), barra de configurações rápidas e monitoramento de custo.

## 🛠️ Tecnologias Utilizadas

*   **Front-end Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **Estilização:** UI moderna implementada com [Tailwind CSS](https://tailwindcss.com/)
*   **Modelos e LLM:** SDK Oficial [`@google/genai`](https://www.npmjs.com/package/@google/genai) pronto para integrar com modelos Gemini Pro e Flash (incluindo `gemini-3.1-pro-preview` / `gemini-2.5-pro`).
*   **Renderização e Markdown:** Ferramenta complexa de parsing usando `react-markdown`, `rehype-raw`, `remark-gfm` e `react-syntax-highlighter`.

## 📂 Visão Geral da Arquitetura

O projeto foi organizado para fácil manutenção e escalabilidade na criação de novos Agentes:

*   `/components` - Peças modulares que compõem a UI (Ex: `MessageBubble.tsx`, `ChatHistorySidebar.tsx`, Modais).
*   `/personas` - Coração do app. Define os parâmetros formatados e *System Prompts* de cada especialista catalogado no HUB.
*   `/services` - Integração com APIs externas sob o modelo de abstração de LLM (`llmService.ts`).
*   `/locales` - Strings mapeadas para suportar as diversas linguagens do serviço.

## 🏃 Como Executar Localmente

Passo a passo para rodar o app no seu ambiente local (requer Node.js 18+):

1. **Faça o clone ou baixe os arquivos** para sua máquina.
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Execute o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```
4. **Abra o aplicativo:** O Vite mostrará um link (como `http://localhost:3000`). Ao abri-lo no seu terminal, vá no ícone de "Configurações" (Engrenagem) e insira sua API Key do Google Gemini para começar a "bater papo" com os especialistas.

## 🤝 Sobre as Regras de Conduta dos Especialistas

Cada persona definida no painel é rigidamente alinhada pelas instruções fornecidas internamente para garantir relevância e precisão técnica. Nos casos relacionados à saúde ou finanças, os modelos contam com travas e avisos de _Disclaimer_ alertando que não podem substituir ajuda humana/profissional validada, mantendo o software seguro.

## ⚠️ Aviso Legal e Isenção de Responsabilidade (Disclaimer)

Este projeto é fornecido "COMO ESTÁ" (as is), sem garantias de qualquer tipo, expressas ou implícitas. Ao clonar, fazer fork, hospedar ou modificar este repositório, você assume total e exclusiva responsabilidade sobre o uso do código e das integrações de API. 

Os criadores originais e contribuidores deste repositório **NÃO** se responsabilizam por:
*   Uso indevido da plataforma ou infrações aos Termos de Serviço de APIs de terceiros (como Google Gemini, OpenAI, etc).
*   Custos, cobranças ou vazamento de chaves de API causados por hospedagem incorreta ou má gestão por parte de quem fez o fork.
*   Modificações nos *prompts* (personas) originais que resultem em respostas prejudiciais, falsas, ofensivas ou perigosas (como remover os alertas médicos/financeiros).
*   Quaisquer danos diretos ou indiretos resultantes do uso ou da incapacidade de usar este software.

Qualquer versão modificada deste software deverá ser tratada de forma completamente independente, e a responsabilidade de auditar a segurança e conformidade legal de alterações recairá exclusivamente sobre o autor das modificações.
