import { Request, Response } from "express";
import { addMessage } from "../services/conversation.service";

export async function chatGeralController(req: Request, res: Response) {
    try {
        const { question, conversationId } = req.body;
        
        if (conversationId) {
            await addMessage(Number(conversationId), "user", question);
        }

        const aiUrl = process.env.LIGHTRAG_URL?.replace('/knowledge', '/knowledge/query') || 'http://localhost:8000/knowledge/query';
        const response = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, mode: "mix" })
        });

        if (!response.ok) {
            throw new Error(`Falha na IA: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (conversationId) {
            await addMessage(Number(conversationId), "assistant", data.answer);
        }

        return res.json({ answer: data.answer, fontes: data.fontes || [] });
    } catch (error) {
        console.error("Erro no chat geral:", error);
        return res.status(500).json({ error: "Erro interno no servidor de chat." });
    }
}