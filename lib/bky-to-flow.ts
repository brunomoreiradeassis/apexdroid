/**
 * Converte XML de blocos (Blockly) em estrutura de fluxograma (nós e arestas)
 */
export function convertBkyToFlow(xmlText: string): { nodes: any[], edges: any[] } {
  const nodes: any[] = []
  const edges: any[] = []
  
  if (!xmlText || !xmlText.trim().startsWith('<xml')) {
    return { nodes, edges }
  }

  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, "text/xml")
    
    // Buscar blocos de topo (eventos)
    // Usar querySelectorAll que ignora namespaces para ser mais robusto
    const allBlocks = Array.from(xmlDoc.getElementsByTagName('block'))
    const topBlocks = allBlocks.filter(b => b.parentElement?.tagName.toLowerCase() === 'xml')
    
    let currentY = 100
    
    topBlocks.forEach((block, index) => {
      const blockId = block.getAttribute('id') || `block-${index}`
      const type = block.getAttribute('type')
      
      // Tentar extrair informacoes do bloco (ex: evento de componente)
      let label = type || "Bloco"
      let metadata: any = { type: "event" }
      
      const mutation = block.getElementsByTagName('mutation')[0]
      const fields = Array.from(block.getElementsByTagName('field'))
      
      if (type === "component_event" || type === "kodular_event") {
        const componentName = mutation?.getAttribute('instance_name') || 
                             fields.find(f => f.getAttribute('name') === 'COMPONENT_SELECTOR')?.textContent ||
                             fields.find(f => f.getAttribute('name') === 'COMPONENT')?.textContent
        
        const eventName = mutation?.getAttribute('event_name') || 
                         fields.find(f => f.getAttribute('name') === 'EVENT')?.textContent
        
        label = `Quando ${componentName}.${eventName}`
        metadata = { ...metadata, componentName, eventName }
      }

      const nodeX = index * 400 + 100
      const nodeY = currentY
      
      const eventNode = {
        id: blockId,
        type: "process",
        label: label,
        x: nodeX,
        y: nodeY,
        width: 200,
        height: 80,
        metadata
      }
      
      nodes.push(eventNode)
      
      // Processar blocos internos (statements)
      // Blockly XML: <statement name="DO"><block ...>...</block></statement>
      const statements = Array.from(block.children).filter(c => c.tagName.toLowerCase() === 'statement')
      statements.forEach(stmt => {
        const firstBlock = Array.from(stmt.children).find(c => c.tagName.toLowerCase() === 'block')
        if (firstBlock) {
          processStatement(firstBlock, blockId, nodeX, nodeY + 150, nodes, edges)
        }
      })
    })
  } catch (e) {
    console.error("Erro ao converter BKY para Flow:", e)
  }

  return { nodes, edges }
}

function processStatement(block: Element, parentId: string, x: number, y: number, nodes: any[], edges: any[]) {
  const blockId = block.getAttribute('id') || `sub-${Date.now()}-${Math.random()}`
  const type = block.getAttribute('type')
  
  let label = type || "Ação"
  let metadata: any = { type: "action" }
  
  const mutation = block.getElementsByTagName('mutation')[0]
  const fields = Array.from(block.getElementsByTagName('field'))
  
  if (type === "component_method" || type === "kodular_call_method") {
    const componentName = mutation?.getAttribute('instance_name') || 
                         fields.find(f => f.getAttribute('name') === 'COMPONENT_SELECTOR')?.textContent ||
                         fields.find(f => f.getAttribute('name') === 'COMPONENT')?.textContent
    
    const methodName = mutation?.getAttribute('method_name') || 
                      fields.find(f => f.getAttribute('name') === 'METHOD')?.textContent
    
    label = `${componentName}.${methodName}`
    metadata = { ...metadata, componentName, methodName }
  } else if (type === "controls_openAnotherScreen" || type === "kodular_open_screen") {
    // Buscar valor do nome da tela
    const values = Array.from(block.getElementsByTagName('value'))
    const screenValue = values.find(v => v.getAttribute('name') === 'SCREEN' || v.getAttribute('name') === 'SCREEN_NAME')
    const screenName = screenValue?.getElementsByTagName('field')[0]?.textContent || 
                       fields.find(f => f.getAttribute('name') === 'SCREEN')?.textContent || "Tela"
    
    label = `Abrir Tela: ${screenName}`
    metadata = { ...metadata, targetScreen: screenName }
  } else if (type === "controls_if" || type === "kodular_if") {
    label = "Se ... então"
    metadata = { ...metadata, type: "logic" }
  }

  const newNode = {
    id: blockId,
    type: (type?.includes('if') ? "decision" : "action") as any,
    label: label,
    x: x,
    y: y,
    width: 160,
    height: 60,
    metadata
  }
  
  nodes.push(newNode)
  edges.push({
    id: `e-${parentId}-${blockId}`,
    source: parentId,
    target: blockId
  })
  
  // Próximo bloco na sequência (next)
  const nexts = Array.from(block.children).filter(c => c.tagName.toLowerCase() === 'next')
  nexts.forEach(next => {
    const nextBlock = Array.from(next.children).find(c => c.tagName.toLowerCase() === 'block')
    if (nextBlock) {
      processStatement(nextBlock, blockId, x, y + 120, nodes, edges)
    }
  })
}
