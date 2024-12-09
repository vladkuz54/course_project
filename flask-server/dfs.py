
class Graph:
    
    def __init__(self, vertices):
        self.adj = [[] for _ in range(vertices)]
        self.dfs_result = []

    def add_edge(self, s, t):
        self.adj[s].append(t)
        self.adj[t].append(s)

    def remove_edge(self, s, t):
        if t in self.adj[s]:
            self.adj[s].remove(t)
        if s in self.adj[t]:
            self.adj[t].remove(s)

    def add_vertex(self, v):
        if v >= len(self.adj):
            for _ in range(len(self.adj), v + 1):
                self.adj.append([])


    def remove_vertex(self, v):
        for neighbors in self.adj:
            if v in neighbors:
                neighbors.remove(v)
        self.adj[v] = []


    def graph_to_dict(self):
        return [{"id": i, "edges": sorted(edges)} for i, edges in enumerate(self.adj) if edges or any(i in edge for edge in edges)]

    def dfs_rec(self, visited, s, source=None):
        visited[s] = True

        if source is not None:
            self.dfs_result.append({
                "id": len(self.dfs_result),
                "edge": [source, s],  
                "current": s  
            })
        else:
            self.dfs_result.append({
                "id": len(self.dfs_result),
                "edge": [s, None],  
                "current": s 
            })

        for neighbor in self.adj[s]:
            if not visited[neighbor]:
                self.dfs_rec(visited, neighbor, s)


    def dfs(self, start):
        visited = [False] * len(self.adj)
        self.dfs_result = []
        self.dfs_rec(visited, start, start)

    def dfs_to_dict(self, start):
        self.dfs(start)
        return self.dfs_result


edges = []
graph = None

def set_edges(new_edges):
    global edges, graph
    edges = new_edges
    vertices = set()
    for edge in edges:
        if edge[0] is not None and edge[1] is not None:
            vertices.update(edge)
    if vertices:
        V = max(vertices) + 1
        graph = Graph(V)
        for edge in edges:
            graph.add_edge(edge[0], edge[1])
        for v in range(V):
            if not any(v in edge for edge in edges):
                graph.remove_vertex(v)

def get_edges():
    return edges


initial_edges = [(1, 2), (2, 3)]
set_edges(initial_edges)

def main_graph():
    return graph.graph_to_dict()

def main_dfs(start_vertex):
    return graph.dfs_to_dict(start_vertex)

print(graph.adj)
