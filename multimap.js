export {MultiMap};

/**
 * A MultiMap is a tree-like structure of fixed depth N. Each node of depth D is an associative map
 * where the values are nodes of depth D+1; nodes of depth N (the leaves) contain the actual data.
 * One way to view this structure, then, is an associative map where the key is actually a sequence
 * of N keys: `x.get(k_1,...k_n) === value`.
 *
 * In the following, given a key `K = k_1,...k_i` with `i<=n`, the notation `x[K]` will represent
 * the node found after following the path `k_1,...k_n` from the root node. If `i==n`, we will say
 * that `K` is a complete key. Note that in that case, `x[K]` is a leaf node, which contains actual
 * data.
 */
class MultiMap {
    constructor(depth, defaultHandler = () => undefined) {
        if (depth < 1)
            throw new Error("Depth must be >= 1.");
        this.depth = depth;
        this.root = new Map();
        this.defaultHandler = defaultHandler;
    }

    /**
     * Given a key `K = k_1,...k_i` with `i<n`, returns the node `x[K]`.
     * If `create == true`, the missing elements along the path are created.
     * Do NOT use for data access, only for access to internal nodes.
     *
     * @param keys a list of key elements
     * @param create specifies whether the missing elements need to be created 
     * @returns the requested node
     */
    _getNode(keys, create=false) {
        let node = this.root;

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];

            if (!node.has(k)) {
                if (!create)
                    return undefined;
                const next = new Map();
                node.set(k, next);
                node = next;
            } else {
                node = node.get(k);
            }
        }

        return node;
    }

    /**
     * Returns the parent of node `x[K]`. Used mainly to get the parent of a leaf node.
     */
    _getParent(keys, create=false) {
        keys = keys.slice(0,-1);
        return this._getNode(keys, create);
    }

    /**
     * Checks whether the given key is a complete key, that is, whether it is sufficiently long to
     * access an element.
     */
    _checkCompleteKey(keys) {
        if (keys.length !== this.depth) {
            throw new Error(`Expected ${this.depth} keys`);
        }
    }

    /**
     * Given a key `k_1,...k_i` with `i<n`, returns the set of `k` such that `x[k_1,...k_i, k]` is
     * defined.
     */
    getKeys(...keys) {
        if (keys.length >= this.depth) {
            throw new Error(`Expected less than ${this.depth} keys`);
        }
        let node;
        if (keys.length === 1 && keys[0] === undefined) {
            node = this._getNode([]);
        } else {
            node = this._getNode(keys);
        }
        if (!node)
            return [];
        return [...node.keys()];
    }

    /**
     * Given a complete key `K`, returns the element contained at the leaf node `x[K]`.
     * If the node is uninitialised, the result of `defaultHandler` is returned.
     */
    get(...keys) {
        this._checkCompleteKey(keys);
        const node = this._getParent(keys);
        if (!node)
            return this.defaultHandler();

        const last = keys[keys.length - 1];
        if (!node.has(last))
            return this.defaultHandler();
        
        return node.get(last);
    }

    /**
     * Given a value `v` and a complete key `K`, sets the content of the leaf node `x[K]` to `v`.
     */
    set(value, ...keys) {
        this._checkCompleteKey(keys);
        const node = this._getParent(keys, true);
        node.set(keys[keys.length - 1], value);
    }

    /**
     * Given a complete key `K`, returns true iff `x[K]` is defined and its content has been set.
     */
    has(...keys) {
        this._checkCompleteKey(keys);
        const node = this._getParent(keys);
        return node ? node.has(keys[keys.length - 1]) : false;
    }
}