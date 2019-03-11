const { Set, Stack } = require('immutable');
const Util = require('./util');

/**
 * 
 * @author Koen Loogman
 */
class DavisPutnam {
    /**
     * Clauses ist eine Menge von Klauseln und literals ist eine Menge
     * von Literalen.  Der Aufruf DavisPutnam(Clauses, Literals) versucht 
     * eine Lösung der Menge
     * 
     * Clauses
     * 
     * zu berechnen.  Wenn dies gelingt, wird eine Menge von Unit-Klauseln 
     * zurück gegeben, die keine komplementären Literale enthält.  Aus dieser 
     * Menge kann dann unmittelbar eine Belegung berechnet werden, die Clauses
     * löst.
     * 
     * Wenn die Menge Clauses unlösbar ist, wird { {} } zurück gegeben.
     * Das Argument Literals dient der Buchhaltung bei den rekursiven Aufrufen.
     * Hier werden alle die Literale aufgesammelt, mit denen die Menge clauses
     * schon reduziert wurde.  Beim ersten Aufruf ist diese Menge leer.
     * @param {Array<Array<String>>} clauses
     */
    constructor(clauses) {
        // Internal
        /**
         * @type {Stack<Set<Set<String>>>}
         */
        this._clausesStack = new Stack().asMutable();
        /**
         * @type {Set<Set<String>>}
         */
        this._clauses = new Set([new Set()]);
        /**
         * @type {Stack<Set<String>>}
         */
        this._literalsStack = new Stack().asMutable();
        /**
         * @type {Set<String>}
         */
        this._literals = new Set();
        /**
         * @type {Stack<Set<Set<String>>>}
         */
        this._usedStack = new Stack().asMutable();
        /**
         * @type {Set<Set<String>>}
         */
        this._used = new Set();
        /**
         * @type {Set<DavisPutnamConsumer>}
         */
        this._consumers = new Set().asMutable();

        // External
        /**
         * @type {Array<Array<String>>}
         */
        this.clauses = clauses;

        /**
         * @type {Boolean}
         */
        this.micro = false;
    }
    /**
     * Returns a set of all unit clauses of the current clauses
     * @returns {Set<Set<String>>}
     */
    get _units() {
        return this._clauses.filter(clause => clause.size == 1 && !this._used.has(clause));
    }

    /**
     * Adds a consumer
     * @param {DavisPutnamConsumer} consumer 
     */
    addConsumer(consumer) {
        this._consumers.add(consumer);
    }
    /**
     * Removes a consumer
     * @param {DavisPutnamConsumer} consumer 
     */
    removeConsumer(consumer) {
        this._consumers.remove(consumer);
    }

    /**
     * @param {Array<Array<String>>} clauses
     */
    set clauses(clauses) {
        this._clauses = new Set(clauses.map(clause => new Set(clause)));
    }
    /**
     * Returns an array of clauses of the current state. Those clauses are arrays of literals.
     * @returns {Array<Array<String>>}
     */
    get clauses() {
        return this._clauses.toJS();
    }
    /**
     * Returns the choosen literals of the current state.
     * @returns {Array<String>}
     */
    get literals() {
        return this._literals.toJS();
    }
    /**
     * Returns the unit clauses of the current state.
     * @returns {Array<Array<String>>}
     */
    get units() {
        return this._units.toJS();
    }
    /**
     * Returns the used literals of the current state.
     * @returns {Array<Array<String>>}
     */
    get used() {
        return this._used.toJS();
    }

    /**
     * Checks if the davis putnem algorithm has no more steps left to do.
     * @returns {Boolean} true if done.
     */
    done() {
        return this.solved() || (this._clauses.size == 1 && this._clauses.has(new Set())) ;
    }
    /**
     * Checks if the davis putnam algorithm has found an solution.
     * @returns {Boolean} true if solution found.
     */
    solved() {
        return this._clauses.filter(clause => clause.size != 1).isEmpty();
    }
    
