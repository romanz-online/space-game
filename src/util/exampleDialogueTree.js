const dialogueTree = {
    start: {
        text: 'Welcome to the game! What do you want to do?',
        options: [
            { text: 'Explore', next: 'explore' },
            { text: 'Talk to a character', next: 'talk' }
        ]
    },
    explore: {
        text: 'You find a hidden treasure. What do you do?',
        options: [
            { text: 'Take it', next: 'treasure' },
            { text: 'Leave it', next: 'leave' }
        ]
    },
    treasure: {
        text: 'You took the treasure. You win!',
        options: []
    },
    leave: {
        text: 'You left the treasure. Game over.',
        options: []
    },
    talk: {
        text: 'You talk to a character. What do you want to say?',
        options: [
            { text: 'Ask for help', next: 'help' },
            { text: 'Walk away', next: 'walkAway' }
        ]
    },
    help: {
        text: 'The character helps you. You win!',
        options: []
    },
    walkAway: {
        text: 'You walked away. Game over.',
        options: []
    }
};

export default dialogueTree;