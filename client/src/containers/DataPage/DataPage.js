import React, { useState, useEffect, useRef } from 'react';
import Tree from 'react-d3-tree';
import './DataPage.css';
import ButtonStyle from "../../components/ButtonStyle/ButtonStyle.js";
import InputStyle from "../../components/InputStyle/InputStyle.js";
import { Link } from "react-router-dom";
import NodeStyle from '../../components/NodeStyle.js';
import axios from 'axios';

function DataPage() {
    const [treeData, setTreeData] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [deleteValue, setDeleteValue] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [showSearchResult, setShowSearchResult] = useState(false);
    const [printResult, setPrintResult] = useState([]);
    const [showPrintResult, setShowPrintResult] = useState(false);
    const [action, setAction] = useState('');
    const treeContainer = useRef(null);

    function transformTreeData(data, newNodeId = null, deletedNodeId = null) {
        if (!Array.isArray(data)) {
            console.error('Invalid tree data format:', data);
            return null;
        }

        function buildTree(node) {
            if (!node) {
                return {
                    name: 'NIL',
                    nodeSvgShape: {
                        shape: 'circle',
                        shapeProps: {
                            r: 10,
                            fill: 'white',
                            stroke: 'black',
                            strokeWidth: 1.5,
                            opacity: 0.5,
                        },
                    },
                    attributes: { id: 'NIL' },
                    children: [],
                };
            }

            return {
                name: `${node.data}`,
                attributes: { id: node.id },
                nodeSvgShape: {
                    shape: 'custom',
                    shapeProps: {
                        fill: node.color === 'RED' ? 'red' : 'black',
                        stroke: 'black',
                        strokeWidth: 2,
                        isDeleting: node.id === deletedNodeId,
                        isNew: node.id === newNodeId,
                    },
                },
                children: [
                    buildTree(data.find((n) => n.id === node.left) || null),
                    buildTree(data.find((n) => n.id === node.right) || null),
                ],
            };
        }

        const rootNode = data.find((n) => n.parent === null);
        if (!rootNode) {
            return null;
        }

        return buildTree(rootNode);
    }
    

    async function fetchTreeData() {
        try {
            const response = await axios.get('/api/tree');
            if (response.status === 200) {
                const treeData = response.data;
                setTreeData(transformTreeData(treeData));
            }
        } catch (error) {
            console.error('Error fetching tree data:', error);
        }
    }

    useEffect(() => {
        fetchTreeData();
    }, []);


    async function handleInsert() {
        try {
            const val = parseInt(inputValue);
            
            if (isNaN(val)) {
                alert('Only integers are allowed');
                return;
            }

            const response = await axios.post('/api/addNodeTree', { data: val });

            const newNodeId = response.data.newNodeId;
            const updatedTreeData = transformTreeData(response.data.tree, newNodeId);

            setTreeData(updatedTreeData);
            setInputValue('');
            setPrintResult([]);
            setShowPrintResult(false);
            setSearchResult([]);
            setShowSearchResult(false);
            
        } catch(error) {
            console.error('Error inserting node:', error);
        }
    }
    

    async function handleDeleteNode() {
        try {
            const val = parseInt(deleteValue);

            if (isNaN(val)) {
                alert('Only integers are allowed');
                return;
            }


            const response = await axios.post('/api/deleteNodeTree', { data: val });
            
            const node = response.data;

            const rawTreeResponse = await axios.get('/api/tree');
            const rawTreeData = rawTreeResponse.data;

            const updatedTreeData = transformTreeData(rawTreeData, null, node.deletedNodeId);
            setTreeData(updatedTreeData);


            setTimeout(async () => {
                await handleDelete(node.node_value);
            }, 1000);
            
        } catch (error) {
            console.error('Error marking node for deletion:', error);
        }
    }


    async function handleDelete(deleteValue) {
        try {
            const response = await axios.post('/api/removeNodeTree', { data: deleteValue });
            if (response.status === 200) {
                fetchTreeData();
                setDeleteValue('');
                setPrintResult([]);
                setShowPrintResult(false);
                setSearchResult([]);
                setShowSearchResult(false);
            }
        } catch (error) {
            console.error('Error deleting node:', error);
        }
    }
    

    async function handleSearch() {
        try {

            if (!treeData) {
                alert('Tree is empty');
                return;
            }
            
            const val = parseInt(searchValue);

            if (isNaN(val)) {
                alert('Only integers are allowed');
                return;
            }

            const response = await axios.get('/api/searchTree', { params: { data: val } });
            const result = response.data;
            setSearchResult([]);
            setShowSearchResult(true);
            setShowPrintResult(false);

            result.forEach((node, index) => {
                setTimeout(() => {
                    setSearchResult((prev) => [...prev, node]);


                    const nodes = document.querySelector(`g[id="${node.id}"]`);
                    if (nodes) {
                        const circle = nodes.querySelector('circle');
                        if (circle) {
                            circle.style.stroke = 'white';
                            circle.style.strokeWidth = 4;
                            setTimeout(() => {
                                circle.style.stroke = 'black';
                                circle.style.strokeWidth = 2;
                            }, 500);
                        }
                    }
                }, index * 1000);
            });

            setSearchValue('');
        } catch (error) {
            console.error('Searching returned no results:', error);
        }
    }


    async function handlePrint() {
        try {

            if (!treeData) {
                alert('Tree is empty');
                return;
            }

            const response = await axios.get('/api/printTree');
            const result = response.data;
            setPrintResult([]);
            setShowPrintResult(true);
            setShowSearchResult(false);

            result.forEach((node, index) => {
                setTimeout(() => {
                    setPrintResult((prev) => [...prev, node]);

                    const nodes = document.querySelector(`g[id="${node.id}"]`);
                    if (nodes) {
                        const circle = nodes.querySelector('circle');
                        if (circle) {
                            circle.style.stroke = 'white';
                            circle.style.strokeWidth = 4;
                            setTimeout(() => {
                                circle.style.stroke = 'black';
                                circle.style.strokeWidth = 2;
                            }, 500);
                        }
                    }
                    
                }, index * 1000);
            });
        } catch (error) {
            console.error('Traversing returned no results:', error);
        }
    }
    

    function handleKeyDown(e, action) {
        if (e.key === 'Enter') {
            switch (action) {
                case 'insert':
                    handleInsert();
                    break;
                case 'delete':
                    handleDeleteNode();
                    break;
                case 'search':
                    handleSearch();
                    break;
                default:
                    break;
            }
        }
    }

    return (
        <div className="datapage__content">
            <header>
                {action === '' && (
                    <>
                        <ButtonStyle text="Insert" onClick={() => {
                            setAction('insert');
                            setShowPrintResult(false);
                        }} />
                        <ButtonStyle text="Delete" onClick={() => {
                            setAction('delete');
                            setShowPrintResult(false);
                        }} />
                        <ButtonStyle text="Search" onClick={() => {
                            setAction('search');
                            setShowPrintResult(false);
                        }} />
                        <ButtonStyle text="Print" onClick={handlePrint} />
                        <Link to="/">
                            <ButtonStyle text="Home" />
                        </Link>
                    </>
                )}
                {action === 'insert' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Insert"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'insert')}
                        />
                        <ButtonStyle text="Insert" onClick={handleInsert} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
                {action === 'delete' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Delete"
                            value={deleteValue}
                            onChange={(e) => setDeleteValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'delete')}
                        />
                        <ButtonStyle text="Delete" onClick={handleDeleteNode} />
                        <ButtonStyle text="Back" onClick={() => setAction('')} />
                    </>
                )}
                {action === 'search' && (
                    <>
                        <InputStyle
                            type="text"
                            placeholder="Search"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'search')}
                        />
                        <ButtonStyle text="Search" 
                            onClick={handleSearch} />
                        <ButtonStyle text="Back" 
                            onClick={() => { 
                                setAction('');
                                setShowSearchResult(false);
                            }} />
                    </>
                )}
            </header>
            {showSearchResult && (
                <div className="datapage__content-result">
                    <h2>Search Path:</h2>
                    {searchResult.map((node, index) => (
                        <div className='datapage__content-result-p' key={index}>
                            <p>{node.data}</p>
                        </div>
                    ))}
                </div>
            )}
            {showPrintResult && (
                <div className="datapage__content-result">
                    <h2>Print:</h2>
                    {printResult.map((node, index) => (
                        <div className='datapage__content-result-p' key={index}>
                            <p>{node.data}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className='dataPage__tree' ref={treeContainer} style={{ width: '100%', height: '600px' }}>
                {treeData && (
                    <Tree
                        data={treeData}
                        renderCustomNodeElement={(rd3tProps) => <NodeStyle {...rd3tProps} />}
                        orientation="vertical"
                        separation={{ siblings: 0.5, nonSiblings: 0.5 }}
                        translate={{ x: 710, y: 50 }}
                        zoomable
                    />
                )}
            </div>

        </div>
    );
}

export default DataPage;