    /**
     * Runs the davis putnam for the given amount of steps.
     * 
     * @param {Number} step if the step is a negative number it will run till it's solved
     */
    step(step = 1) {
        step = Math.round(step);
        while (!this.done() && step != 0) {
            /**
             * Diese Schleife berechnet alle Klauseln, die mit Unit Schnitten aus S ableitbar sind. 
             * Zusätzlich werden alle Klauseln, die von Unit-Klauseln subsumiert werden, aus der Menge S entfernt.
             */
            while (!this._units.isEmpty() && step != 0) {
                let unit = Util.randomElement(this._units);
                this._used = this._used.add(unit);
    
                let literal = Util.randomElement(unit);
                this.reduce(literal);
                if (this.micro) step--;
            }
            // check if solved
            if (this.solved()) {
                this._consumers.forEach(consumer => consumer.onSolved());
                return this;
            }
            if (step == 0) continue;

            // unsolvable
            if (this._clauses.has(new Set())) {
                if (this._clausesStack.isEmpty()) {
                    this._clauses = new Set([new Set()]);
                    this._consumers.forEach(consumer => consumer.onNotSolveable());
                    return this;
                }
                // pop from stack to do the next
                this._clauses = this._clausesStack.peek();
                this._clausesStack.pop();
                this._literals = this._literalsStack.peek();
                this._literalsStack.pop();
                this._used = this._usedStack.peek();
                this._usedStack.pop();

                this._consumers.forEach(consumer => consumer.onBacktrack());
                continue;
            }

            // choose a literal
            let literal = this.selectLiteral();
            let negLiteral = Util.negateLiteral(literal);

            // put the negated literal on stack for backtracking
            this._clausesStack.push(this._clauses.add(new Set([negLiteral])));
            this._literalsStack.push(this._literals.add(negLiteral));
            this._usedStack.push(this._used);

            // use the literal for the next
            this._clauses = this._clauses.add(new Set([literal]));
            this._literals = this._literals.add(literal);

            step--;
        }
        return this;
    }

    /**
     * Die Prozedur reduce(literal) führt alle Unit-Schnitte und alle Unit-Subsumptionen,
     * die mit der Unit-Klausel {literal} möglich sind, durch.
     * 
     * @param {String} literal
     * @returns {DavisPutnam}
     */
    reduce(literal) {
        let negLiteral = Util.negateLiteral(literal);

        /**
         * @type {{target: Set<Set<String>>, result: Set<Set<String>>}}
         */
        let unitCut = {
            'target': this._clauses.filter(clause => clause.has(negLiteral)),
            'result': null
        };
        unitCut.result = unitCut.target.map(clause => clause.remove(negLiteral));
        let subsume = this._clauses.filter(clause => clause.has(literal));
        let rest = this._clauses.filterNot(clause => clause.has(literal) || clause.has(negLiteral));

        let event = {
            'literal': literal,
            'negLiteral': negLiteral,
            'unitCut': {
                'target': unitCut.target.toJS(),
                'result': unitCut.result.toJS()
            },
            'subsume': {
                'target': subsume.toJS(),
                'result': []
            },
            'rest': rest.toJS()
        };

        this._clauses = unitCut.result.union(rest).add(new Set([literal]));
        this._consumers.forEach(consumer => consumer.onReduce(event));
        return this;
    }

    /**
     * Wir wählen ein beliebiges Literal aus einer beliebigen Klausel,
     * so dass weder dieses Literal noch die Negation benutzt wurden.
     * @returns {String}
     */
    selectLiteral() {
        /**
         * @type {Set<String>}
         */
        let literals = this._clauses.flatten().filter(literal => !this._literals.has(literal));
        let posLiterals = literals.filter(literal => literal.substr(0, 1) != '!');

        // Prefer positive literals
        if (posLiterals.size > 0) {
            return Util.randomElement(posLiterals);
        } else {
            return Util.randomElement(literals);
        }
    }
}
/**
 * 
 * @author Koen Loogman
 */
class DavisPutnamConsumer {
    constructor() {
        if (this.constructor == DavisPutnamConsumer) {
            throw new Error(`Abstract classes can't be instantiated.`);
        }
    }

    /**
     * This function is called when the DavisPutnam algorythm uses the function reduce.
     * The event contains the used literal, the negated literal and the targets of the unit cut and subsume operations with their results.
     * Unaffected clauses are in rest.
     * @param {{literal: String, negLiteral: String, unitCut: {target: Array<String>, result: Array<String>}, subsume: {target: Array<String>, result: Array<String>}, rest: Array<String>}} event 
     */
    onReduce(event) {
        console.log(`reduced with '` + event.literal + `'`);
    }

    onBacktrack() {
        console.log(`backtracked`);
    }

    onSolved() {
        console.log(`solved`);
    }

    onNotSolveable() {
        console.log(`not solveable`);
    }
}

module.exports = { DavisPutnam, DavisPutnamConsumer };