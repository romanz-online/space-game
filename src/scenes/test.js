import { Scene, Math as pMath } from 'phaser';
const { Vector2 } = pMath;
import Bullet from '../objects/bullet'

class TestScene extends Scene {
    constructor() {
        super({
            key: 'examples'
        })
    }

    lastFired = 0;

    preload() {
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });

        this.load.image('background', 'assets/tests/space/nebula.jpg');
        this.load.image('stars', 'assets/tests/space/stars.png');
        this.load.atlas('space', 'assets/tests/space/space.png', 'assets/tests/space/space.json');
    }

    create() {
        //  Prepare some spritesheets and animations
        this.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
        this.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });

        this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid1-anim', frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid2-anim', frames: this.anims.generateFrameNumbers('asteroid2-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid3-anim', frames: this.anims.generateFrameNumbers('asteroid3-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid4-anim', frames: this.anims.generateFrameNumbers('asteroid4-sheet', { start: 0, end: 23 }), frameRate: 20, repeat: -1 });

        //  World size is 8000 x 6000
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'background').setScrollFactor(0);

        //  Add our planets, etc
        this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
        const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
        this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
        this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

        // this.add.sprite(4300, 3000).play('asteroid1-anim');

        for (let i = 0; i < 8; i++) {
            this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
        }

        this.stars = this.add.tileSprite(400, 300, 800, 600, 'stars').setScrollFactor(0);

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);

        this.ship.setDrag(300);
        this.ship.body.setAllowGravity(false);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);

        this.cameras.main.startFollow(this.ship);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
            speed: 100,
            lifespan: {
                onEmit: (particle, key, t, value) => {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 2000;
                }
            },
            alpha: {
                onEmit: (particle, key, t, value) => {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300);
                }
            },
            angle: {
                onEmit: (particle, key, t, value) => {
                    return (this.ship.angle - 180) + Phaser.Math.Between(-10, 10);
                }
            },
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD'
        });
        emitter.startFollow(this.ship);

        // this.cursors = this.input.keyboard.createCursorKeys();
        // this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.tweens.add({
            targets: galaxy,
            angle: 360,
            duration: 100000,
            ease: 'Linear',
            loop: -1
        });

        // on-click movement
        this.target = new Vector2();
        this.input.on('pointerup', (pointer) => {
            const { worldX, worldY } = pointer;

            this.target.x = worldX;
            this.target.y = worldY;

            if (this.movementLine) {
                this.movementLine.destroy();
            }

            this.movementLine = this.add.graphics();
            this.movementLine.lineStyle(2, 0xff6600, 0.2);
            this.movementLine.lineBetween(this.ship.x, this.ship.y, this.target.x, this.target.y);
        });

        var dialog = this.rexUI.add.dialog({
            x: this.ship.x,
            y: this.ship.y,

            background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),

            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
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

            content: this.add.text(0, 0, 'Do you want to build a snow man?', {
                fontSize: '24px'
            }),

            actions: [
                createLabel(this, 'Yes'),
                createLabel(this, 'No')
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
            .setDepth(3);

        dialog
            .on('button.click', function (button, groupName, index) {
                dialog.destroy();
            }, this)
            .on('button.over', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            })
            .on('button.out', function (button, groupName, index) {
                button.getElement('background').setStrokeStyle();
            });
    }

    update(time, delta) {
        // const { left, right, up } = this.cursors;

        // on-click movement
        if (this.target.x && this.target.y) {
            this.movementLine.destroy();
            this.movementLine = this.add.graphics();
            this.movementLine.lineStyle(2, 0xff6600, 0.2);
            this.movementLine.lineBetween(this.ship.x, this.ship.y, this.target.x, this.target.y);

            const d = pMath.Distance.Between(this.ship.x, this.ship.y, this.target.x, this.target.y);
            const cursorAngle = Phaser.Math.Angle.Between(this.ship.x, this.ship.y, this.target.x, this.target.y);

            let deltaRotation = cursorAngle - this.ship.rotation;
            if (deltaRotation > Math.PI) {
                deltaRotation = 2 * Math.PI - deltaRotation;
                deltaRotation *= -1;
            }
            else if (deltaRotation < Math.PI * -1) {
                deltaRotation = 2 * Math.PI + deltaRotation;
            }

            if (d < 10) {
                this.ship.body.reset(this.target.x, this.target.y);
                this.ship.setAngularVelocity(0);
                this.ship.setAcceleration(0);
                this.target.x = null;
                this.target.y = null;
            }
            else {
                if (deltaRotation > 0.1 || deltaRotation < -0.1) {
                    this.physics.velocityFromRotation(this.ship.rotation, 50 * Math.abs(deltaRotation), this.ship.body.acceleration);
                    if (deltaRotation > 0) {
                        this.ship.setAngularVelocity(90);
                    }
                    else {
                        this.ship.setAngularVelocity(-90);
                    }
                }
                else {
                    this.ship.rotation = cursorAngle;
                    this.ship.setAngularVelocity(0);
                    this.ship.setAcceleration(0);
                    this.physics.moveToObject(this.ship, this.target, 150);
                }
            }
        }
        else {
            this.ship.setAngularVelocity(0);
            this.ship.setAcceleration(0);
            this.target.x = null;
            this.target.y = null;
        }

        // if (left.isDown) {
        //     this.ship.setAngularVelocity(-150);
        // }
        // else if (right.isDown) {
        //     this.ship.setAngularVelocity(150);
        // }
        // else {
        //     this.ship.setAngularVelocity(0);
        // }

        // if (up.isDown) {
        //     this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
        // }
        // else {
        //     this.ship.setAcceleration(0);
        // }

        // if (this.fire.isDown && time > this.lastFired) {
        //     const bullet = this.bullets.get();

        //     if (bullet) {
        //         bullet.fire(this.ship);

        //         this.lastFired = time + 100;
        //     }
        // }

        // this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        // this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        // this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        // this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }
}

var createLabel = function (scene, text) {
    return scene.rexUI.add.label({
        // width: 40,
        // height: 40,

        background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x5e92f3),

        text: scene.add.text(0, 0, text, {
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

export default TestScene;