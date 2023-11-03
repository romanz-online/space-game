import { Scene } from 'phaser';
import dialogueTree from '../util/exampleDialogueTree';

class OverlayScene extends Scene {
    constructor() {
        super({
            key: 'OverlayScene',
            active: true
        })
    }

    hp = 100;
    stats = '$!$%@';

    preload() {
        // TODO: make this work :( the URL is wrong(?) but I don't know why
        // this.load.scenePlugin('rexuiplugin', 'plugins/rexuiplugin.min.js', 'rexuiplugin', 'rexUI');
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
    }

    create() {
        this.hp = this.add.text(this.cameras.main.worldView.left + 16, this.cameras.main.worldView.top + 16, `Hull Integrity: ${this.hp}`, { fontSize: '24px', fill: '#FFF' })
            .setScrollFactor(0);

        this.stats = this.add.text(this.cameras.main.worldView.left + 16, this.cameras.main.worldView.top + 48, `Other stats: ${this.stats}`, { fontSize: '24px', fill: '#FFF' })
            .setScrollFactor(0);
    }

    update(time, delta) {
    }

    createDialogueTree(text) {
        const node = dialogueTree[text];
        if(!node) {
            return;
        }

        const height = 100;
        let dialog = this.rexUI.add.dialog({
            x: this.cameras.main.worldView.centerX,
            y: this.cameras.main.worldView.bottom - height,

            background: this.rexUI.add.roundRectangle(0, 0, height, 100, 2, 0x00264d),

            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, height, 40, 2, 0x001a33),
                text: this.add.text(0, 0, 'Example Dialogue Tree', {
                    fontSize: '24px'
                }),
                space: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }),

            content: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, height, 40, 2, 0x001a33),
                text: this.add.text(0, 0, node.text, {
                    fontSize: '24px'
                }),
                space: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }),

            actions: node.options.length > 0 ? node.options.map(option => this.createAction(option.text)) : [],

            space: {
                title: 10,
                content: 25,
                action: 10,

                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: 'right', // 'center'|'left'|'right'
            },

            expand: {
                content: false, // Content is a pure text object
            }
        })
            .layout()
            .setDepth(3)
            .setScrollFactor(0);

        dialog
            .on('button.click', function (button, groupName, index) {
                this.input.stopPropagation();
                dialog.destroy();
                this.createDialogueTree(node.options[index].next);
            }, this)
            .on('button.over', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            })
            .on('button.out', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle();
            });
    }

    createPopup(text) {
        const height = 100;
        let dialog = this.rexUI.add.dialog({
            x: this.cameras.main.worldView.centerX,
            y: this.cameras.main.worldView.bottom - height,

            background: this.rexUI.add.roundRectangle(0, 0, height, 100, 2, 0x1565c0),

            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, height, 40, 2, 0x003c8f),
                text: this.add.text(0, 0, 'Title', {
                    fontSize: '24px'
                }),
                space: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }),

            content: this.add.text(0, 0, text, {
                fontSize: '24px'
            }),

            actions: [
                this.createAction('Yes'),
                this.createAction('No')
            ],

            space: {
                title: 25,
                content: 25,
                action: 15,

                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: 'right', // 'center'|'left'|'right'
            },

            expand: {
                content: false, // Content is a pure text object
            }
        })
            .layout()
            // .drawBounds(this.add.graphics(), 0xff0000)
            // .popUp(1000)
            .setDepth(3)
            .setScrollFactor(0); // locked to camera

        dialog
            .on('button.click', function (button, groupName, index) {
                this.input.stopPropagation();
                dialog.destroy();
            }, this)
            .on('button.over', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            })
            .on('button.out', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle();
            });
    }

    createAction(text) {
        return this.rexUI.add.label({
            // width: 40,
            // height: 40,

            background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 2, 0x004f99),

            text: this.add.text(0, 0, text, {
                fontSize: '24px'
            }),

            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        });
    }
}

export default OverlayScene;