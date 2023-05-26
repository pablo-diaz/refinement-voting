// k6 run join-room-and-listen-to-events.js

import http from 'k6/http';
import { sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
    scenarios: {
        joiningOneMemberToAnyRoom: {
            executor: 'constant-arrival-rate',
            startTime: '2s',  // leave some time for the rooms to be created
            duration: '30s',
            rate: 1,
            timeUnit: '4s',
            preAllocatedVUs: 3,
            gracefulStop: '5s'
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

const processServerSentEvents = (forMemberId) => {
    console.log(`[Member ${forMemberId}] Starting to listend to SSE`);
    sleep(1);  // some time for this member to be added to the room

    const params = { headers: { 'Accept': 'text/event-stream' } };
    const response = http.get(`${backendUrl}/api/votingRoom/member/${forMemberId}/stream`, params);

    if(response.status === 200) {
        while(response.body.length > 0) {
            let eventSent = response.body.shift();
            console.log(`[Member ${forMemberId}] Event was received from server: ${eventSent}`);
        }
    }

    console.log(`[Member ${forMemberId}] Finished`);
}

const joinMemberToAnyRoom = (fromTestId, testContextData) => {
    const withMemberName = `Member_${fromTestId}`;
    const toRoomId = getRandomRoomId(testContextData.rooms);
    
    const payload = JSON.stringify({ ToRoomId: toRoomId, MemberName: withMemberName });
    const params = { headers: {'Content-Type': 'application/json' } };
    
    const response = http.post(`${backendUrl}/api/votingRoom/newMember`, payload, params);
    if(response.status === 200)
        processServerSentEvents(response.body);
}

export function setup() {
    const roomsCreated = createRooms(1);
    return { rooms: roomsCreated };
}

export default function (data) {
    joinMemberToAnyRoom(uuidv4(), data);
}
