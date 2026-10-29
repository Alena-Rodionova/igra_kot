import { handleXCollisions, handleYCollisions } from './collision.js';

export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 36;   
        this.height = 54;  
        this.reset();
        
        this.speed = 280;         
        this.gravity = 1400;       
        this.jumpForce = -550;     
        this.animTime = 0;
    }

    reset() {
        this.x = 60;
        this.y = this.gameHeight - 150;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.facingRight = true;
    }

    update(input, dt, platforms) {
        this.animTime += dt * 12; // Слегка ускорен таймер анимации для живости шагов

        if (input.keys.left && !input.keys.right) {
            this.velocityX = -this.speed;
            this.facingRight = false;
        } else if (input.keys.right && !input.keys.left) {
            this.velocityX = this.speed;
            this.facingRight = true;
        } else {
            this.velocityX = 0;
        }

        this.x += this.velocityX * dt;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.gameWidth) this.x = this.gameWidth - this.width;

        handleXCollisions(this, platforms);

        if (input.keys.jump && this.onGround) {
            this.velocityY = this.jumpForce;
            this.onGround = false;
        }

        this.onGround = false;
        this.velocityY += this.gravity * dt;
        this.y += this.velocityY * dt;

        handleYCollisions(this, platforms);
    }

    draw(ctx) {
        ctx.save();
        
        // Матрица трансформации строго на подошве стоп
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        
        let bounceY = 0;
        let walkSwing = 0;
        if (this.velocityX !== 0 && this.onGround) {
            walkSwing = Math.sin(this.animTime);
            // Увеличена амплитуда наклона корпуса (0.07 вместо 0.04) для отчетливого бега
            ctx.rotate(walkSwing * 0.07);
            // Тело пружинит вверх-вниз сильнее
            bounceY = -Math.abs(Math.cos(this.animTime)) * 3.5;
        }
        
        ctx.translate(-this.width / 2, -this.height + bounceY);

        // --- 1. СВЕТЛЫЕ ДЛИННЫЕ НОЖКИ (поочередно двигаются вперед-назад) ---
        ctx.fillStyle = '#fff9c4'; // Цвет пастельной кожи (светлые ножки)
        
        let leftLegOffset = 0;
        let rightLegOffset = 0;
        if (this.velocityX !== 0 && this.onGround) {
            // Реалистичное смещение шагов по горизонтали на базе синусоиды
            leftLegOffset = Math.sin(this.animTime) * 4;
            rightLegOffset = -Math.sin(this.animTime) * 4;
        }
        
        // Левая ножка
        ctx.fillRect(9 + leftLegOffset, this.height - 14, 5, 14);
        // Правая ножка
        ctx.fillRect(this.width - 14 + rightLegOffset, this.height - 14, 5, 14);

        // Туфельки оранжевого цвета (акцент)
        ctx.fillStyle = '#ffa726';
        ctx.fillRect(8 + leftLegOffset, this.height - 3, 7, 3);
        ctx.fillRect(this.width - 15 + rightLegOffset, this.height - 3, 7, 3);

        // --- 2. ВЫРАЖЕННАЯ ШЕЯ ---
        ctx.fillStyle = '#fff9c4'; 
        ctx.fillRect(this.width / 2 - 2.5, 17, 5, 6);

        // --- 3. ТЕЛО (Узкая талия и аккуратная юбка А-силуэта) ---
        ctx.fillStyle = '#b39ddb'; 
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 6, 22);
        ctx.lineTo(this.width / 2 + 6, 22);
        ctx.lineTo(this.width / 2 + 3.5, 28);
        ctx.quadraticCurveTo(this.width / 2 + 12, 33, this.width - 4, this.height - 12);
        ctx.lineTo(4, this.height - 12);
        ctx.quadraticCurveTo(this.width / 2 - 12, 33, this.width / 2 - 3.5, 28);
        ctx.closePath();
        ctx.fill();

        // Оранжевый поясок на талии
        ctx.fillStyle = '#ffa726';
        ctx.fillRect(this.width / 2 - 3.5, 26, 7, 3.5);

        // --- 4. РУКИ (Широкие выразительные взмахи при движении) ---
        ctx.strokeStyle = '#b39ddb';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        
        // Амплитуда размаха рук увеличена (0.75 вместо 0.4)
        let leftHandAngle = this.velocityX !== 0 ? walkSwing * 0.75 : 0.2;
        let rightHandAngle = this.velocityX !== 0 ? -walkSwing * 0.75 : 0.2;

        // Левая рука
        ctx.save();
        ctx.translate(this.width / 2 - 5.5, 23);
        ctx.rotate(leftHandAngle + Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 9); ctx.stroke();
        ctx.fillStyle = '#fff9c4'; ctx.beginPath(); ctx.arc(0, 9, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Правая рука
        ctx.save();
        ctx.translate(this.width / 2 + 5.5, 23);
        ctx.rotate(rightHandAngle - Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 9); ctx.stroke();
        ctx.fillStyle = '#fff9c4'; ctx.beginPath(); ctx.arc(0, 9, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // --- 5. ГОЛОВА И ЛИЦО ---
        ctx.fillStyle = '#fff9c4'; 
        ctx.beginPath();
        ctx.arc(this.width / 2, 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Волосы
        ctx.fillStyle = '#7e57c2';
        ctx.beginPath();
        ctx.arc(this.width / 2, 8, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(this.width / 2 - 12, 8, 4.5, 13);
        ctx.fillRect(this.width / 2 + 7.5, 8, 4.5, 13);

        // Глазки
        ctx.fillStyle = '#311b92';
        let lookDir = this.facingRight ? 1.5 : -1.5;
        ctx.beginPath();
        ctx.arc(this.width / 2 - 3 + lookDir, 10, 2, 0, Math.PI * 2);
        ctx.arc(this.width / 2 + 4 + lookDir, 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Розовые щечки
        ctx.fillStyle = 'rgba(244, 143, 177, 0.5)';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 5 + lookDir, 12.5, 2, 0, Math.PI * 2);
        ctx.arc(this.width / 2 + 6 + lookDir, 12.5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}





