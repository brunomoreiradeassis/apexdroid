import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    if (!rawBody) {
      console.error('Modify code error: Empty request body')
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('Modify code error: Invalid JSON in request body', rawBody)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { code, instruction, settings } = body
    
    // Extrair configuracoes do usuario
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    if (!code || !instruction) {
      return NextResponse.json(
        { error: 'Code and instruction are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `Você é um especialista em arquivos SCM do Kodular/MIT App Inventor. 
Arquivos SCM são representações JSON de telas e componentes.

Sua tarefa é modificar o JSON fornecido seguindo as instruções do usuário.
Regras:
1. Retorne APENAS o JSON modificado.
2. Não inclua blocos de código markdown (\`\`\`json ... \`\`\`).
3. Não inclua nenhuma explicação antes ou depois do JSON.
4. Mantenha a estrutura válida do SCM.
5. Se a instrução pedir para mudar cores, use o formato &HAARRGGBB (ex: &HFFFF0000 para vermelho).
6. Se a instrução pedir para mudar dimensões, use -1 para Automático e -2 para Fill Parent.
7. Garanta que o JSON resultante seja válido e possa ser parseado.`

    const prompt = `JSON ATUAL:
${code}

INSTRUÇÃO:
${instruction}`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt,
      temperature: 0.2, // Baixa temperatura para manter a estrutura do JSON
    })

    // Extração robusta de JSON do retorno da IA
    let modifiedCode = text.trim()
    
    // Se a IA envolver o código em blocos markdown, extrair apenas o conteúdo do bloco
    const jsonMatch = modifiedCode.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      modifiedCode = jsonMatch[1].trim()
    } else {
      // Caso não tenha blocos markdown, tentar encontrar o primeiro { e o último }
      const firstBrace = modifiedCode.indexOf('{')
      const lastBrace = modifiedCode.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        modifiedCode = modifiedCode.substring(firstBrace, lastBrace + 1)
      }
    }

    // Validar se é um JSON válido antes de retornar
    try {
      JSON.parse(modifiedCode)
    } catch (e) {
      console.error('AI generated invalid JSON:', modifiedCode)
      return NextResponse.json(
        { error: 'A IA gerou um código inválido. Tente novamente com uma instrução mais clara.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      modifiedCode
    })
  } catch (error) {
    console.error('Modify code error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to modify code' 
      },
      { status: 500 }
    )
  }
}
