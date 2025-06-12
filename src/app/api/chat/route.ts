import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Pergunta é obrigatória' },
        { status: 400 }
      );
    }

    // Cria um ReadableStream para simular streaming
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Simula delay inicial
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Primeira parte da resposta
        controller.enqueue(encoder.encode('Pensando'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        controller.enqueue(encoder.encode('…'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        controller.enqueue(encoder.encode('\n\n'));
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Segunda parte - resposta gerada
        const response = `Resposta gerada para: "${question}"`;
        
        // Simula digitação caractere por caractere
        for (let i = 0; i < response.length; i++) {
          controller.enqueue(encoder.encode(response[i]));
          // Delay variável para simular digitação natural
          const delay = Math.random() * 50 + 20; // 20-70ms
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Adiciona informações extras baseadas na pergunta
        await new Promise(resolve => setTimeout(resolve, 300));
        controller.enqueue(encoder.encode('\n\n'));
        
        if (question.toLowerCase().includes('evento')) {
          controller.enqueue(encoder.encode('💡 Dica: Você pode visualizar eventos em tempo real na página de Eventos.'));
        } else if (question.toLowerCase().includes('relatório')) {
          controller.enqueue(encoder.encode('📊 Dica: Acesse a página de Relatórios para baixar documentos gerados.'));
        } else if (question.toLowerCase().includes('produto') || question.toLowerCase().includes('catálogo')) {
          controller.enqueue(encoder.encode('🛍️ Dica: Explore o Catálogo para ver produtos e variações disponíveis.'));
        } else {
          controller.enqueue(encoder.encode('ℹ️ Para mais informações, navegue pelas diferentes seções do sistema.'));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 