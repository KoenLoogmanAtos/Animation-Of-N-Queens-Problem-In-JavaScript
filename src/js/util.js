const { Set } = require('immutable');

/**
 * The Util object helps handling simple operations with sets and clauses
 * 
 * @author Koen Loogman
 */
const Util = {
    /**
     * @param {Set<String>} set
     * @returns {Set<Set<String>>}
     */
    atMostOne(set) {
        let negatedSet = set.map(literal => Util.negateLiteral(literal));
        let result = new Set();
        negatedSet.forEach(a => {
            result = result.union(negatedSet.filter(b => a != b).map(b => new Set([a, b])));
        });
        return result;
    },
    /**
     * Negates the literal
     * @param {String} literal
     */
    negateLiteral(literal) {
        return ('!' + literal).replace(/^!!/, '');
    },

    setToString(set) {
        return '<span class="set">{ ' + set.join(', ') + ' }</span>';
    },

    clauseToString(set) {
        return this.setToString(set.map(literal => '<span class="literal">\'' + literal + '\'</span>'));
    },
    
    clausesToString(clauses) {
        return this.setToString(clauses.map(clause => literalsToString(clause)));
    }
}

module.exports = Util;