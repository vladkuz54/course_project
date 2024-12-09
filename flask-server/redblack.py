
class Node:

    def __init__(self, id, data, color, parent=None):
        self.id = id
        self.data = data
        self.color = color
        self.parent = parent
        self.left = None
        self.right = None

class RedBlackTree:
    
    def __init__(self):
        self.NIL = Node(id=0, data=None, color="BLACK")
        self.root = self.NIL
        self.counter = 1

    def insert(self, data):
        new_node = Node(id=self.counter, data=data, color="RED", parent=None)
        self.counter += 1
        new_node.left = self.NIL
        new_node.right = self.NIL

        if self.root == self.NIL:
            new_node.color = "BLACK"
            self.root = new_node
        else:
            self.insert_node(self.root, new_node)

        self.fix_insert(new_node)
        return new_node.id

    def insert_node(self, current, new_node):
        if new_node.data < current.data:
            if current.left == self.NIL:
                current.left = new_node
                new_node.parent = current
            else:
                self.insert_node(current.left, new_node)
        else:
            if current.right == self.NIL:
                current.right = new_node
                new_node.parent = current
            else:
                self.insert_node(current.right, new_node)

    def fix_insert(self, node):
        while node != self.root and node.parent.color == "RED":
            if node.parent == node.parent.parent.left:
                uncle = node.parent.parent.right
                if uncle.color == "RED":
                    node.parent.color = "BLACK"
                    uncle.color = "BLACK"
                    node.parent.parent.color = "RED"
                    node = node.parent.parent
                else:
                    if node == node.parent.right:
                        node = node.parent
                        self.rotate_left(node)
                    node.parent.color = "BLACK"
                    node.parent.parent.color = "RED"
                    self.rotate_right(node.parent.parent)
            else:
                uncle = node.parent.parent.left
                if uncle.color == "RED":
                    node.parent.color = "BLACK"
                    uncle.color = "BLACK"
                    node.parent.parent.color = "RED"
                    node = node.parent.parent
                else:
                    if node == node.parent.left:
                        node = node.parent
                        self.rotate_right(node)
                    node.parent.color = "BLACK"
                    node.parent.parent.color = "RED"
                    self.rotate_left(node.parent.parent)
        self.root.color = "BLACK"

    def remove(self, data):
        node_to_remove = self.find_node(self.root, data)
        if node_to_remove is None or node_to_remove == self.NIL:
            return None

        self.delete_node(node_to_remove)
        return node_to_remove.id
    

    def minimum(self, node):
        while node.left != self.NIL:
            node = node.left
        return node

    def delete_node(self, node):
        y = node
        y_original_color = y.color
        if node.left == self.NIL:
            x = node.right
            self.transplant(node, node.right)
        elif node.right == self.NIL:
            x = node.left
            self.transplant(node, node.left)
        else:
            y = self.minimum(node.right)
            y_original_color = y.color
            x = y.right
            if y.parent == node:
                x.parent = y
            else:
                self.transplant(y, y.right)
                y.right = node.right
                y.right.parent = y
            self.transplant(node, y)
            y.left = node.left
            y.left.parent = y
            y.color = node.color
        if y_original_color == "BLACK":
            self.fix_delete(x)

    def fix_delete(self, x):
        while x != self.root and x.color == "BLACK":
            if x == x.parent.left:
                sibling = x.parent.right
                if sibling.color == "RED":
                    sibling.color = "BLACK"
                    x.parent.color = "RED"
                    self.rotate_left(x.parent)
                    sibling = x.parent.right
                if sibling.left.color == "BLACK" and sibling.right.color == "BLACK":
                    sibling.color = "RED"
                    x = x.parent
                else:
                    if sibling.right.color == "BLACK":
                        sibling.left.color = "BLACK"
                        sibling.color = "RED"
                        self.rotate_right(sibling)
                        sibling = x.parent.right
                    sibling.color = x.parent.color
                    x.parent.color = "BLACK"
                    sibling.right.color = "BLACK"
                    self.rotate_left(x.parent)
                    x = self.root
            else:
                sibling = x.parent.left
                if sibling.color == "RED":
                    sibling.color = "BLACK"
                    x.parent.color = "RED"
                    self.rotate_right(x.parent)
                    sibling = x.parent.left
                if sibling.right.color == "BLACK" and sibling.left.color == "BLACK":
                    sibling.color = "RED"
                    x = x.parent
                else:
                    if sibling.left.color == "BLACK":
                        sibling.right.color = "BLACK"
                        sibling.color = "RED"
                        self.rotate_left(sibling)
                        sibling = x.parent.left
                    sibling.color = x.parent.color
                    x.parent.color = "BLACK"
                    sibling.left.color = "BLACK"
                    self.rotate_right(x.parent)
                    x = self.root
        x.color = "BLACK"

    def find_node(self, node, data):
        if node is None or node == self.NIL:
            return None
        if data < node.data:
            return self.find_node(node.left, data)
        elif data > node.data:
            return self.find_node(node.right, data)
        else:
            return node
        
        
        
    def rotate_left(self, x):
        y = x.right
        x.right = y.left
        if y.left != self.NIL:
            y.left.parent = x

        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def rotate_right(self, x):
        y = x.left
        x.left = y.right
        if y.right != self.NIL:
            y.right.parent = x

        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def transplant(self, u, v):
        if u.parent is None:
            self.root = v
        elif u == u.parent.left:
            u.parent.left = v
        else:
            u.parent.right = v
        v.parent = u.parent

    
    def search(self, data):
        result = []
        current = self.root

        while current != self.NIL:
            result.append({"id": current.id, "data": current.data})
            if data == current.data:
                return result 
            elif data < current.data:
                current = current.left
            else:
                current = current.right


        result.append({"id": 0, "data": "None"})
        return result


    def print_tree(self):
        result = []

        def traverse(node):
            if node == self.NIL:
                return
            traverse(node.left)
            result.append({"id": node.id, "data": node.data, "color": node.color})
            traverse(node.right)

        traverse(self.root)
        return result

    def tree_to_json(self):
        def traverse(node, parent_id=None):
            if node is None or node == self.NIL:
                return []
            return (
                traverse(node.left, node.id)
                + [{
                    "id": node.id,
                    "data": node.data,
                    "color": node.color,
                    "left": None if node.left == self.NIL else node.left.id,
                    "right": None if node.right == self.NIL else node.right.id,
                    "parent": parent_id,
                }]
                + traverse(node.right, node.id)
            )

        return traverse(self.root)


tree = RedBlackTree()
