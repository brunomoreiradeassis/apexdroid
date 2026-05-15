/**
 * Converte estrutura de fluxograma (nós e arestas) em XML de blocos (Blockly)
 */
export function convertFlowToBky(nodes: any[], edges: any[]): string {
  let xml = '<xml xmlns="http://www.w3.org/1999/xhtml">'
  
  // Encontrar nós de evento (process)
  const eventNodes = nodes.filter(n => n.metadata?.type === "event" || n.label.startsWith("Quando"))
  
  eventNodes.forEach(node => {
    const compName = node.metadata?.componentName || node.label.replace("Quando ", "").split(".")[0]
    const eventName = node.metadata?.eventName || node.label.split(".")[1] || "Click"
    
    xml += `<block type="component_event" x="${node.x}" y="${node.y}">`
    xml += `<mutation component_type="Form" instance_name="${compName}" event_name="${eventName}"></mutation>`
    xml += `<field name="COMPONENT_SELECTOR">${compName}</field>`
    
    // Seguir as conexoes para gerar os statements
    let currentEdge = edges.find(e => e.source === node.id)
    if (currentEdge) {
      xml += '<statement name="DO">'
      xml += processNodeToBky(currentEdge.target, nodes, edges)
      xml += '</statement>'
    }
    
    xml += '</block>'
  })
  
  xml += '</xml>'
  return xml
}

function processNodeToBky(nodeId: string, nodes: any[], edges: any[]): string {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return ""
  
  let blockXml = ""
  
  if (node.label.startsWith("Abrir Tela")) {
    const screenName = node.metadata?.targetScreen || node.label.split(": ")[1] || "Screen1"
    blockXml += `<block type="controls_openAnotherScreen">`
    blockXml += `<value name="SCREEN"><block type="text"><field name="TEXT">${screenName}</field></block></value>`
  } else if (node.metadata?.type === "action" || node.label.includes(".")) {
    const compName = node.metadata?.componentName || node.label.split(".")[0]
    const methodName = node.metadata?.methodName || node.label.split(".")[1]
    blockXml += `<block type="component_method">`
    blockXml += `<mutation component_type="Form" method_name="${methodName}" instance_name="${compName}"></mutation>`
    blockXml += `<field name="COMPONENT_SELECTOR">${compName}</field>`
  } else {
    // Bloco genérico para ações desconhecidas
    blockXml += `<block type="text_print">`
    blockXml += `<value name="TEXT"><block type="text"><field name="TEXT">${node.label}</field></block></value>`
  }
  
  // Próximo bloco na sequência
  const nextEdge = edges.find(e => e.source === node.id)
  if (nextEdge) {
    blockXml += '<next>'
    blockXml += processNodeToBky(nextEdge.target, nodes, edges)
    blockXml += '</next>'
  }
  
  blockXml += '</block>'
  return blockXml
}
