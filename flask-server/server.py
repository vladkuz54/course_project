from flask import Flask, request, jsonify, send_from_directory
from dfs import main_graph, main_dfs, set_edges, get_edges, graph
from redblack import tree


app = Flask(__name__, static_folder='../client/build')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    if path.startswith('api/'): 
        return jsonify({"error": "API endpoint not found"}), 404
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/graph', methods=['GET'])
def get_graph():
    try:
        graph = main_graph()
        return jsonify(graph)
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error fetching graph data', 500

@app.route('/api/dfs', methods=['GET'])
def get_dfs():
    start_vertex = request.args.get('start')
    if start_vertex is None:
        return 'Missing start vertex', 400
    try:
        dfs_data = main_dfs(int(start_vertex))
        if not dfs_data or not isinstance(dfs_data, list):
            return 'Invalid DFS response', 500
        return jsonify(dfs_data)
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error fetching DFS data', 500


@app.route('/api/addNodeGraph', methods=['POST'])
def add_node_graph():
    data = request.json
    node = data['node']
    edges = data.get('edges', []) 
    try:
        graph.add_vertex(node)
        set_edges(get_edges() + [(node, edge) for edge in edges])
        return 'Node and edges added successfully'
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error adding node', 500

@app.route('/api/addEdgeGraph', methods=['POST'])
def add_edge_graph():
    data = request.json
    source = data['source']
    target = data['target']
    try:
        set_edges(get_edges() + [(source, target)])
        return 'Edge added successfully'
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error adding edge', 500

@app.route('/api/removeNodeGraph', methods=['POST'])
def remove_node_graph():
    data = request.json
    node = data['node']
    try:
        edges = get_edges()
        edges = [edge for edge in edges if node not in edge]
        graph.remove_vertex(node)
        set_edges(edges)
        return 'Node removed successfully'
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error removing node', 500


@app.route('/api/edgesGraph', methods=['POST'])
def get_edges_graph():
    data = request.json
    edges = data['edges']
    try:
        set_edges(edges)
        return 'Edges set successfully'
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error setting edges', 500

@app.route('/api/removeEdgeGraph', methods=['POST'])
def remove_edge_graph():
    data = request.json
    source = data['source'] 
    target = data['target']
    try:
        edges = get_edges()
        edges = [edge for edge in edges if edge != (source, target) and edge != (target, source)]
        set_edges(edges)
        graph.remove_edge(source, target)
        graph.remove_edge(target, source)
        return 'Edge removed successfully'
    except Exception as e:
        print(f"exec error: {e}")
        return 'Error removing edge', 500

@app.route('/api/tree', methods=['GET'])
def get_tree():
    return jsonify(tree.tree_to_json())

@app.route('/api/addNodeTree', methods=['POST'])
def insert_node_tree():
    data = request.json
    node_value = data.get("data")
    if node_value is None:
        return jsonify({"error": "Node value is required"}), 404
    tree.insert(node_value)
    return jsonify({"tree": tree.tree_to_json(), "newNodeId": tree.counter - 1}), 200


@app.route('/api/deleteNodeTree', methods=['POST'])
def mark_node_for_deletion():
    data = request.json
    node_value = data.get("data")
    if node_value is None:
        return jsonify({"error": "Node value is required"}), 400

    try:
        node_to_delete = tree.find_node(tree.root, node_value) 
        if node_to_delete:
            return jsonify({"deletedNodeId": node_to_delete.id, "node_value": node_value}), 200
        else:
            return jsonify({"error": "Node not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/removeNodeTree', methods=['POST'])
def remove_node_tree():
    data = request.json
    node_value = data.get("data")
    if node_value is None:
        return jsonify({"error": "Node value is required"}), 400

    try:
        deleted_node_id = tree.remove(node_value)  
        if deleted_node_id is None:
            return jsonify({"error": "Node not found"}), 404

        return jsonify({
            "tree": tree.tree_to_json(),  
            "deletedNodeId": deleted_node_id  
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/searchTree', methods=['GET'])
def search_node_tree():
    data = request.args.get("data")
    if data is None:
        return jsonify({"error": "Node value is required"}), 400

    try:
        data = int(data)
        search_result = tree.search(data)
        return jsonify(search_result), 200
    except ValueError:
        return jsonify({"error": "Invalid node value"}), 400


@app.route('/api/printTree', methods=['GET'])
def print_tree():
    try:
        tree_data = tree.print_tree()
        return jsonify(tree_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
    