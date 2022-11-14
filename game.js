//start in the middle of the map
var x = 90;
var y = 34;

var HELD_DIRECTIONS = []; //State of which arrow keys we are holding down
var FACING_DIRECTION = 'down';
var SPEED = 0.65; //How fast the character moves in pixels per frame
var GAME_STATE = 'ON';
var AVAILABLE_INTERACTION = [];
var PLAYER_EVENT = null;
var ACTIVE_MAP = null;

var maps = [
    {
        id: 'TOP_FLOOR',
        path: '/assets/maps/top_floor.png',
        starting_position: [
            {
                source_id: 'DEFAULT',
                x: 90,
                y: 60,
            },
            {
                source_id: 'BOTTOM_FLOOR',
                x: 17,
                y: 94,
            },
        ],
        map_bounds: [9, 168, 8, 112],
    },
    {
        id: 'BOTTOM_FLOOR',
        path: '/assets/maps/ground_floor.png',
        starting_position: [
            {
                source_id: 'TOP_FLOOR',
                x: 18,
                y: 28,
            },
        ],
        map_bounds: [9, 168, 26, 126],
    },
];

// Selector
var character = document.querySelector('.character');
var map = document.querySelector('.map');
var dialog = document.querySelector('.dialog');

const placeCharacter = () => {
    var pixelSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pixel-size'));

    const held_direction = HELD_DIRECTIONS[0];
    if (PLAYER_EVENT !== 'IN_DIALOG' && held_direction) {
        if (held_direction === directions.right) {
            x += SPEED;
        }
        if (held_direction === directions.left) {
            x -= SPEED;
        }
        if (held_direction === directions.down) {
            y += SPEED;
        }
        if (held_direction === directions.up) {
            y -= SPEED;
        }
        FACING_DIRECTION = held_direction;
        character.setAttribute('facing', held_direction);
    }

    document.querySelector('.debug pre').innerText = JSON.stringify(
        {
            HELD_DIRECTIONS: HELD_DIRECTIONS[0] || null,
            FACING_DIRECTION,
            SPEED,
            position: {
                x,
                y,
            },
            GAME_STATE,
            PLAYER_EVENT,
            ACTIVE_MAP,
        },
        null,
        2
    );

    if (PLAYER_EVENT === 'IN_DIALOG') {
        character.setAttribute('walking', 'false');
    } else {
        character.setAttribute('walking', held_direction ? 'true' : 'false');
    }

    //Limits (gives the illusion of walls)
    const [leftLimit, rightLimit, topLimit, bottomLimit] = ACTIVE_MAP.map_bounds;

    // Map Limit Collision
    if (x < leftLimit) {
        x = leftLimit;
    }
    if (x > rightLimit) {
        x = rightLimit;
    }
    if (y < topLimit) {
        y = topLimit;
    }
    if (y > bottomLimit) {
        y = bottomLimit;
    }

    // Staircase Collision
    if (ACTIVE_MAP.id === 'TOP_FLOOR') {
        TOP_FLOOR_LOGIC();
    }

    if (ACTIVE_MAP.id === 'BOTTOM_FLOOR') {
        BOTTOM_FLOOR_LOGIC();
    }

    var camera_left = pixelSize * 66;
    var camera_top = pixelSize * 42;
    map.style.transform = `translate3d( ${-x * pixelSize + camera_left}px, ${-y * pixelSize + camera_top}px, 0 )`;
    character.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`;

    function TOP_FLOOR_LOGIC() {
        if (y > 54 && y < 56 && x < 41 && x > 23) {
            y = 54;
        }
        if (x < 34 && y > 57 && x > 23) {
            x = 23;
        }
        if (y > 57 && x > 25 && x < 41) {
            x = 41;
        }

        // Table Collision
        if (held_direction && held_direction === directions.right && x > 135 && y < 30) {
            x = 135;
        }
        if (held_direction && held_direction === directions.up && x > 135 && y < 30) {
            y = 30;
        }

        // Coomputer Interaction
        if (PLAYER_EVENT === null && x > 150 && y < 32) {
            AVAILABLE_INTERACTION.push('COMPUTER_INTERACTION');
            dialog.innerText = `Press 'E' to interact`;
            dialog.style.right = '-89px';
            dialog.style.top = '103px';
            dialog.classList.remove('d-none');
        }

        if (x < 135 || y > 32) {
            dialog.classList.add('d-none');
        }

        if (x < 25 && y > 100 && PLAYER_EVENT === null && GAME_STATE === 'ON') {
            // Map Change
            PLAYER_EVENT = 'CHANGING_MAP';
            set_overworld('BOTTOM_FLOOR', 'TOP_FLOOR');
        }
    }

    function BOTTOM_FLOOR_LOGIC() {
        if (x < 23 && y < 27 && PLAYER_EVENT === null && GAME_STATE === 'ON') {
            // Map Change
            PLAYER_EVENT = 'CHANGING_MAP';
            set_overworld('TOP_FLOOR', 'BOTTOM_FLOOR');
        }

        if (held_direction) {
            if (held_direction === directions.right && y < 64 && x > 21 && x < 44) {
                x = 21;
            }

            if (held_direction === directions.left && y < 64 && (x < 44) & (x > 21)) {
                x = 44;
            }

            if (held_direction === directions.up && y < 64 && (x < 44) & (x > 21)) {
                y = 64;
            }
        }
    }
};

const set_overworld = (mapId, sourceMap = 'DEFAULT') => {
    ACTIVE_MAP = maps.find((map) => map.id === mapId);
    if (ACTIVE_MAP !== undefined) {
        console.log('Found map');
        const { x: posX, y: posY } = ACTIVE_MAP.starting_position.find((pos) => pos.source_id === sourceMap);
        x = posX;
        y = posY;

        map.style.backgroundImage = `url(${ACTIVE_MAP.path})`;
    }

    PLAYER_EVENT = null;
};

//Set up the game loop
const step = () => {
    placeCharacter();
    window.requestAnimationFrame(() => {
        step();
    });
};

window.addEventListener('DOMContentLoaded', () => {
    set_overworld('TOP_FLOOR');
    step();
});

/* Direction key state */
const directions = {
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right',
};
const keys = {
    38: directions.up,
    37: directions.left,
    39: directions.right,
    40: directions.down,
    87: directions.up,
    65: directions.left,
    68: directions.right,
    83: directions.down,
};
document.addEventListener('keydown', async (e) => {
    var dir = keys[e.which];
    if (dir && HELD_DIRECTIONS.indexOf(dir) === -1) {
        HELD_DIRECTIONS.unshift(dir);
    }

    if (e.key === 'e' && PLAYER_EVENT === null && AVAILABLE_INTERACTION.includes('COMPUTER_INTERACTION')) {
        console.log("I'm here");
        PLAYER_EVENT = 'IN_DIALOG';
        const data = await fetch('https://random-data-api.com/api/users/random_user', (res) => res).then((res) => res.json());

        dialog.classList.add('d-none');

        const screenDialog = document.createElement('div');
        screenDialog.innerHTML = `<div>${JSON.stringify(data, null, 2)}</div><button id="close_screen">🔴</button>`;
        screenDialog.classList.add('screen');
        screenDialog.classList.add('animate__animated');
        screenDialog.classList.add('animate__zoomInDown');
        screenDialog.style.right = '-90px';
        screenDialog.style.top = '50px';
        map.appendChild(screenDialog);
        document.getElementById('close_screen').addEventListener('click', () => {
            document.querySelector('.screen').outerHTML = '';
            PLAYER_EVENT = null;
        });
    }

    if (e.key === 'Shift') {
        SPEED = 1.2;
        character.setAttribute('running', 'true');
    }

    if (e.key === 'o') {
        document.querySelector('.debug').classList.toggle('d-none');
    }
});

document.addEventListener('keyup', (e) => {
    var dir = keys[e.which];
    var index = HELD_DIRECTIONS.indexOf(dir);
    if (index > -1) {
        HELD_DIRECTIONS.splice(index, 1);
    }

    if (e.key === 'Shift') {
        SPEED = 0.6;
        character.setAttribute('running', 'false');
    }
});
