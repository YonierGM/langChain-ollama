import { useEffect, useRef, useState } from "react";

// Define el tipo de mensaje que se usará en la conversación
export type Message = {
  role: "user" | "assistant"; // Puede ser del usuario o del asistente
  content: string; // Texto del mensaje
};

// Hook personalizado para manejar la lógica del chat
export function useChatLLM() {
  const [messages, setMessages] = useState<Message[]>([]); // Estado de los mensajes mostrados en pantalla
  const [loading, setLoading] = useState(false); // Estado para indicar si está cargando una respuesta
  const messagesRef = useRef<Message[]>([]); // Referencia mutable para mantener sincronizados los mensajes

  // Cargar mensajes desde localStorage al iniciar
  useEffect(() => {
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      const parsed = JSON.parse(storedMessages); // Parsear los mensajes
      setMessages(parsed); // Actualizar el estado
      messagesRef.current = parsed; // También actualizar la referencia
    }
  }, []);

  // Actualiza el estado, referencia y localStorage con nuevos mensajes
  const updateMessages = (newMessages: Message[]) => {
    messagesRef.current = newMessages;
    setMessages(newMessages);
    localStorage.setItem("chatMessages", JSON.stringify(newMessages));
  };

  // Envía la pregunta del usuario al backend y gestiona la respuesta en streaming
  const sendMessage = async (question: string) => {
    setLoading(true); // Mostrar "cargando..."

    const userMessage: Message = { role: "user", content: question };
    let currentMessages = [...messagesRef.current, userMessage]; // Agrega mensaje del usuario
    updateMessages(currentMessages);

    let assistantMessage = ""; // Aquí se acumula la respuesta del asistente

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }), // Enviar pregunta al backend
      });

      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      if (!res.body) throw new Error("El cuerpo de la respuesta es nulo");

      const reader = res.body.getReader(); // Leer respuesta como stream
      const decoder = new TextDecoder("utf-8"); // Decodificar bytes a texto

      // Añadir un mensaje vacío para el asistente que se irá actualizando
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: "" },
      ];
      updateMessages(currentMessages);

      // Leer el stream de respuesta y construir el mensaje poco a poco
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Termina cuando el stream finaliza
        const chunk = decoder.decode(value); // Decodificar trozo
        assistantMessage += chunk; // Acumular texto

        // Actualizar último mensaje (del asistente) con el contenido nuevo
        const updatedMessages = [...currentMessages];
        updatedMessages[updatedMessages.length - 1].content = assistantMessage;

        updateMessages(updatedMessages); // Refrescar UI y estado
        currentMessages = updatedMessages; // Mantener sincronizado para el próximo ciclo
      }
    } catch (error) {
      console.error(error);
      // Si hay error, mostrar un mensaje de error como asistente
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ Ocurrió un error al conectar con el asistente.",
      };
      updateMessages([...currentMessages, errorMessage]);
    } finally {
      setLoading(false); // Ocultar "cargando..." sin importar si falló o no
    }
  };

  // Elimina todos los mensajes (limpiar historial)
  const clearMessages = () => {
    updateMessages([]);
  };

  // Exporta los mensajes a un archivo de texto plano
  const exportMessages = () => {
    const text = messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "🧑 Usuario" : "🤖 Asistente"}: ${
            msg.content
          }`
      )
      .join("\n\n"); // Formatear los mensajes como texto

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" }); // Crear archivo
    const url = URL.createObjectURL(blob); // Crear URL temporal

    const link = document.createElement("a"); // Crear enlace de descarga
    link.href = url;
    link.download = "conversacion.txt";
    link.click();

    URL.revokeObjectURL(url); // Liberar recursos
  };

  // Exporta las funciones y estados que el componente necesita usar
  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    exportMessages,
  };
}
