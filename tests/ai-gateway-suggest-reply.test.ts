import { describe, expect, it } from "vitest";
import { generateCustomerSuggestedReply } from "../src/lib/multiplex/ai-gateway.server";

describe("AI Gateway — Sugestão de Respostas a Clientes", () => {
  it("rejeita dúvidas vazias ou com menos de 3 caracteres", async () => {
    const res = await generateCustomerSuggestedReply({ question: "oi" });
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.reply).toBe("");
  });

  it("gera resposta sugerida com contexto e tom cordial", async () => {
    const res = await generateCustomerSuggestedReply({
      question: "Vocês entregam hoje no centro?",
      context: "Entregas até as 18h no centro com frete grátis para compras acima de R$ 50.",
      tone: "cordial",
      companyName: "Drogaria São Bento",
      segment: "Farmácia",
    });

    expect(res.ok).toBe(true);
    expect(res.reply).toBeTypeOf("string");
    expect(res.reply.length).toBeGreaterThan(20);
    expect(res.reply.toLowerCase()).toContain("centro");
    expect(res.modelUsed).toBeDefined();
  });

  it("gera resposta sugerida com tom comercial", async () => {
    const res = await generateCustomerSuggestedReply({
      question: "Qual o valor da camisa linho?",
      context: "Camisa de linho pura por R$ 189 em até 3x sem juros.",
      tone: "comercial",
      companyName: "Boutique Elegance",
      segment: "Moda",
    });

    expect(res.ok).toBe(true);
    expect(res.reply).toBeTypeOf("string");
    expect(res.reply).toContain("189");
  });

  it("gera resposta sugerida mesmo sem contexto adicional", async () => {
    const res = await generateCustomerSuggestedReply({
      question: "Como funciona a garantia do celular?",
      tone: "direto",
      companyName: "TechStore",
    });

    expect(res.ok).toBe(true);
    expect(res.reply).toBeTypeOf("string");
    expect(res.reply.length).toBeGreaterThan(15);
  });
});
