// k6 run create-multiple-members-per-rooms.js

import http from 'k6/http';
import { sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
    scenarios: {
        joiningOneMemberAtATimeDuringTenSeconds: {
            executor: 'per-vu-iterations',
            startTime: '2s',  // leave some time for the rooms to be created
            vus: 1,
            iterations: 10
        },

        joiningTenMembersAtATimeDuringFourtySeconds: {
            executor: 'per-vu-iterations',
            startTime: '15s',
            vus: 10,
            iterations: 40
        }
    }
};

const backendUrl = 'http://localhost:5237';

const createRooms = (roomCountToCreate) => {
    const roomsCreated = [];
    for(let i = 1; i<= roomCountToCreate; i++){
        const maybeRoomIdCreated = createRoom(`Leader${i}`);
        if(maybeRoomIdCreated)
            roomsCreated.push(maybeRoomIdCreated);
    }

    return roomsCreated;
}

const createRoom = (withLeaderName) => {
    const payload = JSON.stringify({ LeaderName: withLeaderName });
    const params = { headers: {'Content-Type': 'application/json' } };
    
    const response = http.post(`${backendUrl}/api/votingRoom/newRoom`, payload, params);
    return response.status === 200
    ? JSON.parse(response.body).newRoomId
    : undefined;
}

const getRandomRoomId = (fromRooms) => {
    const roomIndex = Math.floor(Math.random() * fromRooms.length);
    return fromRooms[roomIndex];
}

const joinMemberToAnyRoom = (fromTestId, testContextData) => {
    const withMemberName = `Member_${fromTestId}`;
    const toRoomId = getRandomRoomId(testContextData.rooms);
    
    const payload = JSON.stringify({ ToRoomId: toRoomId, MemberName: withMemberName });
    const params = { headers: {'Content-Type': 'application/json' } };
    
    const response = http.post(`${backendUrl}/api/votingRoom/newMember`, payload, params);
    /*if(response.status === 200)
        console.log(`Member id generated: ${response.body}`);
    */
}

export function setup() {
    const roomsCreated = createRooms(20);
    return { rooms: roomsCreated };
}

export default function (data) {
    joinMemberToAnyRoom(uuidv4(), data);
    sleep(1);
}
