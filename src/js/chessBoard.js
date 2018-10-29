'use strict';

const Two = require('two.js');

class ChessBoard {

    constructor(two, n = 8, size = 500) {
        this.two = two;

        // parameters
        this._noStroke = false;
        this._whiteFill = "#fff";
        this._blackFill = "#000";

        // chess board
        this.board = new Two.RoundedRectangle(0, 0, 0, 0, 0);
        this.group = new Two.Group(this.board);
        this.tiles = [];
        this.size = size;
        this.n = n;

        two.add(this.group);
    }

    get n() {
        return this._n;
    }

    set n(n) {
        this._n = n;
        this.group.remove(this.tiles);
        this.group.add(this.board);
        this.tiles = [];

        // create tiles
        for (var i = 0; i < n * n; i++) {
            let x = i % n;
            let y = Math.floor(i / n);

            let tile = new Two.RoundedRectangle(0, 0, 0, 0);
            this.tiles.push(tile);
            this.group.add(tile);
            
            // TODO replace colors
            tile.fill = x % 2 == y % 2 ? this._whiteFill : this._blackFill;
        }
        // resize tiles to fit the board
        this.size = this.size;
    }

    get size() {
        return this._size;
    }

    set size(size) {
        this._size = size;

        // rearrange group and board
        this.board.width = size;
        this.board.height = size;
        this.board.radius = size * 0.0125;

        // define sizes
        let innerSize = size * (1 - 0.035 * 8 / this.n);
        let margin = size * 0.01 * (this.n > 1 ? 8 / this.n : 0);
        let tileSize = (innerSize - (this.n - 1) * margin) / this.n;

        // resize tiles
        this.tiles.forEach((tile, i) => {
            let x = i % this.n;
            let y = Math.floor(i / this.n);

            tile.height = tileSize;
            tile.width = tileSize;
            tile.radius = tileSize * 0.05;
            tile.translation.set(
                x * (tileSize + margin) + tileSize / 2 - innerSize / 2,
                y * (tileSize + margin) + tileSize / 2 - innerSize / 2
            );
        });
        if (this._noStroke) {
            this.noStroke();
        }
    }

    whiteTiles() {
        return this.tiles.filter((tile, i) => (i % this.n) % 2 == Math.floor(i / this.n) % 2);
    }
    
    blackTiles() {
        return this.tiles.filter((tile, i) => (i % this.n) % 2 != Math.floor(i / this.n) % 2);
    }

    get whiteFill() {
        return this._whiteFill;
    }

    set whiteFill(color) {
        this._whiteFill = color;
        this.whiteTiles().forEach((tile) => tile.fill = color);
    }

    get blackFill() {
        return this._blackFill;
    }

    set blackFill(color) {
        this._blackFill = color;
        this.blackTiles().forEach((tile) => tile.fill = color);
    }

    noStroke() {
        this._noStroke = true;
        this.group.noStroke();
    }
}

module.exports = ChessBoard;