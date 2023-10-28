import { Scene, Math as pMath } from 'phaser';
const { Vector2 } = pMath;
import Bullet from '../objects/bullet'

let asteroids;

class TestScene extends Scene {
    constructor(resolutionConfig) {
        super({ key: 'TestScene', active: true });
        this.resolution = resolutionConfig;
    }

    lastFired = 0;
    distanceToMove = null;
    movementEnabled = true;
    currentSpeed = 30;
    taperOffPoint = -1;
    openDialog = false; // move this openDialog stuff to OverlayScene. it should be the one to handle this

    preload() {
        this.load.image('background', 'assets/tests/space/nebula.jpg');
        this.load.image('stars', 'assets/tests/space/stars.png');
        this.load.atlas('space', 'assets/tests/space/space.png', 'assets/tests/space/space.json');

        this.load.image('small_freighter', 'assets/small_freighter.png');

        this.load.atlas('ui', 'assets/ui/nine-slice.png', 'assets/ui/nine-slice.json');
    }

    create() {
        loadTextures(this);

        this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid1-anim', frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid2-anim', frames: this.anims.generateFrameNumbers('asteroid2-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid3-anim', frames: this.anims.generateFrameNumbers('asteroid3-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid4-anim', frames: this.anims.generateFrameNumbers('asteroid4-sheet', { start: 0, end: 23 }), frameRate: 20, repeat: -1 });

        //  World size is 8000 x 6000
        this.bg = this.add.tileSprite(this.resolution.width / 2, this.resolution.height / 2, this.resolution.width, this.resolution.height, 'background').setScrollFactor(0);

        //  Add our planets, etc
        this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
        const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
        this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
        this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

        asteroids = this.physics.add.staticGroup();
        asteroids.create(4300, 3000) // coordinates
            .play('asteroid1-anim') // play the animated sprite
            .setSize(400, 400) // hitbox for detecting proximity
            .refreshBody(); // need to do this to make the object load in

        asteroids.create(3700, 3000)
            .play('asteroid1-anim')
            .setSize(400, 400)
            .refreshBody();

        for (let i = 0; i < 8; i++) {
            this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
        }

        this.stars = this.add.tileSprite(this.resolution.width / 2, this.resolution.height / 2, this.resolution.width, this.resolution.height, 'stars').setScrollFactor(0);

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

        this.physics.add.overlap(this.ship, asteroids, function (ship, asteroid) {
            // if (!this.openDialog) {
            //     this.openDialog = true;
            //     SCENE.get('OverlayScene').createPopup('Ship has entered the vicinity of an asteroid.');
            // }
        }, null, this);

        this.input.keyboard.on('keydown-SPACE', () => {
            // Check for overlap between the ship and asteroids
            const overlappingAsteroids = asteroids.getChildren().filter(asteroid => {
                return Phaser.Geom.Intersects.RectangleToRectangle(this.ship.getBounds(), asteroid.getBounds());
            });

            if (overlappingAsteroids.length > 0) {
                // The ship is overlapping with at least one asteroid
                const closestAsteroid = overlappingAsteroids.reduce((distance, asteroid) => {
                    const asteroidDistance = pMath.Distance.Between(this.ship.x, this.ship.y, asteroid.x, asteroid.y);
                    return (asteroidDistance < distance) ? { asteroid, distance: asteroidDistance } : asteroid;
                }, { asteroid: overlappingAsteroids[0], distance: pMath.Distance.Between(this.ship.x, this.ship.y, overlappingAsteroids[0].x, overlappingAsteroids[0].y) });

                console.log('the closest asteroid is at', closestAsteroid.x, ',', closestAsteroid.y);

                const loadingBar = this.add.nineslice(this.ship.x, this.ship.y, 'ui', 'ButtonOrange');
                const loadingFill = this.add.nineslice(this.ship.x - 114, this.ship.y - 2, 'ui', 'ButtonOrangeFill1', 13, 39, 6, 6);

                loadingFill.setOrigin(0, 0.5);

                this.tweens.add({
                    targets: loadingFill,
                    width: 228,
                    duration: 3000,
                    ease: 'Linear',
                    onComplete: () => {
                        closestAsteroid.destroy();
                        loadingBar.destroy();
                        loadingFill.destroy();
                        this.scene.get('OverlayScene').createPopup('Destroyed nearby asteroid.');
                    }
                });

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
                this.taperOffPoint = -1;
                this.currentSpeed = 0;
            }
            else {
                this.currentSpeed = this.shipSpeed(d, this.distanceToMove);
                this.physics.moveToObject(this.ship, this.target, this.currentSpeed);
            }
        }

        // moving environment visuals
        this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }

    shipSpeed(currentPosition, totalDistance) {
        const maxSpeed = 200;
        const baseSpeed = 30;
        const midPosition = totalDistance / 2;
        let direction = (currentPosition > midPosition) ? 1 : -1;
        if (this.taperOffPoint === -1) {
            if (this.currentSpeed >= maxSpeed) {
                this.taperOffPoint = totalDistance - currentPosition;
            }
        }
        if (this.taperOffPoint !== -1 && currentPosition > this.taperOffPoint) {
            direction = 1;
        }

        const accel = 0.02 * direction;

        const acceleratedSpeed = this.currentSpeed + (this.currentSpeed * accel);
        if (acceleratedSpeed > maxSpeed) {
            return maxSpeed;
        }
        else if (acceleratedSpeed < baseSpeed) {
            return baseSpeed;
        }

        return acceleratedSpeed;
    }
}

function loadTextures(scene) {
    scene.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
    scene.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
    scene.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });
}

export default TestScene;