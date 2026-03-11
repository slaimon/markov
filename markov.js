export {NgramTable, Generator};

import { MultiMap } from "./multimap.js";

function tokenize(corpus) {
    return corpus
        .replace(/[\"\“\”\[\(\)\]_]/g, '')
        .replace(/‘’/g, '\'')
        .replace(/[\n\t\r—]+/g, ' ')
        .replace(/(?<!['.])\b(?!I)[A-Z]\.\s+/g, ' ') // remove initials
        .split(' ')
        .map((token) => // quick and dirty way to get rid of words in ALL CAPS
            (token.length > 1) && (token === token.toUpperCase()) ?
            token.toLowerCase() : token)
        .filter((token) => token.length > 0);
}

// returns a uniformly random index in a list of length max
function rand_index(max) {
    return Math.round(Math.random() * (max - 1));
}

// returns a random element of the list with uniform probability
function rand_elem(lst) {
    return lst[rand_index(lst.length)];
}

/**
 * Weighted random choice between the elements of `items`.
 * 
 * Each item's likelyhood of being chosen is proportional to the corresponding value in the
 * `weights` array.
 * 
 * The weights should be nonnegative numbers, but they don't need to sum to a particular value, and
 * there can be non-integer weights.
 * 
 * https://stackoverflow.com/questions/43566019
 *
 */
function weighted_random(items, weights) {
    var i;

    for (i = 1; i < weights.length; i++)
        weights[i] += weights[i - 1];
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return items[i];
}

/**
 * Returns true iff the word's first char is uppercase.
 */
function isCapitalised(word) {
    let firstChar = word.charAt(0);
    return (firstChar !== firstChar.toLowerCase() &&
            firstChar === firstChar.toUpperCase());
}

/**
 * An associative array that maps each n-gram to its weighted set of possible continuations
 */
class NgramTable {
    constructor(n = 2) {
        this.n = n;
        this.map = new MultiMap(n+1, ()=>0);
    }

    /**
     * Returns the set of available starting tokens, that is, all the tokens that start with a
     * capital letter.
     */
    initials() {
        return this.map
            .getKeys()
            .filter(
                (token) => isCapitalised(token)
            ).filter( // exclude tokens that only appear in one or two different sentences
                (token) => this.map.getKeys(token).length > 2
            );
    }

    /**
     * Returns the set of possible continuations for a sequence of `k` tokens, `k < n`.
     */
    options(...sequence) {
        if (sequence.length >= this.n) {
            throw Error(`Expected less than ${this.n} arguments.`);
        }
        return this.map.getKeys(...sequence);
    }

    /** 
     * Register a new occurrence of the given token sequence.
     *
     * The sequence must be n+1 tokens long: it represents one n-gram plus one continuation token.
     *
     * E.g.:
     *
     * ```
     * let t = new NgramTable(3);
     * t.register("The", "quick", "brown", "fox");
     * ```
     * 
     * Here, ["The", "quick", "brown"] is a trigram and "fox" is the continuation token.
     */
    register(...sequence) {
        if (sequence.length !== this.n + 1) {
            throw Error(`Expected ${this.n + 1} arguments.`);
        }
        let current_count = this.map.get(...sequence);
        this.map.set(current_count + 1, ...sequence);
    }

    /**
     * Returns a random continuation token for the given n-gram, according to learned
     * probabilities. If the given n-gram was not encountered in the training set, the method
     * returns `undefined`.
     * 
     * Requires n arguments.
     */
    predict(...ngram) {
        if (ngram.length !== this.n) {
            throw Error(`Expected ${this.n} arguments.`);
        }
        let options = this.map.getKeys(...ngram);
        if (options.length === 0) {
            console.log(`no options found for \"${ngram}\"`);
        }
        let weights = options.map((token) => this.map.get(...ngram, token));

        return weighted_random(options, weights);
    }
}

class Generator {
    constructor(n = 2) {
        this.n = n;
        this.table = null;
        this.trained = false;
    }

    isTrained() {
        return this.trained;
    }

    train(corpus) {
        if (!this.trained) {
            this.trained = true;
            this.table = new NgramTable(this.n);
        }

        // pad the beginning and end of the corpus with n empty tokens
        let window = Array(this.n).fill('');
        corpus = tokenize(corpus).concat(window);

        for (let word of corpus) {
            this.table.register(...window, word);
            window.shift();
            window.push(word);
        }
    }

    /**
     * Generate a random n-gram to kickstart the main generator
     */
    _random_ngram() {
        let ngram = [ rand_elem(this.table.initials()) ];

        for (let i = 1; i < this.n; i++) {
            ngram[i] = rand_elem(this.table.options(...ngram));
            if (ngram[i] === undefined) {
                // TODO: this can happen if all training data is lowercase!
                throw Error("Critical error: no starting data could be generated");
            }
        }

        return ngram;
    }

    _checkTrained() {
        if (!this.trained) {
            throw Error("Please train the generator first.");
        }
    }

    _next(output) {
        const ngram = output.slice(output.length-this.n, output.length);
        const next = this.table.predict(...ngram);
        if (next === undefined) {
            throw Error(`No prediction found for n-gram [${ngram}]`);
        }
        return next;
    }

    _sentence(max_tokens = 150) {
        this._checkTrained();

        let output = this._random_ngram();
        do {
            const last_token = output[output.length - 1];
            const last_char = last_token.charAt(last_token.length - 1);
            
            if (last_char === '.' ||
                last_char === '?' ||
                last_char === '!') {
                    break;
            }

            output.push(this._next(output));
        } while (output.length < max_tokens);

        return output;
    }

    sentences(n=1, max_tokens=50) {
        let result = [];
        for (let i = 0; i < n; i++) {
            let next = this._sentence();
            while (next.length > max_tokens) {
                next = this._sentence();
            }
            result.push(next.join(' '));
        }

        return result.join(' ');
    }

    generate(num_tokens) {
        this._checkTrained();

        let output = this._random_ngram();
        for (let i = output.length; i < num_tokens; i++) {
            output.push(this._next(output));
        }

        return output.join(' ');
    }
}