'use strict';
const { Set } = require('immutable');
const Two = require('two.js');

/**
 * TODO: Implement two.js and make a real chessboard
 */
class ChessBoard {
    /**
     * @param {Two} two 
     * @param {Number} n 
     */
    constructor(two, size, n = 8) {
        /**
         * @type {Set<String>}
         */
        this.literals = new Set();
        /**
         * @type {Array<Array<T>>}
         */
        this.state = [[]];
        this.queens = [];
        this.crosses = [];
        this.tiles = [];

        // create board and groups
        this.size = size;
        this.board = two.makeRectangle(size / 2, size / 2, size, size);
        this.board.fill = '#4F2649';
        this.board.noStroke();
        this.tilesGroup = two.makeGroup();
        this.pawns = two.makeGroup();

        this.n = n;
    }

    get n() {
        return this.state.length;
    }
    set n(n) {
        this.literals = new Set();
        
        // values for the board
        let padding = this.size * 0.2 / n;
        let slotSize = (this.size - padding) / n;
        let tileSize = slotSize - padding / n;

        // remove old tiles and pawns from the scene
        this.tilesGroup.remove(this.tiles);
        this.pawns.remove(this.queens);
        this.pawns.remove(this.crosses)

        // initialize reference arrays
        this.state = Array(n).fill(0).map(_ => Array(n).fill(' '));
        this.tiles = Array(n * n).fill(null);
        this.queens = Array(n * n).fill(null);
        this.crosses = Array(n * n).fill(null);

        // set start vector
        this.tilesGroup.translation = new Two.Vector((slotSize + padding) / 2, (slotSize + padding) / 2);
        this.pawns.translation = this.tilesGroup.translation;

        // init all tiles and pawns
        for (let i = 0; i < n * n; i++) {
            let x = i % n;
            let y = Math.floor(i / n);

            // create tile
            let tile = new Two.Rectangle(x * slotSize , y * slotSize, tileSize, tileSize);
            tile.fill = y % 2 == x % 2 ? '#FCFCFC' : '#080816';
            this.tiles[i] = tile;

            // create queen
            let queen = new Two.Group();
            queen.add(new Two.Circle(0 , 0, tileSize / 2 * 0.9));
            queen.translation = new Two.Vector(x * slotSize, y * slotSize);
            queen.fill = '#88D317';
            queen.noStroke();
            this.queens[i] = queen;

            // create cross
            let point = tileSize * 0.75 / 2;
            let cross = new Two.Group();
            cross.add(new Two.Line(-point, -point, point, point));
            cross.add(new Two.Line(-point, point, point, -point));
            cross.translation = new Two.Vector(x * slotSize, y * slotSize);
            cross.linewidth = tileSize * 0.1;
            cross.opacity = 0.75;
            //cross.stroke = y % 2 != x % 2 ? '#FCFCFC' : '#080816';
            cross.stroke = '#F00';
            this.crosses[i] = cross;
        }

        this.tilesGroup.add(this.tiles);
        this.tilesGroup.noStroke();
    }

    clear() {
        this.literals = new Set();
        this.state.forEach((row, y) => row.forEach((_, x) => this.setClear(x, y)));
    }

    /**
     * @param {Array<String>} state 
     */
    setState(state) {
        /**
         * @type {Set<String>}
         */
        let _literals = new Set(state);
        // get new literals
        let literals = _literals.subtract(this.literals);
        // get removed literals
        let rem = this.literals.subtract(_literals).map(literal => (literal.substr(0, 1) == '!' ? literal.substr(1) : literal).split(',').map(n => Number(n) - 1));
        let pos = literals.filter(literal => literal.substr(0, 1) != '!').map(literal => literal.split(',').map(n => Number(n) - 1));
        let neg = literals.filter(literal => literal.substr(0, 1) == '!').map(literal => literal.substr(1).split(',').map(n => Number(n) - 1));
        this.literals = _literals;

        rem.forEach(([x, y]) => this.setClear(x, y));
        pos.forEach(([x, y]) => this.setQueen(x, y));
        neg.forEach(([x, y]) => this.setCross(x, y));
    }

    setClear(x, y) {
        this.state[y][x] = ' ';
        this.pawns.remove(this.queens[x + y * this.n]);
        this.pawns.remove(this.crosses[x + y * this.n]);
    }

    setQueen(x, y) {
        this.state[y][x] = 'Q';
        this.pawns.add(this.queens[x + y * this.n]);
    }

    setCross(x, y) {
        this.state[y][x] = '.';
        this.pawns.add(this.crosses[x + y * this.n]);
    }

    /**
     * @returns {String}
     */
    toString() {
        let border = '+' + '---+'.repeat(this.n) + '\n';
        return border + this.state.map(row => '| ' + row.join(' | ') + ' |\n').join(border) + border;
    }
}

module.exports = ChessBoard;