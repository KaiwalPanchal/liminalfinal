'use client';
import React, { useCallback } from 'react';
import { ForceGraph2D } from 'react-force-graph';

interface Node {
  id: string;
  label: string;
  color: string;
  size: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const ForceGraphExample: React.FC = () => {
  // Sample graph data with pastel colors and smaller nodes
  const graphData: GraphData = {
    nodes: [
      // Core Concepts
      { id: 'neural_network', label: 'Neural Network', color: '#FFB3BA', size: 12 },
      
      // Layers
      { id: 'input_layer', label: 'Input Layer\n(784 neurons)', color: '#BAFFC9', size: 10 },
      { id: 'hidden_layers', label: 'Hidden Layers\n(16 neurons each)', color: '#BAFFC9', size: 10 },
      { id: 'output_layer', label: 'Output Layer\n(10 neurons)', color: '#BAFFC9', size: 10 },
      
      // Components
      { id: 'weights', label: 'Weights', color: '#BAE1FF', size: 8 },
      { id: 'biases', label: 'Biases', color: '#BAE1FF', size: 8 },
      { id: 'activation', label: 'Activation Function', color: '#BAE1FF', size: 8 },
      
      // Processing Elements
      { id: 'edges', label: 'Edge Detection', color: '#FFFFBA', size: 9 },
      { id: 'patterns', label: 'Pattern Recognition', color: '#FFFFBA', size: 9 },
      { id: 'digits', label: 'Digit Classification', color: '#FFFFBA', size: 9 },
      
      // Mathematical Concepts
      { id: 'weighted_sum', label: 'Weighted Sum', color: '#E8BAFF', size: 7 },
      { id: 'sigmoid', label: 'Sigmoid Function', color: '#E8BAFF', size: 7 },
      { id: 'relu', label: 'ReLU Function', color: '#E8BAFF', size: 7 }
    ],
    links: [
      // Layer Connections
      { source: 'neural_network', target: 'input_layer', value: 8 },
      { source: 'neural_network', target: 'hidden_layers', value: 8 },
      { source: 'neural_network', target: 'output_layer', value: 8 },
      { source: 'input_layer', target: 'hidden_layers', value: 6 },
      { source: 'hidden_layers', target: 'output_layer', value: 6 },
      
      // Component Relationships
      { source: 'input_layer', target: 'weights', value: 5 },
      { source: 'hidden_layers', target: 'weights', value: 5 },
      { source: 'hidden_layers', target: 'biases', value: 5 },
      { source: 'hidden_layers', target: 'activation', value: 5 },
      
      // Processing Flow
      { source: 'input_layer', target: 'edges', value: 4 },
      { source: 'edges', target: 'patterns', value: 4 },
      { source: 'patterns', target: 'digits', value: 4 },
      { source: 'digits', target: 'output_layer', value: 4 },
      
      // Mathematical Relationships
      { source: 'weights', target: 'weighted_sum', value: 3 },
      { source: 'biases', target: 'weighted_sum', value: 3 },
      { source: 'weighted_sum', target: 'sigmoid', value: 3 },
      { source: 'weighted_sum', target: 'relu', value: 3 },
      { source: 'sigmoid', target: 'activation', value: 3 },
      { source: 'relu', target: 'activation', value: 3 }
    ]
  };

  // Node click handler
  const handleNodeClick = useCallback((node: any) => {
    console.log('Clicked node:', node);
  }, []);

  // Link click handler
  const handleLinkClick = useCallback((link: any) => {
    console.log('Clicked link:', link);
  }, []);

  // Custom node paint function with smaller font size
  const paintNode = useCallback((node: any, ctx: any) => {
    // Draw filled circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw label with smaller font
    ctx.font = '5px SF Pro';  // Reduced font size
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y); 
  }, []);

  return (
    <div className="w-[400px] h-full bg-gray-50 rounded-lg shadow-sm">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="label"
        nodeColor={(node: any) => (node as Node).color}
        nodeRelSize={3}  // Reduced from 6 to 3
        linkWidth={(link: any) => (link as Link).value / 2}  // Dividing by 2 to keep lines from being too thick
        linkColor={() => '#E6E6E6'}
        nodeCanvasObject={paintNode}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        backgroundColor="black"
        d3VelocityDecay={0.1}
        width={400}
        dagLevelDistance={50}
      />
    </div>
  );
};

export default ForceGraphExample;