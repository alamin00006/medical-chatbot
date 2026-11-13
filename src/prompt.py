system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context and the conversation "
    "history to answer the question. If you don't know the answer, say that "
    "you don't know. Use three sentences maximum and keep the "
    "answer concise."
    "\n\n"
    "{context}"
)

# Rewrites follow-ups ("what about its side effects?") into a standalone
# question so the retriever searches for the right thing.
contextualize_prompt = (
    "Given the chat history and the latest user question, which might "
    "reference earlier messages, rewrite it as a standalone question that "
    "can be understood without the chat history. Do NOT answer the question; "
    "only rewrite it if needed, otherwise return it unchanged."
)
