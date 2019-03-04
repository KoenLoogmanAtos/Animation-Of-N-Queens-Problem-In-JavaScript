const { Set, Range } = require('immutable');

/**
 * @param {String} literal
 */
function negateLiteral(literal) {
    return ("!" + literal).replace(/^!!/, '');
}

/**
 * @param {Set<String>} set
 */
function atMostOne(set) {
    var negatedSet = set.map(l => negateLiteral(l));
    var result = new Set();
    negatedSet.forEach(a => {
        result = result.union(negatedSet.filter(b => a != b).map(b => new Set([a, b])));
    });
    return result;
}

/**
 * @param {Number} row
 * @param {Number} n
 */
function atMostOneInRow(row, n) {
    var set = Range(1, n + 1).map(column => row + "," + column);
    return atMostOne(set);
}

/**
 * @param {Number} column
 * @param {Number} n
 */
function oneInColumn(column, n) {
    var set = Range(1, n + 1).map(row => row + "," + column);
    return new Set([set]);
}

/**
 * @param {Number} k
 * @param {Number} n
 */
function atMostOneInUpperDiagonal(k, n) {
    var result = new Set();
    Range(1, n + 1).forEach(a => {
        result = result.union(Range(1, n).filter(b => a + b == k).map(b => a + "," + b));
    });
    return atMostOne(result);
}

/**
 * @param {Number} k
 * @param {Number} n
 */
function atMostOneInLowerDiagonal(k, n) {
    var result = new Set();
    Range(1, n + 1).forEach(a => {
        result = result.union(Range(1, n).filter(b => a - b == k).map(b => a + "," + b));
    });
    return atMostOne(result);
}

/**
 * @param {Number} n
 */
const QueensClauses = (n) => {
    var clauses = new Set();
    Range(1, n + 1).forEach(a => {
        clauses = clauses.union(atMostOneInRow(a, n));
        clauses = clauses.union(oneInColumn(a, n));
    });
    Range(-(n - 2), n - 2 + 1).forEach(k => {
        clauses = clauses.union(atMostOneInLowerDiagonal(k, n));
    });
    Range(3, 2 * n - 1 + 1).forEach(k => {
        clauses = clauses.union(atMostOneInUpperDiagonal(k, n));
    });
    return clauses.toJS();
}

module.exports = QueensClauses;