import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface Message {
  role: "user" | "assistant";
  content: string;
}

const conversationHistory: Message[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function searchNews(topic: string): Promise<string> {
  // Add user message to history
  conversationHistory.push({
    role: "user",
    content: `Busca y proporciona información sobre noticias recientes sobre: ${topic}. 
    
    Por favor proporciona:
    1. Los titulares principales sobre este tema
    2. Una breve descripción de cada noticia
    3. El contexto importante
    4. Tendencias relevantes
    
    Usa tu conocimiento hasta tu fecha de corte para proporcionar la información más relevante disponible.`,
  });

  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: `Eres un asistente especializado en búsqueda y análisis de noticias. 
      Tu objetivo es ayudar a los usuarios a encontrar información sobre temas de interés.
      Proporciona noticias relevantes, precisas y actualizadas sobre los temas solicitados.
      Organiza la información de manera clara y estructurada.
      Si no tienes información reciente sobre un tema, lo indicarás claramente.`,
      messages: conversationHistory,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Add assistant response to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  } catch (error) {
    throw new Error(`Error al buscar noticias: ${error}`);
  }
}

async function askFollowUp(question: string): Promise<string> {
  // Add user message to history
  conversationHistory.push({
    role: "user",
    content: question,
  });

  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: `Eres un asistente especializado en búsqueda y análisis de noticias. 
      Tu objetivo es ayudar a los usuarios a encontrar información sobre temas de interés.
      Proporciona noticias relevantes, precisas y actualizadas sobre los temas solicitados.
      Organiza la información de manera clara y estructurada.
      Mantén el contexto de la conversación anterior.`,
      messages: conversationHistory,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Add assistant response to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  } catch (error) {
    throw new Error(`Error al procesar la pregunta: ${error}`);
  }
}

async function main() {
  console.log("=================================");
  console.log("  BUSCADOR DE NOTICIAS");
  console.log("  Asistente de Búsqueda de Noticias");
  console.log("=================================\n");

  console.log(
    "Bienvenido al buscador de noticias. Puedes buscar noticias sobre temas de interés."
  );
  console.log(
    'Escribe "salir" para terminar la conversación.\n'
  );

  try {
    while (true) {
      const userInput = await prompt("\nTú: ");

      if (userInput.toLowerCase() === "salir") {
        console.log(
          "\nGracias por usar el buscador de noticias. ¡Hasta luego!"
        );
        rl.close();
        break;
      }

      if (!userInput.trim()) {
        continue;
      }

      // Determine if it's an initial search or a follow-up question
      if (conversationHistory.length === 0) {
        // First question - treat as a news search
        console.log("\nAsistente: Buscando noticias sobre este tema...\n");
        const result = await searchNews(userInput);
        console.log("Asistente:", result);
      } else {
        // Follow-up question
        console.log("\nAsistente: Procesando tu pregunta...\n");
        const result = await askFollowUp(userInput);
        console.log("Asistente:", result);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
  }
}

main();