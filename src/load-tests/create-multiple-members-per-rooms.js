// k6 run create-multiple-members-per-rooms.js

import http from 'k6/http';
import { vu } from 'k6/execution';
import { sleep } from 'k6';

export const options = {
    scenarios: {
        creatingTenRooms: {
            executor: 'per-vu-iterations',
            startTime: '0s',
            vus: 1,
            iterations: 10,
            env: { phaseName: 'creatingRooms' }
        },

        joiningSomeMembersToEachRoom: {
            executor: 'per-vu-iterations',
            startTime: '1s',
            vus: 1,
            iterations: 1,
            env: { phaseName: 'joiningToRooms' }
        }
      }
  };

const rooms = [];

const createRoom = (fromTestId, withBackendUrl) => {
    const payload = JSON.stringify({ LeaderName: `Leader${fromTestId}` });
    const params = { headers: {'Content-Type': 'application/json' } };
    
    const response = http.post(`${withBackendUrl}/api/votingRoom/newRoom`, payload, params);
    if(response.status === 200)
        rooms.push(JSON.parse(response.body).newRoomId);
}

const getRandomRoomId = () => {
    const roomIndex = Math.floor(Math.random() * rooms.length);
    return rooms[roomIndex];
}

const joinMembersToRooms = (fromTestId, withBackendUrl) => {
    const withMemberName = `Member${fromTestId}`;
    const toRoomId = getRandomRoomId();
    console.log(`[${rooms.length} rooms] Joining to room ${toRoomId} - TestID: ${fromTestId} - with member name: ${withMemberName}`);
    
    const payload = JSON.stringify({ ToRoomId: toRoomId, MemberName: withMemberName });
    const params = { headers: {'Content-Type': 'application/json' } };
    
    const response = http.post(`${withBackendUrl}/api/votingRoom/newMember`, payload, params);
    if(response.status === 200)
        console.log(`Member id generated: ${response.body}`);
}

export default function () {
    const backendUrl = 'http://localhost:5237';

    if(__ENV.phaseName === 'creatingRooms'){
        createRoom(vu.idInTest, backendUrl);
        sleep(0.02);
    }
    else if(__ENV.phaseName === 'joiningToRooms')
        joinMembersToRooms(vu.idInTest, backendUrl);
}
