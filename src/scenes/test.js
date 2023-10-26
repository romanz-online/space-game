import { Scene, Math as pMath } from 'phaser';
const { Vector2 } = pMath;
import Bullet from '../objects/bullet'
import OverlayScene from './overlay';

class TestScene extends Scene {
    constructor() {
        super({
            key: 'TestScene',
            active: true
        })
    }

    lastFired = 0;
    distanceToMove = null;
    movementEnabled = true;
    openDialog = false;

    preload() {
        this.load.image('background', 'assets/tests/space/nebula.jpg');
        this.load.image('stars', 'assets/tests/space/stars.png');
        this.load.atlas('space', 'assets/tests/space/space.png', 'assets/tests/space/space.json');

        this.load.image('small_freighter', 'assets/small_freighter.png');
    }

    create() {
        loadTextures(this);

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

        // this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);
        this.ship = this.physics.add.image(4000, 3000, 'small_freighter').setDepth(2);
        this.ship.setDrag(300);
        this.ship.body.setAllowGravity(false);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);
        this.cameras.main.startFollow(this.ship);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
            speed: 100,
            lifespan: {
                onEmit: (particle, key, t, value) => { return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 2000; }
            },
            alpha: {
                onEmit: (particle, key, t, value) => { return Phaser.Math.Percent(this.ship.body.speed, 0, 300); }
            },
            angle: {
                onEmit: (particle, key, t, value) => { return (this.ship.angle - 180) + Phaser.Math.Between(-10, 10); }
            },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD'
        });
        emitter.startFollow(this.ship);

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
            if (!this.movementEnabled) {
                return;
            }

            const { worldX, worldY } = pointer;

            this.target.x = worldX;
            this.target.y = worldY;

            if (this.movementLine) {
                this.movementLine.destroy();
            }

            this.movementLine = this.add.graphics();
            this.movementLine.lineStyle(2, 0xff6600, 0.2);
            this.movementLine.lineBetween(this.ship.x, this.ship.y, this.target.x, this.target.y);

            this.ship.body.reset(this.ship.x, this.ship.y);
            this.ship.setAngularVelocity(0);
            this.ship.setAcceleration(0);

            this.distanceToMove = pMath.Distance.Between(this.ship.x, this.ship.y, this.target.x, this.target.y);
            const cursorAngle = Phaser.Math.Angle.Between(this.ship.x, this.ship.y, this.target.x, this.target.y);

            let deltaRotation = cursorAngle - this.ship.rotation;
            if (deltaRotation > Math.PI) {
                deltaRotation = 2 * Math.PI - deltaRotation;
                deltaRotation *= -1;
            }
            else if (deltaRotation < Math.PI * -1) {
                deltaRotation = 2 * Math.PI + deltaRotation;
            }

            this.tweens.add({
                targets: this.ship,
                rotation: this.ship.rotation + deltaRotation,
                duration: 500 * Math.abs(deltaRotation),
                ease: 'Sine.easeInOut'
            });
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if(!this.openDialog) {
                this.openDialog = true;
                this.scene.get('OverlayScene').createPopup();
            }
        });
    }

    update(time, delta) {
        // on-click movement
        if (this.target.x && this.target.y) {
            this.movementLine.destroy();
            this.movementLine = this.add.graphics();
            this.movementLine.lineStyle(2, 0xff6600, 0.2);
            this.movementLine.lineBetween(this.ship.x, this.ship.y, this.target.x, this.target.y);

            const d = pMath.Distance.Between(this.ship.x, this.ship.y, this.target.x, this.target.y);
            if (d < 1) {
                this.ship.body.reset(this.target.x, this.target.y);
                this.target.x = null;
                this.target.y = null;
            }
            else {
                this.physics.moveToObject(this.ship, this.target, shipSpeed(d, this.distanceToMove) + 30);
            }
        }

        // moving environment visuals
        this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }
}

function shipSpeed(currentPosition, totalDistance) {
    const maxSpeed = 200 * totalDistance > 200 ? 200 : 200 * totalDistance;
    const midPosition = totalDistance / 2;

    let factor = 0;
    if (currentPosition < midPosition) {
        factor = currentPosition / midPosition;
    } else {
        factor = 1 - (currentPosition - midPosition) / midPosition;
    }
    return maxSpeed * factor;
}

function loadTextures(scene) {
    scene.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
    scene.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });
}

export default TestScene;