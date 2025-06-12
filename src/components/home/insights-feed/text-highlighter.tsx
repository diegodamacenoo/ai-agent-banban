import React from 'react'

// Função para destacar palavras-chave importantes em negrito
export function highlightKeywords(text: string): React.ReactNode {
  if (!text) return text

  // Padrões para identificar palavras-chave importantes
  const patterns = [
    // Números + substantivos (ex: "2 produtos", "5 lojas", "1 produto")
    /(\d+\s+(?:produtos?|lojas?|itens?|unidades?|dias?|horas?|semanas?|meses?))/gi,
    
    // Percentuais (ex: "25%", "38%")
    /(\d+(?:\.\d+)?%)/g,
    
    // Produtos entre aspas (ex: "Tênis Runner")
    /("[\w\s]+")/g,
    
    // Nomes de lojas específicas
    /(Loja\s+[\w\s]+)/gi,
    
    // Valores monetários (ex: R$ 1.500, mil, milésimo)
    /(R\$\s*[\d.,]+|mil(?:ésimo)?)/gi,
    
    // Prazos específicos (ex: "2 dias", "30 dias", "24-48 horas")
    /(\d+(?:-\d+)?\s+(?:dias?|horas?|semanas?|meses?))/gi,
    
    // Palavras de urgência e importância
    /(urgente|imediato|crítico|atenção|oportunidade|parabéns|urgentemente|imediatamente)/gi,
    
    // Status e classificações
    /(baixo|alto|médio|positivo|negativo)/gi,
    
    // Ações importantes
    /(aumento|redução|crescimento|queda|melhoria)/gi
  ]

  let highlightedText = text
  
  // Aplicar cada padrão sequencialmente
  patterns.forEach((pattern, index) => {
    highlightedText = highlightedText.replace(pattern, (match) => {
      // Evitar destacar texto que já está em tags
      if (match.includes('<span class="font-semibold">') || match.includes('</span>')) {
        return match
      }
      return `<span class="font-semibold">${match}</span>`
    })
  })

  // Converter string com HTML em JSX
  return (
    <span 
      dangerouslySetInnerHTML={{ 
        __html: highlightedText 
      }} 
    />
  )
}

// Função específica para títulos (destacar menos palavras para não sobrecarregar)
export function highlightTitleKeywords(text: string): React.ReactNode {
  if (!text) return text

  const titlePatterns = [
    // Apenas números + substantivos e percentuais para títulos
    /(\d+\s+(?:produtos?|lojas?|itens?))/gi,
    /(\d+(?:\.\d+)?%)/g,
    /(baixo|alto|crítico|oportunidade)/gi
  ]

  let highlightedText = text
  
  titlePatterns.forEach((pattern) => {
    highlightedText = highlightedText.replace(pattern, (match) => {
      if (match.includes('<span class="font-semibold">') || match.includes('</span>')) {
        return match
      }
      return `<span class="font-semibold">${match}</span>`
    })
  })

  return (
    <span 
      dangerouslySetInnerHTML={{ 
        __html: highlightedText 
      }} 
    />
  )
} 