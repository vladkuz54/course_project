import React, { useEffect, useRef, useState } from 'react';
import './GraphPage.css';
import ButtonStyle from "../../components/ButtonStyle/ButtonStyle.js";
import InputStyle from "../../components/InputStyle/InputStyle.js";
import { Link } from "react-router-dom";
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import axios from 'axios';
cytoscape.use(coseBilkent);


function GraphPage() {
    const [graphData, setGraphData] = useState([]);
    const [nodePositions, setNodePositions] = useState({});
    const [addEdgeSource, setAddEdgeSource] = useState('');
    const [addEdgeTarget, setAddEdgeTarget] = useState('');
    const [deleteEdgeSource, setDeleteEdgeSource] = useState('');
    const [deleteEdgeTarget, setDeleteEdgeTarget] = useState('');
    const [deleteNode, setDeleteNode] = useState('');
    const [action, setAction] = useState('');
    const [dfsData, setDfsData] = useState([]);
    const [animatedDfsList, setAnimatedDfsList] = useState([]);
    const [startNode, setStartNode] = useState(''); 
    const [showDFS, setShowDFS] = useState(0);
    const [isDfsRunning, setIsDfsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false); 
    const [isAnimating, setIsAnimating] = useState(false);
    const [visitedNodes, setVisitedNodes] = useState([]);
    const [visitedEdges, setVisitedEdges] = useState([]);
    const [currentStep, setCurrentStep] = useState(0); 
    const [maxEdges, setMaxEdges] = useState(0);
    const cyRef = useRef(null);
    const cyInstance = useRef(null);


    async function fetchGraphData() {
        try {
            const response = await axios.get('/api/graph');
    
            
            const graphData = response.data.map(node => ({
                ...node,
            }));
            setGraphData(graphData);
    
            
            const positions = {};
            graphData.forEach(node => {
                positions[node.id] = nodePositions[node.id] || {
                    x: Math.random() * 500,
                    y: Math.random() * 500,
                };
            });
            setNodePositions(positions);
    
            
            visualizeGraph(graphData, positions);
        } catch (error) {
            console.error('Error fetching graph data:', error);
        }
    }
    

  
    function visualizeGraph(graphData, positions) {
        const elements = graphData.map(node => ({
            data: { id: node.id.toString(), label: node.id.toString(), color: '#e9db70' },
            position: positions[node.id]
        })).concat(
            graphData.flatMap(node => node.edges.map(edge => ({
                data: {
                    id: `${node.id}-${edge}`,
                    source: node.id.toString(),
                    target: edge.toString(),
                    color: '#000'
                }
            })))
        );
    
        if (cyInstance.current) {
            cyInstance.current.json({ elements });
            cyInstance.current.layout({
                name: 'cose-bilkent',
                animate: true,
                animationDuration: 700,
                fit: true,
                padding: 30,
                randomize: false,
                nodeRepulsion: 4500,
                idealEdgeLength: 100,
                edgeElasticity: 0.45,
                nestingFactor: 0.1,
                gravity: 0.25,
                gravityRangeCompound: 1.5,
                gravityCompound: 0.5,
                gravityRange: 2.8,
                initialEnergyOnIncremental: 1.5
            }).run();
        } else {
            const cy = cytoscape({
                container: cyRef.current,
                elements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'data(color)',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'color': '#000',
                            "border-width": 1.5,
                            "border-color": "#000",
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)'
                        }
                    }
                ],
                layout: {
                    name: 'cose-bilkent',
                    animate: true,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    nodeRepulsion: 4500,
                    idealEdgeLength: 100,
                    edgeElasticity: 0.45,
                    nestingFactor: 0.1,
                    gravity: 0.25,
                    gravityRangeCompound: 1.5,
                    gravityCompound: 0.5,
                    gravityRange: 2.8,
                    initialEnergyOnIncremental: 1.5
                },
                userZoomingEnabled: true,
                userPanningEnabled: true
            });
    
            cyInstance.current = cy;
        }
    }
    
    

    useEffect(() => {
        fetchGraphData();
    }, []);



    function isGraphConnected(graph, startNode) {
        const visited = new Set();
        const stack = [startNode];

        while (stack.length > 0) {
            const currentNode = stack.pop();
            if (!visited.has(currentNode)) {
                visited.add(currentNode);

                const node = graph.find(n => n.id === currentNode);
                if (node) {
                    node.edges.forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            stack.push(neighbor);
                        }
                    });
                }
            }
        }

        const allNodeIds = graph.map(node => node.id);
        return visited.size === allNodeIds.length;
    }
    
    

    async function handleAddNode() {
        if (isAnimating) {
            alert('Cannot update graph during DFS animation');
            return;
        }

        try {
            if (graphData.length >= 15) {
                alert('Cannot add more than 15 nodes');
                return;
            }

            const edgesInput = addEdgeTarget.split(',').map(e => e.trim());


            const invalidValues = edgesInput.filter(e => !/^\d+$/.test(e));
            if (invalidValues.length > 0) {
                alert(`Invalid values`);
                setAddEdgeTarget('');
                return;
            }


            const edges = edgesInput.map(e => parseInt(e)).filter(e => !isNaN(e));
            const node = Math.max(...graphData.map(n => n.id)) + 1;

            const hasDuplicates = edges.some((item, index) => edges.indexOf(item) !== index);
            if (hasDuplicates) {
                alert('Duplicate edges are not allowed');
                setAddEdgeTarget('');
                return;
            }


            const invalidEdges = edges.filter(edge => !graphData.some(n => n.id === edge));
            if (invalidEdges.length > 0) {
                alert(`Invalid edges: ${invalidEdges.join(', ')}`);
                setAddEdgeTarget('');
                return;
            }

            await axios.post('/api/addNodeGraph', { node, edges });


            const response = await axios.get('/api/graph');
            const newGraphData = response.data;


            const newNode = {
                group: 'nodes',
                data: { id: node.toString(), label: node.toString(), color: '#e9db70' },
                position: { x: Math.random() * 500, y: Math.random() * 500 }
            };


            const newEdges = edges.map(edge => ({
                group: 'edges',
                data: {
                    id: `${node}-${edge}`,
                    source: node.toString(),
                    target: edge.toString(),
                    color: '#000'
                }
            }));


            cyInstance.current.add([newNode, ...newEdges]);

            setTimeout(() => {
                cyInstance.current.layout({
                    name: 'cose-bilkent',
                    animate: true,
                    animationDuration: 700,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    nodeRepulsion: 4500,
                    idealEdgeLength: 100,
                    edgeElasticity: 0.45,
                    nestingFactor: 0.1,
                    gravity: 0.25,
                    gravityRangeCompound: 1.5,
                    gravityCompound: 0.5,
                    gravityRange: 2.8,
                    initialEnergyOnIncremental: 1.5
                }).run();
            }, 700);

            cancelDfs();
            setGraphData(newGraphData);
            setAddEdgeTarget('');
        } catch (error) {
            console.error('Error adding node:', error);
        }
    }
    

    async function handleAddEdge() {
        if (isAnimating) {
            alert('Cannot update graph during DFS animation');
            return;
        }

        try {
            const source = parseInt(addEdgeSource);
            const targets = addEdgeTarget.split(',').map(e => parseInt(e.trim())).filter(e => !isNaN(e));
            if (isNaN(source) || targets.length === 0) {
                alert('Invalid values.');
                setAddEdgeSource('');
                setAddEdgeTarget('');
                return;
            }

            for (const target of targets) {
                if (cyInstance.current.getElementById(`${source}-${target}`).length > 0 || cyInstance.current.getElementById(`${target}-${source}`).length > 0) {
                    alert(`Edge between ${source} and ${target} already exists`);
                    setAddEdgeSource('');
                    setAddEdgeTarget('');
                    return;
                }
            }

            const invalidNodes = [source, ...targets].filter(node => !graphData.some(n => n.id === node));
            if (invalidNodes.length > 0) {
                alert(`Invalid nodes: ${invalidNodes.join(', ')}`);
                setAddEdgeSource('');
                setAddEdgeTarget('');
                return;
            }

            for (const target of targets) {
                if (cyInstance.current.getElementById(`${source}-${target}`).length === 0) {
                    const response = await axios.post('/api/addEdgeGraph', { source, target });
                    if (response.status !== 200) {
                        throw new Error('Error adding edge');
                    }


                    cyInstance.current.add({
                        group: 'edges',
                        data: {
                            id: `${source}-${target}`,
                            source: source.toString(),
                            target: target.toString(),
                            color: '#000'
                        }
                    }).style('opacity', 0);


                    setTimeout(() => {
                        cyInstance.current.getElementById(`${source}-${target}`).animate({
                            style: { opacity: 1 },
                            duration: 700,
                        });
                    }, 700);
                }
            }

            setTimeout(() => {
                cyInstance.current.layout({
                    name: 'cose-bilkent',
                    animate: true,
                    animationDuration: 700,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    nodeRepulsion: 4500,
                    idealEdgeLength: 100,
                    edgeElasticity: 0.45,
                    nestingFactor: 0.1,
                    gravity: 0.25,
                    gravityRangeCompound: 1.5,
                    gravityCompound: 0.5,
                    gravityRange: 2.8,
                    initialEnergyOnIncremental: 1.5
                }).run();
            }, 700);

            cancelDfs();
            fetchGraphData();
            setAddEdgeSource('');
            setAddEdgeTarget('');
        } catch (error) {
            console.error('Error adding edge:', error);
        }
    }
       

    async function handleDeleteEdge() {
        if (isAnimating) {
            alert('Cannot update graph during DFS animation');
            return;
        }
    
        try {
            const source = parseInt(deleteEdgeSource);
            const target = parseInt(deleteEdgeTarget);
            if (isNaN(source) || isNaN(target)) {
                alert('Invalid values');
                setDeleteEdgeSource('');
                setDeleteEdgeTarget('');
                return;
            }
    
            const invalidNodes = [source, target].filter(node => !graphData.some(n => n.id === node));
            if (invalidNodes.length > 0) {
                alert(`Invalid nodes: ${invalidNodes.join(', ')}`);
                setDeleteEdgeSource('');
                setDeleteEdgeTarget('');
                return;
            }
    
            const edgeExists = graphData.some(
                n => (n.id === source && n.edges.includes(target)) || (n.id === target && n.edges.includes(source))
            );
            if (!edgeExists) {
                alert(`Edge between ${source} and ${target} does not exist`);
                setDeleteEdgeSource('');
                setDeleteEdgeTarget('');
                return;
            }
    
            const remainingGraph = graphData.map(n => ({
                ...n,
                edges: n.edges.filter(e => !(n.id === source && e === target) && !(n.id === target && e === source)),
            }));
            if (!isGraphConnected(remainingGraph, source)) {
                alert('Deleting this edge would disconnect the graph');
                setDeleteEdgeSource('');
                setDeleteEdgeTarget('');
                return;
            }
    
            const edgeId = `${source}-${target}`;
            const edge = cyInstance.current.getElementById(edgeId);
    
            if (edge.length > 0) {
                edge.animate(
                    {
                        complete: () => {
                            edge.remove();
                            cyInstance.current.layout({
                                name: 'cose-bilkent',
                                animate: true,
                                animationDuration: 700,
                                fit: true,
                                padding: 30,
                                randomize: false,
                                nodeRepulsion: 4500,
                                idealEdgeLength: 100,
                                edgeElasticity: 0.45,
                                nestingFactor: 0.1,
                                gravity: 0.25,
                                gravityRangeCompound: 1.5,
                                gravityCompound: 0.5,
                                gravityRange: 2.8,
                                initialEnergyOnIncremental: 1.5
                            }).run();
                        },
                    }
                );
            }
    
            
            const response = await axios.post('/api/removeEdgeGraph', { source, target });
            if (response.status === 200) {
                fetchGraphData(); 
            }
    
            cancelDfs();
            setDeleteEdgeSource('');
            setDeleteEdgeTarget('');
        } catch (error) {
            console.error('Error deleting edge:', error);
        }
    }
    

    async function handleDeleteNode() {
        if (isAnimating) {
            alert('Cannot update graph during DFS animation');
            return;
        }
    
        try {
            const node = parseInt(deleteNode);
            if (isNaN(node)) {
                alert('Invalid value');
                setDeleteNode('');
                return;
            }
            if (!graphData.some(n => n.id === node)) {
                alert(`Invalid node: ${node}`);
                setDeleteNode('');
                return;
            }
    
            if (graphData.length <= 2) {
                alert('Cannot delete these nodes');
                setDeleteNode('');
                return;
            }
    
            const remainingGraph = graphData
                .filter(n => n.id !== node)
                .map(n => ({
                    ...n,
                    edges: n.edges.filter(e => e !== node),
                }));
    
            if (!isGraphConnected(remainingGraph, remainingGraph[0]?.id)) {
                alert(`Deleting this node would result in a disconnected graph`);
                setDeleteNode('');
                return;
            }
    
            const nodeElement = cyInstance.current.getElementById(node.toString());
    
            if (nodeElement.length > 0) {
                const connectedEdges = nodeElement.connectedEdges();
                connectedEdges.animate(
                    { style: { opacity: 0 }, duration: 700 },
                    {
                        complete: () => connectedEdges.remove(),
                    }
                );
    
    
                nodeElement.animate(
                    { style: { opacity: 0 }, duration: 700 },
                    {
                        complete: () => {
                            nodeElement.remove();
                            setTimeout(() => {
                                cyInstance.current.layout({
                                    name: 'cose-bilkent',
                                    animate: true,
                                    animationDuration: 700,
                                    fit: true,
                                    padding: 30,
                                    randomize: false,
                                    nodeRepulsion: 4500,
                                    idealEdgeLength: 100,
                                    edgeElasticity: 0.45,
                                    nestingFactor: 0.1,
                                    gravity: 0.25,
                                    gravityRangeCompound: 1.5,
                                    gravityCompound: 0.5,
                                    gravityRange: 2.8,
                                    initialEnergyOnIncremental: 1.5
                                }).run();
                            }, 700);
                        },
                    }
                );
            }
    
    
            const response = await axios.post('/api/removeNodeGraph', { node });
            if (response.status === 200) {
                fetchGraphData(); 
            }
    
            cancelDfs();
            setDeleteNode('');
        } catch (error) {
            console.error('Error deleting node:', error);
        }
    }
    


    function handleKeyDown(e, action) {
        if (e.key === 'Enter') {
            switch (action) {
                case 'addNode':
                    handleAddNode();
                    break;
                case 'addEdge':
                    handleAddEdge();
                    break;
                case 'deleteEdge':
                    handleDeleteEdge();
                    break;
                case 'deleteNode':
                    handleDeleteNode();
                    break;
                default:
                    break;
            }
        }
    }

    async function fetchDfsData(startNode) {
        if (!startNode) {
            alert('Start node is required');
            return;
        }

        try {
            const response = await axios.get('/api/dfs', { params: { start: startNode } });
            const dfsData = response.data;

            if (!dfsData || !Array.isArray(dfsData)) {
                throw new Error('Invalid DFS response');
            }

            setDfsData(dfsData);
            setIsAnimating(true);
        } catch (error) {
            console.error('Error fetching DFS data:', error);
        }
    }

    function showDfs() {
        if (showDFS === 0) {
            resetDfsProgress();
        }
        const startNodeInput = prompt("Enter Start Node for DFS:");
        if (startNodeInput !== null && startNodeInput > 0) {
            const startNode = parseInt(startNodeInput);
            if (!isNaN(startNode) && graphData.some(node => node.id === startNode)) {
                setStartNode(startNode);
                setShowDFS(1);
                setIsDfsRunning(true);
                setIsPaused(false);
                setCurrentStep(0);
                setDfsData([]);
                setAnimatedDfsList([]);
            } else {
                alert(`Node ${startNodeInput} does not exist`);
            }
        }
    }
  
    function resetDfsProgress() {
        setDfsData([]);
        setVisitedNodes([]);
        setVisitedEdges([]);
        setIsAnimating(false);
        setAnimatedDfsList([]);
        setShowDFS(0);
        cyInstance.current.nodes().forEach(node => {
            node.style('background-color', '#e9db70');
        });
        cyInstance.current.edges().forEach(edge => {
            edge.style('line-color', '#000');
            edge.style('target-arrow-color', '#000');
        });
    }
  

  
    function performDfsStep() {
        const noDfsData = !dfsData.length;
        const reachedEnd = currentStep >= dfsData.length;
        const paused = isPaused;

        if (noDfsData || reachedEnd || paused) {
            setIsAnimating(false);
            return;
        }

        const item = dfsData[currentStep];
        const { current, edge } = item;


        const currentNode = cyInstance.current.getElementById(current.toString());
        if (currentNode) {
            currentNode.style('background-color', 'red');
        }

        if (edge && edge[0] !== edge[1]) {
            const edgeId1 = `${edge[0]}-${edge[1]}`;
            const edgeId2 = `${edge[1]}-${edge[0]}`;
            const edge1 = cyInstance.current.getElementById(edgeId1);
            const edge2 = cyInstance.current.getElementById(edgeId2);

            if (edge1 && edge1.length > 0) {
                edge1.style('line-color', 'red');
                edge1.style('target-arrow-color', 'red');
            }
            if (edge2 && edge2.length > 0) {
                edge2.style('line-color', 'red');
                edge2.style('target-arrow-color', 'red');
            }
        }


        setVisitedNodes(prev => [...prev, current]);
        if (edge) {
            setVisitedEdges(prev => [...prev, { source: edge[0], target: edge[1] }]);
        }


        setAnimatedDfsList([...animatedDfsList, item]);


        setCurrentStep(prev => ++prev);
    }
  
  
    function pauseDfs() {
        setIsPaused(true);
    }
  
    function resumeDfs() {
        setIsPaused(false);
        if (!isAnimating) {
            setIsAnimating(true);
        }
    }
  
  
    function cancelDfs() {
        setIsDfsRunning(false);
        setIsAnimating(false);
        setIsPaused(false);
        setShowDFS(0);
        resetDfsProgress();
    }
  
  
    function backDfs() {
        if (currentStep <= 1) {
            return;
        }

        const prevStep = currentStep - 1;

        const item = dfsData[prevStep];
        const { current, edge } = item;


        const currentNode = cyInstance.current.getElementById(current.toString());
        if (currentNode) {
            currentNode.style('background-color', '#e9db70');
        }


        if (edge && edge[0] !== edge[1]) {
            const edgeId1 = `${edge[0]}-${edge[1]}`;
            const edgeId2 = `${edge[1]}-${edge[0]}`;
            const edge1 = cyInstance.current.getElementById(edgeId1);
            const edge2 = cyInstance.current.getElementById(edgeId2);

            if (edge1.length > 0) {
                edge1.style('line-color', '#000');
                edge1.style('target-arrow-color', '#000');
            }
            if (edge2.length > 0) {
                edge2.style('line-color', '#000');
                edge2.style('target-arrow-color', '#000');
            }
        }

        setVisitedNodes((prev) => prev.slice(0, prevStep));
        setVisitedEdges((prev) => prev.slice(0, prevStep));
        setAnimatedDfsList((prev) => prev.slice(0, prevStep));


        setCurrentStep(prevStep);


        if (!isPaused) {
            setIsAnimating(true);
        }
    }
  
  

    useEffect(() => {
        if (isAnimating && !isPaused) {
        const interval = setInterval(() => {
            performDfsStep();
        }, 500);
  
        return () => clearInterval(interval);
        }
    }, [isAnimating, isPaused, currentStep, dfsData]);
  
  
    useEffect(() => {
        if (showDFS === 1) {
            fetchDfsData(startNode);
        }
    }, [showDFS, startNode]);
  

    return (
        <div className="graphPage__content">
            <header>
                {action === '' && (
                    <>
                        <ButtonStyle text="Add node" onClick={() => setAction('addNode')} />
                        <ButtonStyle text="Add edge" onClick={() => setAction('addEdge')} />
                        <ButtonStyle text="Delete edge" onClick={() => setAction('deleteEdge')} />
                        <ButtonStyle text="Delete node" onClick={() => setAction('deleteNode')} />
                    </>
                )}
                {action === 'addNode' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Edges (comma separated)"
                            value={addEdgeTarget}
                            onChange={(e) => setAddEdgeTarget(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'addNode')}
                        />
                        <ButtonStyle text="Add node" onClick={handleAddNode} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
                {action === 'addEdge' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Source node"
                            value={addEdgeSource}
                            onChange={(e) => setAddEdgeSource(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'addEdge')}
                        />
                        <InputStyle
                            type="text"
                            placeholder="Edges (comma separated)"
                            value={addEdgeTarget}
                            onChange={(e) => setAddEdgeTarget(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'addEdge')}
                        />
                        <ButtonStyle text="Add edge" onClick={handleAddEdge} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
                {action === 'deleteEdge' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Source node"
                            value={deleteEdgeSource}
                            onChange={(e) => setDeleteEdgeSource(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'deleteEdge')}
                        />
                        <InputStyle
                            type="text"
                            placeholder="Target node"
                            value={deleteEdgeTarget}
                            onChange={(e) => setDeleteEdgeTarget(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'deleteEdge')}
                        />
                        <ButtonStyle text="Delete edge" onClick={handleDeleteEdge} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
                {action === 'deleteNode' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Delete node"
                            value={deleteNode}
                            onChange={(e) => setDeleteNode(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'deleteNode')}
                        />
                        <ButtonStyle text="Delete node" onClick={handleDeleteNode} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
            </header>
            <div className="graphPage__content-graph" ref={cyRef} style={{ width: '100%', height: '500px' }}></div>
            <>
                {showDFS === 0 ? (
                    <></>
                ) : (
                    <div className="graphPage__content-dfs">
                        <h2>DFS: </h2>
                        {animatedDfsList.length > 0 ? (
                            animatedDfsList.map((item, index) => (
                                <div key={index} className="graphPage__content-dfs-p">
                                    <p>{item.current}</p>
                                </div>
                            ))
                        ) : (
                            <p>No nodes visited</p>
                        )}
                    </div>
                )}
            </>
            <div className="graphPage__content-list">
                {graphData.map((node, index) => {
                    return (
                        <div key={index} className="graphPage__content-list-items" style={{ gridTemplateColumns: `repeat(${maxEdges + 1}, 1fr)` }}>
                        <p className="graphPage__content-list-item-start-edge">{node.id}:</p>
                        {node.edges.map((edge, index) => {
                            return (
                                <p className="graphPage__content-list-item" key={index}>{edge}</p>
                            );
                        })}
                        </div>
                    );
                })}
            </div>
                <div className="graphPage__content-buttons">
                <ButtonStyle text={isDfsRunning ? "Cancel" : "Start DFS"} onClick={isDfsRunning ? cancelDfs : showDfs} />
                <ButtonStyle text={isPaused ? "Resume" : "Pause"} onClick={isPaused ? resumeDfs : pauseDfs} />
                <ButtonStyle text="Back" onClick={backDfs} />
                <Link to="/">
                    <ButtonStyle text="Home" />
                </Link>
            </div>
        </div>
    );
}

export default GraphPage;