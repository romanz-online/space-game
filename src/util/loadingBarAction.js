import Phaser from 'phaser';

class LoadingBarAction {
    constructor(scene, parentObject) {
        this.scene = scene;
        this.loadingBar = null;
        this.loadingFill = null;
        this.tween = null;

        this.parentObject = parentObject; // this is the object above which the loading bar appears

        // Create a custom event for destruction
        this.onDestroy = new Phaser.Events.EventEmitter();

        this.createLoadingBar();
        this.createLoadingTween();
    }

    static get COMPLETED() {
        return 'loadingBarActionCompleted';
    }

    createLoadingBar() {
        this.loadingBar = this.scene.add.nineslice(this.parentObject.x, this.parentObject.y - 80, 'ui', 'ButtonOrange');
        this.loadingFill = this.scene.add.nineslice(this.parentObject.x - 114, this.parentObject.y - 80 - 2, 'ui', 'ButtonOrangeFill1', 13, 39, 6, 6);

        this.loadingFill.setOrigin(0, 0.5);
    }

    createLoadingTween() {
        this.tween = this.scene.tweens.add({
            targets: this.loadingFill,
            width: 228,
            duration: 3000,
            ease: 'Linear',
            onComplete: () => {
                this.destroy();
            }
        });
    }

    destroy() {
        // Destroy the loading bar and cancel the tween
        if (this.tween) this.tween.stop();
        if (this.loadingBar) this.loadingBar.destroy();
        if (this.loadingFill) this.loadingFill.destroy();

        // Trigger the custom onDestroy event
        this.onDestroy.emit(LoadingBarAction.COMPLETED, this);

        // Clean up references
        this.scene = null;
        this.loadingBar = null;
        this.loadingFill = null;
        this.tween = null;
    }
}

export default LoadingBarAction;