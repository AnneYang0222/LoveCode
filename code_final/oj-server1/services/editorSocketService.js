const redisClient = require('../modules/redisClient');
const TIMEOUT_IN_SECONDS = 3600;
module.exports = function(io) {
    // collaboraiton sessions
    const collaborations = {};
    // {
    //     1: {
    //         'participants': [123, 234, 345]
    //     }
    // }
    // map from socketId to sessionid
    const sessionPath = '/temp_sessions/';
    const socketIdToSessionId = {};

    io.on('connection', (socket) => {
        // console.log(socket);
        // const message = socket.handshake.query['message'];
        // console.log(message);

        // io.to(socket.id).emit('message', 'hhahaha from server');
        const sessionId = socket.handshake.query['sessionId'];

        socketIdToSessionId[socket.id] = sessionId;

        // if (!(sessionId in collaborations)) {
        //     collaborations[sessionId] = {
        //         'participants': []
        //     };
        // }
        // collaborations[sessionId]['participants'].push(socket.id);
        if (sessionId in collaborations) {
            collaborations[sessionId]['participants'].push(socket.id);
        } else {
            redisClient.get(sessionPath + '/' + sessionId, data => {
                if (data) {
                    console.log('session terminated perviously, pulling back from redis');
                    collaborations[sessionId] = {
                        'cachaedInstructions': JSON.parse(data),
                        'participants': []
                    };
                } else {
                    console.log('creating new session');
                    collaborations[sessionId] = {
                        'cachaedInstructions': [],
                        'participants': []
                    }
                }
                collaborations[sessionId]['participants'].push(socket.id);
            });
        }


        socket.on('change', delta => {
            // const sessionId = socketIdToSessionId[socket.id];
            // if (sessionId in collaborations) {
            //     collaborations[sessionId]['cachaedInstructions'].push(['change', delta, Date.now()]); 
            // }
            // if (sessionId in collaborations) {
            //     const participants = collaborations[sessionId]['participants'];
            //     for (let participant of participants) {
            //         if (socket.id !== participant) {
            //             io.to(participant).emit('change', delta);
            //         }
            //     }
            // } else {
            //     console.error('error');
            // }
            const sessionId = socketIdToSessionId[socket.id];
            if (sessionId in collaborations) {
                collaborations[sessionId]['cachaedInstructions'].push(['change', delta, Date.now()]);
            }

            forwardEvent(socket.id, 'change', delta);
        });

        socket.on('cursorMove', cursor => {
            console.log('cursor move for session: ' + socketIdToSessionId[socket.id] + ', socketId' + socket.id);
            cursor = JSON.parse(cursor);
            cursor['socketId'] = socket.id;
            forwardEvent(socket.id, 'cursorMove', JSON.stringify(cursor));
        });

        socket.on('restoreBuffer', () => {
            const sessionId = socketIdToSessionId[socket.id];
            if (sessionId in collaborations) {
                const instructions = collaborations[sessionId]['cachaedInstructions'];
                for (let instruction of instructions) {
                    socket.emit(instruction[0], instruction[1]);
                }
            }
        });

        socket.on('disconnect', () => {
            const sessionId = socketIdToSessionId[socket.id];
            let foundAndRemove = false;
            if (sessionId in collaborations) {
                const participants = collaborations[sessionId]['participants'];
                const index = participants.indexOf(socket.id);
                if (index >= 0) {
                    participants.splice(index, 1);
                    foundAndRemove = true;
                    if (participants.length === 0) {
                        const key = sessionPath + '/' + sessionId;
                        const value = JSON.stringify(collaborations[sessionId]['cachaedInstructions']);
                        redisClient.set(key, value, redisClient.redisPrint);
                        redisClient.expire(key, TIMEOUT_IN_SECONDS);
                        delete collaborations[sessionId];
                    }
                }
            }
            if (!foundAndRemove) {
                console.error('warning');
            }
        });
    });

    const forwardEvent = function(socketId, eventName, dataString) {
        const sessionId = socketIdToSessionId[socketId];
        if (sessionId in collaborations) {
            const participants = collaborations[sessionId]['participants'];
            for(let participant of participants) {
                if (socketId != participant) {
                    io.to(participant).emit(eventName, dataString);
                }
            }
        } else {
            console.warn('WARNING');
        }
    }
}