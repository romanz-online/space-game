import { Scene, Math as pMath } from 'phaser';
const { Vector2 } = pMath;
import LoadingBarAction from '../util/loadingBarAction';
// import Bullet from '../objects/bullet';

let asteroids; // TODO: change to just "objects" (all the objects contained in the scene)
let Overlay; // handles all the UI elements

class TestScene extends Scene {
    constructor(resolutionConfig) {
        super({ key: 'TestScene', active: true });
        this.resolution = resolutionConfig;
    }

    distanceToMove = null; // distance that the ship has to travel -- doesn't change while ship is flying
    movementEnabled = true; // using this to disable movement during certain interactions
    currentSpeed = 30; // current speed of the ship
    taperOffPoint = -1; // used to keep track of where the ship starts slowing down during movement
    currentPlayerAction = null; // keeps track of what action is currently being performed so that it can be cancelled, etc.
    target = new Vector2(); // coordinates for the ship to fly to

    preload() {
        this.load.image('background', 'assets/tests/space/nebula.jpg');
        this.load.image('stars', 'assets/tests/space/stars.png');
        this.load.atlas('space', 'assets/tests/space/space.png', 'assets/tests/space/space.json');

        this.load.image('small_freighter', 'assets/small_freighter.png');

        // for the loading bar
        // TODO: should probably go into overlay.js, but I'm not sure. It might be a bit messy
        this.load.atlas('ui', 'assets/ui/nine-slice.png', 'assets/ui/nine-slice.json');
    }

    create() {
        Overlay = this.scene.get('OverlayScene');

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
        this.bg = this.add.tileSprite(this.resolution.width / 2, this.resolution.height / 2, this.resolution.width, this.resolution.height, 'background').setScrollFactor(0);

        //  Add our planets, etc.
        this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
        this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
        this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

        const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
        this.tweens.add({
            targets: galaxy,
            angle: 360,
            duration: 100000,
            ease: 'Linear',
            loop: -1
        });

        for (let i = 0; i < 8; i++) {
            this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
        }

        this.stars = this.add.tileSprite(this.resolution.width / 2, this.resolution.height / 2, this.resolution.width, this.resolution.height, 'stars').setScrollFactor(0);

        asteroids = this.physics.add.staticGroup();
        asteroids.create(4300, 3000) // coordinates
            .play('asteroid1-anim') // play the animated sprite
            .setSize(400, 400) // hitbox for detecting proximity
            .refreshBody(); // need to do this to make the object load in
        asteroids.create(3700, 3000)
            .play('asteroid1-anim')
            .setSize(400, 400)
            .refreshBody();

        // this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);
        this.ship = this.physics.add.image(4000, 3000, 'small_freighter').setDepth(2);
        this.ship.setDrag(300);
        this.ship.body.setAllowGravity(false);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);
        this.cameras.main.startFollow(this.ship);

        // TODO: emitter will have to be different based on what ship is being flown
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

        // on-click movement
        this.input.on('pointerup', (pointer) => { this.moveShipToPointer(pointer); });

        // interact key
        this.input.keyboard.on('keyup-E', () => {
            // TODO: when adding more interactable objects, change this to check for ALL overlapping objects
            // and then detect what type of object is closest, decide which action to take and then interact with it

            // Check for overlap between the ship and asteroids
            const overlappingObjects = asteroids.getChildren().filter(asteroid => {
                return Phaser.Geom.Intersects.RectangleToRectangle(this.ship.getBounds(), asteroid.getBounds());
            });

            if (overlappingObjects.length > 0) {
                this.stopShipMovement({ x: this.ship.x, y: this.ship.y });

                const closestObject = this.getClosestObject(overlappingObjects);

                this.currentPlayerAction = new LoadingBarAction(this, closestObject);
                this.currentPlayerAction.onDestroy.on(LoadingBarAction.COMPLETED, () => {
                    Overlay.createPopup(`Object at ${closestObject.x}, ${closestObject.y} has been interacted with.`);
                    closestObject.destroy();
                    this.currentPlayerAction.onDestroy.off(LoadingBarAction.COMPLETED);
                    this.currentPlayerAction = null;
                });
            }
        });

        // temporary key to test scene switching
        this.input.keyboard.on('keyup-SPACE', () => { this.switchScene('TestScene1') });
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
                this.stopShipMovement(this.target);
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

    // TODO: move all of these helper functions into a space where multiple scenes can use them
    // here's a question: is it even necessary to have multiple scenes for star systems to switch between?
    // it may be enough to just switch out the objects and assets depending on an outside configuration
    // e.g. a json + database

    getClosestObject(objectList) {
        const firstObj = objectList[0];
        return objectList.reduce((distance, obj) => {
            const objDistance = pMath.Distance.Between(this.ship.x, this.ship.y, obj.x, obj.y);
            return (objDistance < distance) ? { obj, distance: objDistance } : obj;
        }, { obj: firstObj, distance: pMath.Distance.Between(this.ship.x, this.ship.y, firstObj.x, firstObj.y) });
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

    moveShipToPointer(pointer) {
        if (!this.movementEnabled) {
            return;
        }

        if (this.currentPlayerAction) {
            this.currentPlayerAction.onDestroy.off(LoadingBarAction.COMPLETED);
            this.currentPlayerAction.destroy();
            this.currentPlayerAction = null;
        }

        if (this.movementLine) {
            this.movementLine.destroy();
        }

        const { worldX, worldY } = pointer;
        this.target.x = worldX;
        this.target.y = worldY;

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
    }

    stopShipMovement(position) {
        this.ship.body.reset(position.x, position.y);
        this.target.x = null;
        this.target.y = null;
        this.taperOffPoint = -1;
        this.currentSpeed = 0;
        if (this.movementLine) {
            this.movementLine.destroy();
        }
    }

    destroyAsteroid(asteroid) {

    }

    switchScene(s) {
        this.scene.start(s);
    }
}

export default TestScene;