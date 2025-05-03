import { useForm } from "react-hook-form";
import { useRef, useEffect } from "react";
import { useChatLLM } from "./hooks/useChatLLM";
import ReactMarkdown from "react-markdown";
import "./App.css";

function ChatLLM() {
  const { messages, loading, sendMessage, clearMessages, exportMessages } =
    useChatLLM();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = handleSubmit(async (data) => {
    await sendMessage(data.question);
    reset();
  });
  return (
    <div className="flex md:max-w-[60%] flex-col h-screen w-full m-auto">
      {/* Header fijo en ancho */}
      <div className="w-full px-4 py-2 border-b border-b-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat con LLM</h1>
        <div>
          <button
            onClick={clearMessages}
            className="text-sm text-red-500 hover:underline cursor-pointer"
          >
            Limpiar historial 🧹
          </button>
          <button
            onClick={exportMessages}
            className="text-sm text-green-600 hover:underline ml-4 cursor-pointer"
          >
            Exportar conversación 📄
          </button>
        </div>
      </div>

      {/* Contenido scrolleable a lo largo del viewport completo */}
      <div className="flex-1 overflow-y-auto w-full px-4 py-2 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex flex-col gap-2.5 px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-gray-200 text-black rounded-br-none"
                  : "bg-white text-black rounded-bl-none"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Formulario al fondo*/}
      <form
        onSubmit={onSubmit}
        className="w-full px-4 py-2 border-t border-t-gray-200 flex items-center gap-2"
      >
        <input
          placeholder="¿Tienes dudas?"
          {...register("question", {
            required: {
              value: true,
              message: "Ingrese su consulta",
            },
          })}
          type="text"
          className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
            focus:ring-blue-500 focus:border-blue-500 p-2.5 ps-4 
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
            dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Cargando..." : "Consultar"}
        </button>
      </form>

      {errors.question && (
        <span className="text-red-500 text-sm mt-1 block px-4">
          ❗ {String(errors.question.message)}
        </span>
      )}
    </div>
  );
}

export default ChatLLM;
