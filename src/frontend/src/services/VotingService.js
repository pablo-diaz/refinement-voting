import axios from "axios";

const apiSetup = {
    backendBaseUrl: 'https://localhost:7177/api/votingRoom'
}

const createVotingRoom = async withLeaderName => {
    const postBody = { LeaderName: withLeaderName };
    const { data } = await axios.post(`${apiSetup.backendBaseUrl}/newRoom`, postBody);
    return data;
};

const joinVotingRoom = async (withMemberName, withRoomId) => {
    const postBody = { MemberName: withMemberName, ToRoomId: withRoomId };
    const { data } = await axios.post(`${apiSetup.backendBaseUrl}/newMember`, postBody);
    return data;
};

export default {
    createVotingRoom,
    joinVotingRoom
};
