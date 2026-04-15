(function() {
    const coinContainer = document.getElementById('coin-container');
    if (!coinContainer) return;

    coinContainer.style.position = 'relative';
    coinContainer.style.width = '420px';
    coinContainer.style.height = '420px';
    coinContainer.style.perspective = '1200px';
    coinContainer.style.overflow = 'visible';

    const coin = document.createElement('div');
    coin.style.width = '100%';
    coin.style.height = '100%';
    coin.style.position = 'absolute';
    coin.style.top = '0';
    coin.style.left = '0';
    coin.style.transformStyle = 'preserve-3d';
    coin.style.animation = 'rotateAEGISCoin 11s linear infinite';
    coin.style.transform = 'rotateX(18deg)';

    const createFace = (transform) => {
        const face = document.createElement('div');
        face.style.position = 'absolute';
        face.style.width = '100%';
        face.style.height = '100%';
        face.style.borderRadius = '50%';
        face.style.overflow = 'hidden';
        face.style.backfaceVisibility = 'hidden';
        face.style.boxShadow = '0 30px 80px rgba(0,0,0,0.25)';
        face.style.transform = transform;

        const image = document.createElement('img');
        image.src = '/coin.png';
        image.alt = 'AEGIS Coin';
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.objectFit = 'contain';
        image.style.display = 'block';

        face.appendChild(image);
        return face;
    };

    const frontFace = createFace('translateZ(18px)');
    const backFace = createFace('rotateY(180deg) translateZ(18px)');

    const edge = document.createElement('div');
    edge.style.position = 'absolute';
    edge.style.left = '50%';
    edge.style.top = '0';
    edge.style.width = '36px';
    edge.style.height = '100%';
    edge.style.borderRadius = '50%';
    edge.style.transform = 'translateX(-50%) rotateY(90deg)';
    edge.style.background = 'linear-gradient(90deg, #d2d2d2 0%, #444444 45%, #222222 55%, #d2d2d2 100%)';
    edge.style.boxShadow = 'inset 0 0 24px rgba(0,0,0,0.4)';

    const glow = document.createElement('div');
    glow.style.position = 'absolute';
    glow.style.inset = '0';
    glow.style.borderRadius = '50%';
    glow.style.pointerEvents = 'none';
    glow.style.boxShadow = '0 0 90px rgba(98, 126, 234, 0.25), inset 0 0 40px rgba(20, 241, 149, 0.12)';

    coin.appendChild(frontFace);
    coin.appendChild(backFace);
    coin.appendChild(edge);
    coin.appendChild(glow);
    coinContainer.appendChild(coin);

    const style = document.createElement('style');
    style.textContent = '@keyframes rotateAEGISCoin { 0% { transform: rotateY(0deg) rotateX(18deg); } 100% { transform: rotateY(360deg) rotateX(18deg); } }';
    document.head.appendChild(style);
})();
