export class InputHandler {
    constructor() {
        this.keys = { left: false, right: false, jump: false };
        this.touchStates = { left: false, right: false, jump: false };
        this.blockedCodes = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS'];

        window.addEventListener('keydown', (e) => {
            if (this.blockedCodes.includes(e.code)) e.preventDefault();
            this.handleKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            if (this.blockedCodes.includes(e.code)) e.preventDefault();
            this.handleKey(e.code, false);
        });

        this.setupTouchControls();
    }

    handleKey(code, isPressed) {
        if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = isPressed;
        if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = isPressed;
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') this.keys.jump = isPressed;
    }

    setupTouchControls() {
        const btnLeft = document.getElementById('touch-left');
        const btnRight = document.getElementById('touch-right');
        const btnJump = document.getElementById('touch-jump');

        if (!btnLeft || !btnRight || !btnJump) return;

        const bindControl = (element, keyProp) => {
            // --- СОБЫТИЯ СЕНСОРА (для телефонов) ---
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchStates[keyProp] = true;
                this.syncInputs();
            }, { passive: false });

            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchStates[keyProp] = false;
                this.syncInputs();
            }, { passive: false });

            element.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.touchStates[keyProp] = false;
                this.syncInputs();
            }, { passive: false });

            // --- СОБЫТИЯ МЫШИ (для тестов на компьютере) ---
            element.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touchStates[keyProp] = true;
                this.syncInputs();
            });

            // Отслеживаем отпускание мыши на всем окне, чтобы кнопка не залипала, если увести курсор в сторону
            window.addEventListener('mouseup', () => {
                if (this.touchStates[keyProp]) {
                    this.touchStates[keyProp] = false;
                    this.syncInputs();
                }
            });
        };

        bindControl(btnLeft, 'left');
        bindControl(btnRight, 'right');
        bindControl(btnJump, 'jump');
    }

    syncInputs() {
        this.keys.left = this.touchStates.left;
        this.keys.right = this.touchStates.right;
        this.keys.jump = this.touchStates.jump;
    }

    clearKeys() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.jump = false;
        this.touchStates.left = false;
        this.touchStates.right = false;
        this.touchStates.jump = false;
    }
}




