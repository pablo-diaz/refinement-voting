// k6 run create-multiple-rooms.js

import http from 'k6/http';
import { vu } from 'k6/execution';

export const options = {
    discardResponseBodies: true,
    scenarios: {
        tenUsersCreatingOneRoomEach: {
            executor: 'constant-arrival-rate',
            startTime: '0s',
            duration: '10s',
            timeUnit: '1s',
            rate: 1,
            preAllocatedVUs: 10
        },

        tenUsersCreatingFiveRoomsEach: {
            executor: 'constant-arrival-rate',
            startTime: '15s',
            duration: '10s',
            timeUnit: '1s',
            rate: 5,
            preAllocatedVUs: 50
        },

        twentyUsersCreatingThirtyRoomsEach: {
            executor: 'constant-arrival-rate',
            startTime: '30s',
            duration: '20s',
            timeUnit: '1s',
            rate: 30,
            preAllocatedVUs: 60
        }
      }
  };

const leaderNames = ["Carlos Andres", "Juan David", "Daniel", "Paola", "Karla", "Cristina"];

const getLeaderName = forTestId => {
      const index = (forTestId - 1) % leaderNames.length;
      return leaderNames[index];
}

export default function () {
    const backendUrl = 'http://localhost:5237';

    const payload = JSON.stringify({ LeaderName: getLeaderName(vu.idInTest) });
    const params = { headers: {'Content-Type': 'application/json' } };

    http.post(`${backendUrl}/api/votingRoom/newRoom`, payload, params);
}
